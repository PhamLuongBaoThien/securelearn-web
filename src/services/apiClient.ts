import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import type { RefreshTokenResponse } from '@/types/auth.types';

type AuthContext = 'user' | 'admin';
type ToastableRequestConfig = InternalAxiosRequestConfig & {
  _loadingToastId?: string | number;
  _suppressLoadingToast?: boolean;
};
type RetryableRequestConfig = ToastableRequestConfig & {
  _retry?: boolean;
};

type SessionExpiredDetail = { context: AuthContext };
type QueuedRequest = {
  request: ToastableRequestConfig;
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

const API_BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL;
const SESSION_EXPIRED_EVENT = 'auth:session-expired';
const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
const REFRESH_TOKEN_PATH = '/refresh-token';
const LOGIN_PATH = '/login';
const ADMIN_API_PATH = '/api/admin/';
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const TOAST_LOADING_MESSAGE: Record<string, string> = {
  DELETE: 'Đang xóa...',
  PUT: 'Đang cập nhật...',
  PATCH: 'Đang cập nhật...',
  POST: 'Đang xử lý...',
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let accessToken: string | null = null;
let accessTokenContext: AuthContext = 'user';
let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

// Chọn text cho loading toast theo HTTP method.
// Dùng khi request mutation bắt đầu để user biết thao tác đang chạy.
// Mục đích: hiển thị trạng thái ngắn gọn như "Đang cập nhật..." thay vì toast chung chung.
const getLoadingMessage = (method?: string) =>
  TOAST_LOADING_MESSAGE[(method || '').toUpperCase()] || 'Đang tải...';

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

// Quyết định request nào được hiện loading toast.
// Dùng ở request interceptor, trước khi gửi request ra ngoài.
// Mục đích: chỉ hiện toast cho mutation và bỏ qua refresh-token để tránh nhiễu UI.
const shouldShowLoadingToast = (config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'GET').toUpperCase();
  const toastableConfig = config as ToastableRequestConfig;
  return MUTATION_METHODS.has(method) && !toastableConfig._suppressLoadingToast && !config.url?.includes(REFRESH_TOKEN_PATH);
};

// Quyết định lỗi 401 hiện tại có nên thử refresh token hay không.
// Dùng ở response interceptor khi request thất bại.
// Mục đích: tránh retry vô hạn với chính API refresh-token hoặc API login.
const shouldRetryWithRefresh = (error: AxiosError, request?: { _retry?: boolean; url?: string }) =>
  error.response?.status === 401 &&
  !request?._retry &&
  !request?.url?.includes(REFRESH_TOKEN_PATH) &&
  !request?.url?.includes(LOGIN_PATH);

// Đóng loading toast đang gắn với một request nếu có.
// Dùng khi request thành công, thất bại, hoặc bị hủy giữa chừng do refresh fail.
// Mục đích: tránh để toast "Đang cập nhật..." bị treo vô thời hạn.
const dismissLoadingToast = (config?: ToastableRequestConfig) => {
  if (config?._loadingToastId) {
    toast.dismiss(config._loadingToastId);
    delete config._loadingToastId;
  }
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
    ? (error.response?.data as { message?: string } | undefined)?.message
    : undefined;
  const normalizedError = error instanceof Error ? error : new Error(SESSION_EXPIRED_MESSAGE);

  normalizedError.message = responseMessage || normalizedError.message || SESSION_EXPIRED_MESSAGE;
  return normalizedError;
};

const applyApiErrorMessage = (error: AxiosError) => {
  const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;

  if (responseMessage) {
    error.message = responseMessage;
  }
};

// Giải phóng các request đang chờ trong lúc một request khác đang refresh token.
// Dùng sau khi refresh thành công hoặc thất bại.
// Mục đích: nếu refresh thành công thì cho request chờ chạy tiếp, còn nếu thất bại thì reject đồng loạt.
const processQueue = (error: unknown, token?: string | null) => {
  failedQueue.forEach(({ request, resolve, reject }) => {
    if (error) {
      dismissLoadingToast(request);
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
const refreshAccessToken = async (context: AuthContext): Promise<string> => {
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
// Việc của nó chỉ có 2 thứ: gắn access token hiện tại và mở loading toast cho mutation.
const handleRequest = (config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    setAuthorizationHeader(config, accessToken);
  }

  const toastableConfig = config as ToastableRequestConfig;
  if (shouldShowLoadingToast(config) && !toastableConfig._loadingToastId) {
    toastableConfig._loadingToastId = toast.loading(getLoadingMessage(config.method));
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
    const nextToken = await refreshAccessToken(context);

    processQueue(null, nextToken);
    setAuthorizationHeader(request, nextToken);
    return apiClient(request);
  } catch (refreshError) {
    const normalizedError = normalizeRefreshError(refreshError);
    accessToken = null;
    dismissLoadingToast(request);
    processQueue(normalizedError, null);
    emitSessionExpired(getAuthContext(request.url));
    return Promise.reject(normalizedError);
  } finally {
    isRefreshing = false;
  }
};

// Chạy khi response thành công.
// Việc của nó chỉ là đóng loading toast rồi trả response cho nơi gọi.
const handleResponseSuccess = (response: any) => {
  dismissLoadingToast(response.config as ToastableRequestConfig);
  return response;
};

// Chạy khi response lỗi.
// Thứ tự xử lý: thử refresh nếu là 401 phù hợp, nếu không thì gắn message đẹp hơn và đóng loading toast.
const handleResponseError = async (error: AxiosError) => {
  const originalRequest = error.config as RetryableRequestConfig;

  if (shouldRetryWithRefresh(error, originalRequest)) {
    return isRefreshing ? waitForRefresh(originalRequest) : retryWithRefresh(originalRequest);
  }

  applyApiErrorMessage(error);
  dismissLoadingToast(originalRequest);
  return Promise.reject(error);
};

apiClient.interceptors.request.use(handleRequest, Promise.reject);
apiClient.interceptors.response.use(handleResponseSuccess, handleResponseError);

export default apiClient;
