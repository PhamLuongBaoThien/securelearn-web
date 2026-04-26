// ========================
// API Client: Axios Instance + Interceptors
// Xử lý tự động gắn token và refresh token khi hết hạn.
// ========================
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { RefreshTokenResponse } from '@/types/auth.types';

type AuthContext = 'user' | 'admin';
type SessionExpiredDetail = {
  context: AuthContext;
};

// ===== Base URL — Gọi qua Kong API Gateway =====
const API_BASE_URL = import.meta.env.DEV
  ? ''
  : import.meta.env.VITE_API_BASE_URL;

// ===== Tạo Axios Instance =====
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 giây này là thời gian mà request sẽ chờ API trả về
  // QUAN TRỌNG: cho phép gửi/nhận HttpOnly cookies (refresh_token)
  withCredentials: true,
});

// ===== Token Manager =====
// Lưu access_token trong closure (memory) — không dùng localStorage để chống XSS
let accessToken: string | null = null;
let accessTokenContext: AuthContext = 'user';
let silentRefreshTimer: number | null = null; // timer để gọi refresh token trước khi token hết hạn

const SESSION_EXPIRED_EVENT = 'auth:session-expired';
const SILENT_REFRESH_BUFFER_MS = 60 * 1000; // 1 phút trước khi token hết hạn

// Hàm xóa timer refresh token
const clearSilentRefreshTimer = () => {
  if (silentRefreshTimer !== null) {
    window.clearTimeout(silentRefreshTimer);
    silentRefreshTimer = null;
  }
};

// Hàm giải mã JWT token để lấy thời gian hết hạn (exp)
const decodeJwtExp = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(window.atob(padded));

    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
};

// Hàm phát sự kiện session hết hạn
const emitSessionExpired = (context: AuthContext) => {
  window.dispatchEvent(
    new CustomEvent<SessionExpiredDetail>(SESSION_EXPIRED_EVENT, {
      detail: { context },
    })
  );
};

// Hàm làm mới access token
const refreshAccessToken = async (context: AuthContext): Promise<string> => {
  const refreshUrl = context === 'admin'
    ? `${API_BASE_URL}/api/admin/auth/refresh-token`
    : `${API_BASE_URL}/api/auth/refresh-token`;

  const { data } = await axios.post<RefreshTokenResponse>(
    refreshUrl,
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

// Lên lịch để làm mới access token trước khi nó hết hạn
const scheduleSilentRefresh = (token: string, context: AuthContext) => {
  clearSilentRefreshTimer();

  const exp = decodeJwtExp(token);
  if (!exp) return;

  const refreshAt = exp * 1000 - SILENT_REFRESH_BUFFER_MS;
  const delay = Math.max(refreshAt - Date.now(), 0);

  silentRefreshTimer = window.setTimeout(async () => {
    try {
      const nextToken = await refreshAccessToken(context);
      scheduleSilentRefresh(nextToken, context);
    } catch {
      clearSilentRefreshTimer();
      accessToken = null;
      emitSessionExpired(context);
    }
  }, delay);
};

/** Cập nhật access token — được gọi từ authSlice */
export const setAccessToken = (token: string | null, context: AuthContext = 'user') => {
  accessToken = token;
  accessTokenContext = context;

  clearSilentRefreshTimer();
  if (token) {
    scheduleSilentRefresh(token, context);
  }
};

/** Lấy access token hiện tại */
export const getAccessToken = () => accessToken;

/** Lấy base URL của API Gateway */
export const getApiBaseUrl = () => API_BASE_URL;

// ===== Request Interceptor =====
// Tự động gắn Authorization header vào mỗi request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response Interceptor: Token Refresh Logic =====
// Khi nhận 401, tự gọi refresh-token rồi retry request ban đầu.

/** Flag tránh gọi refresh nhiều lần cùng lúc */
let isRefreshing = false;

/** Queue các request đang chờ refresh xong */
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** Xử lý queue sau khi refresh xong */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  // Response thành công → trả về luôn
  (response) => response,

  // Response lỗi → kiểm tra 401 để refresh
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Chỉ xử lý 401 và request chưa retry
    // Không retry cho chính request refresh-token và các đường dẫn login (tránh vòng lặp vô hạn)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry && // để không gọi nếu đã retry
      !originalRequest.url?.includes('/refresh-token') && // không retry lại khi đang refresh token
      !originalRequest.url?.includes('/login') // không retry lại khi đang login
    ) {
      // Nếu đang refresh → xếp vào hàng chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const isAdminRoute =
          originalRequest.url?.includes('/api/admin/') ||
          accessTokenContext === 'admin';
        const context: AuthContext = isAdminRoute ? 'admin' : 'user';
        const nextToken = await refreshAccessToken(context);

        if (nextToken) {
          // Cập nhật token mới
          scheduleSilentRefresh(nextToken, context);

          // Xử lý hàng chờ với token mới
          processQueue(null, nextToken);

          // Retry request ban đầu với token mới (Trường hợp này xảy ra khi refresh token còn hạn)
          originalRequest.headers.Authorization = `Bearer ${nextToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        const context: AuthContext =
          originalRequest.url?.includes('/api/admin/') || accessTokenContext === 'admin'
            ? 'admin'
            : 'user';
        accessToken = null;
        clearSilentRefreshTimer();
        processQueue(refreshError, null);
        emitSessionExpired(context);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Trích xuất error message từ backend (nếu có) để frontend hiển thị đúng thông báo
    if (error.response?.data && (error.response.data as any).message) {
      error.message = (error.response.data as any).message;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
