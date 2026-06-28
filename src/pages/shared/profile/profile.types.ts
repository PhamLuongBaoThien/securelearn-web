// User Profile Types: Kiểu dữ liệu dùng riêng cho module hồ sơ người dùng.
import type { AuthUser } from '@/types/auth.types';

export type ProfileFormData = {
  fullName: string;
  phone: string;
  bio: string;
  headline: string;
  website?: string;
  github?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
};

export type PasswordFormData = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export type ProfileTabType = 'profile' | 'avatar' | 'security' | 'sessions';

export type ProfileUser = AuthUser;
