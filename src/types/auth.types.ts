// ========================
// TypeScript Types: Định nghĩa kiểu dữ liệu cho Authentication
// Khớp 1:1 với Backend Identity Service API response.
// ========================

// ===== Enum khớp với backend models =====

/** Vai trò của người dùng — khớp với Role enum trong user.model.ts */
export type Role = 'STUDENT' | 'INSTRUCTOR';

/** Trạng thái đăng ký gói — khớp với SubscriptionStatus enum */
export type SubscriptionStatus = 'INACTIVE' | 'ACTIVE';

// ===== User Profile Interface =====

/** Thông tin profile phụ — nằm trong object `profile` của User */
export interface IUserProfile {
  avatarUrl?: string;
  bio?: string;
  headline?: string;
}

/**
 * Interface chính cho User — khớp với IUser trong backend.
 * Đây là dữ liệu trả về từ GET /api/auth/me
 */
export interface IUser {
  _id: string;
  email: string;
  fullName: string;
  role: Role;
  isVerified: boolean;
  subscriptionStatus: SubscriptionStatus;
  phone?: string;
  profile?: IUserProfile;
  // --- Admin properties ---
  avatarUrl?: string;
  bio?: string;
  department?: string;
  // ----------------------
  /** Cho biết user đã có mật khẩu cục bộ hay chưa (false = đăng nhập Google-only) */
  hasPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== API Request Payloads =====

/** Body gửi lên khi đăng ký — POST /api/auth/register */
export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

/** Body gửi lên khi đăng nhập — POST /api/auth/login */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Body gửi lên khi yêu cầu reset pasword — POST /api/auth/forgot-password */
export interface ForgotPasswordPayload {
  email: string;
}

/** Body gửi lên khi gửi xác thực OTP (trung gian) — POST /api/auth/verify-reset-otp */
export interface VerifyOTPPayload {
  email: string;
  otp: string;
}

/** Body gửi lên khi đổi pass — POST /api/auth/reset-password */
export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

// ===== API Response Types =====

/**
 * Cấu trúc response chuẩn từ backend.
 * Mọi API đều trả về dạng { status, message, data? }
 */
export interface ApiResponse<T = undefined> {
  status: 'OK' | 'ERR';
  message: string;
  data?: T;
}

/** Data trả về khi đăng nhập thành công — POST /api/auth/login */
export interface LoginResponseData {
  user: {
    _id: string;
    email: string;
    fullName: string;
    role: Role;
    subscriptionStatus: SubscriptionStatus;
  };
  access_token: string;
}

/** Data trả về khi đăng ký thành công — POST /api/auth/register */
export interface RegisterResponseData {
  _id: string;
  email: string;
  fullName: string;
  role: Role;
}

/** Response khi refresh token — POST /api/auth/refresh-token */
export interface RefreshTokenResponse {
  status: 'OK' | 'ERR';
  message: string;
  access_token?: string;
}

// ===== Auth State cho Redux Store =====
// Loading, error, initializing giờ do React Query quản lý.
// Redux chỉ giữ thin identity state (user, token, isAuthenticated).

/** Trạng thái authentication trong Redux */
export interface AuthState {
  /** Thông tin user đã đăng nhập (null = chưa đăng nhập) */
  user: IUser | null;
  /** Access token JWT (lưu trong memory, KHÔNG lưu localStorage) */
  accessToken: string | null;
  /** Trạng thái xác thực */
  isAuthenticated: boolean;
}
