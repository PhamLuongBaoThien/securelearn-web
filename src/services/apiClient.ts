import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { RefreshTokenResponse } from '@/types/auth.types';

type AuthContext = 'user' | 'admin';
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type SessionExpiredDetail = { context: AuthContext };
type QueuedRequest = {
  request: RetryableRequestConfig;
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};
type ApiErrorBody = { message?: string };

const API_BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL;
const SESSION_EXPIRED_EVENT = 'auth:session-expired';
const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
const ACCOUNT_LOCKED_MESSAGE = 'Tài khoản đã bị khóa';
const REFRESH_TOKEN_PATH = '/refresh-token';
const LOGIN_PATH = '/login';
const ADMIN_API_PATH = '/api/admin/';
// Media data path như HLS segment (.ts) hoặc presigned storage URL không được đi qua auth/refresh.
// Các URL này đã được bảo vệ bằng chữ ký tạm thời của storage; gắn Authorization có thể kéo refresh-token vào lúc video đang phát.
const isMediaDataPath = (url?: string) => {
  if (!url) return false;
  return (
    /\.(ts|m4s|mp4)(?:[?#]|$)/i.test(url) ||
    url.includes('/securelearn-media/') ||
    url.includes('X-Amz-Signature=') ||
    url.includes('X-Amz-Credential=')
  );
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let accessToken: string | null = null;
let accessTokenContext: AuthContext = 'user';
let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];
const refreshPromises: Partial<Record<AuthContext, Promise<string>>> = {};

// Kiểm tra request hiện tại có thuộc nhánh admin hay không.
// Dùng khi cần quyết định gọi refresh token của admin hay của user.
// Mục đích: chọn đúng auth context cho các API `/api/admin/...`.
const isAdminRequest = (url?: string) =>
  Boolean(url?.includes(ADMIN_API_PATH) || accessTokenContext === 'admin');

// Chuẩn hóa context auth từ URL request.
// Dùng trước khi refresh token hoặc phát event session-expired.
// Mục đích: mọi flow auth chỉ cần dựa vào một giá trị `user | admin` thống nhất.
const getAuthContext = (url?: string): AuthContext =>
  isAdminRequest(url) ? 'admin' : 'user';

// Trả về endpoint refresh-token tương ứng với context.
// Dùng ngay trước khi gọi API refresh.
// Mục đích: tách logic URL ra khỏi interceptor để code chính ngắn hơn.
const getRefreshUrl = (context: AuthContext) =>
  context === 'admin'
    ? `${API_BASE_URL}/api/admin/auth/refresh-token`
    : `${API_BASE_URL}/api/auth/refresh-token`;

// Quyết định lỗi 401 hiện tại có nên thử refresh token hay không.
// Dùng ở response interceptor khi request thất bại.
// Mục đích: tránh retry vô hạn với chính API refresh-token hoặc API login.
const shouldRetryWithRefresh = (error: AxiosError, request?: RetryableRequestConfig) =>
  error.response?.status === 401 &&
  Boolean(request) &&
  !isMediaDataPath(request?.url) &&
  !request?._retry &&
  !request?.url?.includes(REFRESH_TOKEN_PATH) &&
  !request?.url?.includes(LOGIN_PATH);

const isLockedAccountError = (error: AxiosError) => {
  const message = getApiErrorMessage(error);
  return error.response?.status === 403 && message.includes(ACCOUNT_LOCKED_MESSAGE);
};

const setAuthorizationHeader = (config: InternalAxiosRequestConfig, token: string) => {
  config.headers.Authorization = `Bearer ${token}`;
};

// Phát event toàn cục báo session đã hết hạn hoàn toàn.
// Dùng khi refresh-token thất bại và app cần clear auth state.
// Mục đích: tách phần network khỏi phần UI/navigation; nơi khác chỉ cần lắng nghe event này.
const emitSessionExpired = (context: AuthContext) => {
  window.dispatchEvent(
    new CustomEvent<SessionExpiredDetail>(SESSION_EXPIRED_EVENT, {
      detail: { context },
    })
  );
};

// Chuẩn hóa lỗi refresh-token về một Error có message phù hợp để hiển thị.
// Dùng trong nhánh catch của flow refresh token.
// Mục đích: ưu tiên message backend trả về, tránh để UI thấy lỗi kỹ thuật kiểu "401".
const normalizeRefreshError = (error: unknown) => {
  const responseMessage = axios.isAxiosError(error)
    ? (error.response?.data as ApiErrorBody | undefined)?.message
    : undefined;
  const normalizedError = error instanceof Error ? error : new Error(SESSION_EXPIRED_MESSAGE);

  normalizedError.message = responseMessage || normalizedError.message || SESSION_EXPIRED_MESSAGE;
  return normalizedError;
};

const getApiErrorMessage = (error: AxiosError) =>
  (error.response?.data as ApiErrorBody | undefined)?.message ||
  (!error.response && error.message === 'Network Error'
    ? 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng hoặc thử lại.'
    : '');

const applyApiErrorMessage = (error: AxiosError) => {
  const message = getApiErrorMessage(error);
  if (message) error.message = message;
};

// Giải phóng các request đang chờ trong lúc một request khác đang refresh token.
// Dùng sau khi refresh thành công hoặc thất bại.
// Mục đích: nếu refresh thành công thì cho request chờ chạy tiếp, còn nếu thất bại thì reject đồng loạt.
const processQueue = (error: unknown, token?: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(token!);
  });

  failedQueue = [];
};

