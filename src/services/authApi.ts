// ========================
// Auth API Service: Tập trung toàn bộ API calls liên quan Authentication
// Sử dụng apiClient (Axios) đã có interceptor tự động refresh token.
// ========================
import apiClient, { getApiBaseUrl } from './apiClient';
import type {
  LoginPayload,
  RegisterPayload,
  ApiResponse,
  LoginResponseData,
  RegisterResponseData,
  RefreshTokenResponse,
  IUser,
  ForgotPasswordPayload,
  VerifyOTPPayload,
  ResetPasswordPayload,
} from '@/types/auth.types';

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

export interface PublicInstructorProfile {
  _id: string;
  fullName: string;
  profile?: {
    avatarUrl?: string;
    bio?: string;
    headline?: string;
  };
}

export const getPublicInstructorProfile = async (instructorId: string) => {
  const { data } = await apiClient.get<ApiResponse<PublicInstructorProfile>>(
    `/api/auth/instructors/${instructorId}/public-profile`
  );
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
  window.location.href = `${getApiBaseUrl()}/api/auth/google`;
};

/**
 * Cập nhật profile (Hỗ trợ upload ảnh với FormData).
 * PUT /api/auth/profile
 */
export const updateProfile = async (formData: FormData) => {
  const { data } = await apiClient.put<ApiResponse<IUser>>(
    '/api/auth/profile',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data;
};

/**
 * Xóa tài khoản
 * DELETE /api/auth/account
 */
export const deleteAccount = async () => {
  const { data } = await apiClient.delete<ApiResponse>('/api/auth/account');
  return data;
};

/**
 * Đổi mật khẩu
 * PUT /api/auth/password
 */
export const changePassword = async (payload: { oldPassword?: string; newPassword?: string }) => {
  const { data } = await apiClient.put<ApiResponse<IUser>>('/api/auth/password', payload);
  return data;
};

/**
 * Quên mật khẩu - Gửi OTP
 * POST /api/auth/forgot-password
 */
export const forgotPasswordRequest = async (payload: ForgotPasswordPayload) => {
  const { data } = await apiClient.post<ApiResponse>('/api/auth/forgot-password', payload);
  return data;
};

/**
 * Khôi phục mật khẩu (Gửi OTP và mật khẩu mới)
 * POST /api/auth/reset-password
 */
export const resetPasswordRequest = async (payload: ResetPasswordPayload) => {
  const { data } = await apiClient.post<ApiResponse>('/api/auth/reset-password', payload);
  return data;
};

/**
 * Xác thực mã OTP
 * POST /api/auth/verify-reset-otp
 */
export const verifyOTPRequest = async (payload: VerifyOTPPayload) => {
  const { data } = await apiClient.post<ApiResponse>('/api/auth/verify-reset-otp', payload);
  return data;
};

/**
 * Chuyển đổi vai trò sang giảng viên
 * PUT /api/auth/profile/role
 */
export const switchToInstructor = async () => {
  const { data } = await apiClient.put<ApiResponse<IUser>>('/api/auth/profile/role');
  return data;
};
