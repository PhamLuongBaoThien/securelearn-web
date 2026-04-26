// ========================
// API Service: Quản lý Authentication dành cho Admin
// ========================
import apiClient from './apiClient';
import type { LoginPayload, ApiResponse, LoginResponseData, RefreshTokenResponse } from '@/types/auth.types';

// Các endpoint riêng cho Admin
const ADMIN_API_PREFIX = '/api/admin/auth';

/**
 * Gọi API Đăng nhập Admin.
 * @param payload - Chứa email, password.
 */
export const loginAdmin = async (payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> => {
  const response = await apiClient.post<ApiResponse<LoginResponseData>>(`${ADMIN_API_PREFIX}/login`, payload);
  return response.data;
};

/**
 * Lấy thông tin Admin đang đăng nhập.
 */
export const getAdminMe = async (): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`${ADMIN_API_PREFIX}/me`);
  return response.data;
};

/**
 * Đăng xuất khỏi phiên Admin.
 */
export const logoutAdmin = async (): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>(`${ADMIN_API_PREFIX}/logout`);
  return response.data;
};

/**
 * Cấp lại token cho phiên Admin.
 * (Refresh Token lưu trong cookie => không cần gửi param)
 */
export const refreshAdminToken = async (): Promise<RefreshTokenResponse> => {
  const response = await apiClient.post<RefreshTokenResponse>(`${ADMIN_API_PREFIX}/refresh-token`);
  return response.data;
};

/**
 * Cập nhật thông tin và avatar Admin
 */
export const updateAdminProfile = async (formData: FormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`${ADMIN_API_PREFIX}/profile`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Thay đổi mật khẩu Admin
 */
export const changeAdminPassword = async (payload: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`${ADMIN_API_PREFIX}/password`, payload);
  return response.data;
};
