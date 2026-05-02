// User Profile Types: Kiểu dữ liệu dùng riêng cho module hồ sơ người dùng.
import type { AuthUser } from '@/types/auth.types';

export type ProfileFormData = {
  fullName: string;
  phone: string;
  bio: string;
  headline: string;
};

export type PasswordFormData = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export type ProfileTabType = 'public' | 'edit-profile' | 'avatar' | 'security';

export type ProfileUser = AuthUser;
