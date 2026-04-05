// ========================
// Auth API Service: Tập trung toàn bộ API calls liên quan Authentication
// Sử dụng apiClient (Axios) đã có interceptor tự động refresh token.
// ========================
import apiClient from './apiClient';
import type {
  LoginPayload,
  RegisterPayload,
  ApiResponse,
  LoginResponseData,
  RegisterResponseData,
  RefreshTokenResponse,
  IUser,
} from '@/types/auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

/**
 * Đăng ký tài khoản mới.
 * POST /api/auth/register
 */
export const registerUser = async (payload: RegisterPayload) => {
  const { data } = await apiClient.post<ApiResponse<RegisterResponseData>>(
    '/api/auth/register',
    payload
  );
  return data;
};

/**
 * Đăng nhập bằng email + mật khẩu.
 * POST /api/auth/login
 * Response: access_token trong body + refresh_token trong HttpOnly cookie (tự động).
 */
export const loginUser = async (payload: LoginPayload) => {
  const { data } = await apiClient.post<ApiResponse<LoginResponseData>>(
    '/api/auth/login',
    payload
  );
  return data;
};

/**
 * Đăng xuất — xóa cookie refresh_token phía server.
 * POST /api/auth/logout
 */
export const logoutUser = async () => {
  const { data } = await apiClient.post<ApiResponse>('/api/auth/logout');
  return data;
};

/**
 * Lấy thông tin profile user đang đăng nhập.
 * GET /api/auth/me (cần Bearer token — interceptor tự gắn)
 */
export const getMe = async () => {
  const { data } = await apiClient.get<ApiResponse<IUser>>('/api/auth/me');
  return data;
};

/**
 * Cấp lại access token từ refresh token (cookie).
 * POST /api/auth/refresh-token
 */
export const refreshToken = async () => {
  const { data } = await apiClient.post<RefreshTokenResponse>(
    '/api/auth/refresh-token'
  );
  return data;
};

/**
 * Redirect tới trang đăng nhập Google OAuth.
 * Không dùng Axios — chuyển hướng trực tiếp trên trình duyệt.
 */
export const googleLogin = () => {
  window.location.href = `${API_BASE_URL}/api/auth/google`;
};