// Gọi API refresh-token để lấy access token mới.
// Dùng khi request nhận 401 và đủ điều kiện retry.
// Mục đích: duy trì phiên đăng nhập mà user không phải login lại nếu refresh-token còn hạn.
const requestFreshAccessToken = async (context: AuthContext): Promise<string> => {
  const { data } = await axios.post<RefreshTokenResponse>(
    getRefreshUrl(context),
    {},
    { withCredentials: true }
  );

  if (data.status !== 'OK' || !data.access_token) {
    throw new Error(data.message || 'Refresh token thất bại');
  }

  accessToken = data.access_token;
  accessTokenContext = context;
  return data.access_token;
};

// Dùng chung một request refresh cho bootstrap auth và mọi interceptor 401 chạy đồng thời.
export const refreshSessionAccessToken = (context: AuthContext = 'user'): Promise<string> => {
  const inFlight = refreshPromises[context];
  if (inFlight) return inFlight;

  const refreshPromise = requestFreshAccessToken(context).finally(() => {
    if (refreshPromises[context] === refreshPromise) {
      delete refreshPromises[context];
    }
  });
  refreshPromises[context] = refreshPromise;
  return refreshPromise;
};

// Cập nhật access token runtime cho toàn bộ apiClient.
// Dùng sau login, logout, session recovery, hoặc refresh token thành công.
// Mục đích: request interceptor luôn đọc được token mới nhất từ memory.
export const setAccessToken = (token: string | null, context: AuthContext = 'user') => {
  accessToken = token;
  accessTokenContext = context;
};

// Trả về access token hiện đang lưu trong memory.
// Dùng khi nơi khác cần đọc token hiện tại mà không tự quản lý auth state riêng.
// Mục đích: cung cấp điểm truy cập duy nhất cho token runtime.
export const getAccessToken = () => accessToken;

// Trả về base URL hiện tại của API gateway.
// Dùng khi cần dựng URL tuyệt đối từ các module khác.
// Mục đích: không phải lặp lại logic đọc env ở nhiều nơi.
export const getApiBaseUrl = () => API_BASE_URL;

// Chạy trước khi request rời frontend.
// Việc của nó là gắn access token hiện tại vào request.
const handleRequest = (config: InternalAxiosRequestConfig) => {
  if (accessToken && !isMediaDataPath(config.url)) {
    setAuthorizationHeader(config, accessToken);
  }

  return config;
};

const waitForRefresh = (request: RetryableRequestConfig) =>
  new Promise((resolve, reject) => {
    failedQueue.push({
      request,
      resolve: (token: string) => {
        setAuthorizationHeader(request, token);
        resolve(apiClient(request));
      },
      reject,
    });
  });

const retryWithRefresh = async (request: RetryableRequestConfig) => {
  request._retry = true;
  isRefreshing = true;

  try {
    const context = getAuthContext(request.url);
    const nextToken = await refreshSessionAccessToken(context);

    processQueue(null, nextToken);
    setAuthorizationHeader(request, nextToken);
    return apiClient(request);
  } catch (refreshError) {
    const normalizedError = normalizeRefreshError(refreshError);
    accessToken = null;
    processQueue(normalizedError, null);
    emitSessionExpired(getAuthContext(request.url));
    return Promise.reject(normalizedError);
  } finally {
    isRefreshing = false;
  }
};

// Chạy khi response thành công.
// Việc của nó chỉ là trả response cho nơi gọi.
const handleResponseSuccess = (response: AxiosResponse) => response;

// Chạy khi response lỗi.
// Thứ tự xử lý: thử refresh nếu là 401 phù hợp, nếu không thì gắn message đẹp hơn.
const handleResponseError = async (error: AxiosError) => {
  const originalRequest = error.config as RetryableRequestConfig | undefined;

  if (isLockedAccountError(error)) {
    applyApiErrorMessage(error);
    accessToken = null;
    emitSessionExpired(getAuthContext(originalRequest?.url));
    return Promise.reject(error);
  }

  if (shouldRetryWithRefresh(error, originalRequest)) {
    if (!originalRequest) {
      return Promise.reject(error);
    }

    return isRefreshing ? waitForRefresh(originalRequest) : retryWithRefresh(originalRequest);
  }

  applyApiErrorMessage(error);
  return Promise.reject(error);
};

apiClient.interceptors.request.use(handleRequest, Promise.reject);
apiClient.interceptors.response.use(handleResponseSuccess, handleResponseError);

export default apiClient;


