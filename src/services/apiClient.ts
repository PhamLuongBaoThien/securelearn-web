// ========================
// API Client: Axios Instance + Interceptors
// Xử lý tự động gắn token và refresh token khi hết hạn.
// ========================
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { RefreshTokenResponse } from '@/types/auth.types';

// ===== Base URL của Backend Identity Service =====
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// ===== Tạo Axios Instance =====
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 giây timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // QUAN TRỌNG: cho phép gửi/nhận HttpOnly cookies (refresh_token)
  withCredentials: true,
});

// ===== Token Manager =====
// Lưu access_token trong closure (memory) — không dùng localStorage để chống XSS
let accessToken: string | null = null;

/** Cập nhật access token — được gọi từ authSlice */
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/** Lấy access token hiện tại */
export const getAccessToken = () => accessToken;

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
      !originalRequest._retry &&
      !originalRequest.url?.includes('/refresh-token') &&
      !originalRequest.url?.includes('/login')
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
        // Phân biệt gọi refresh token cho User hay Admin dựa trên url bị lỗi
        const isAdminRoute = originalRequest.url?.includes('/api/admin/');
        const refreshUrl = isAdminRoute 
          ? `${API_BASE_URL}/api/admin/auth/refresh-token`
          : `${API_BASE_URL}/api/auth/refresh-token`;

        // Gọi refresh token — cookie tự động gửi nhờ withCredentials
        const { data } = await axios.post<RefreshTokenResponse>(
          refreshUrl,
          {},
          { withCredentials: true }
        );

        if (data.status === 'OK' && data.access_token) {
          // Cập nhật token mới
          accessToken = data.access_token;

          // Xử lý hàng chờ với token mới
          processQueue(null, data.access_token);

          // Retry request ban đầu với token mới (Trường hợp này xảy ra khi refresh token còn hạn)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return apiClient(originalRequest);
        } else {
          // Refresh thất bại → xóa session (Trường hợp này xảy ra khi refresh token hết hạn)
          accessToken = null;
          processQueue(new Error('Refresh token thất bại'), null);
          // Dispatch event để AuthInitializer bắt và xử lý logout
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
          return Promise.reject(error);
        }
      } catch (refreshError) {
        accessToken = null;
        processQueue(refreshError, null);
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
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
