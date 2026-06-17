// ========================
// User List Constants: Constants và label/color helpers dùng chung cho module user list đã tách nhỏ.
// ========================
import type { IAdminUser, UserRole, UserStatus } from '@/types/admin.types';

export const ROLE_COLORS: Record<UserRole, string> = {
  STUDENT:    'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400',
  INSTRUCTOR: 'bg-violet-100 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400',
  ADMIN:      'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400',
};

export const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE:     'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400',
  LOCKED:     'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  STUDENT:    'Học viên',
  INSTRUCTOR: 'Giảng viên',
  ADMIN:      'Admin',
};

export const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE:     'Hoạt động',
  LOCKED:     'Đã khóa',
};

export const getEffectiveUserStatus = (
  user: Pick<IAdminUser, 'status' | 'isLocked'>
): UserStatus => {
  if (user.isLocked) return 'LOCKED';
  if (user.status === 'LOCKED') return 'LOCKED';
  return 'ACTIVE';
};

export const timeAgo = (dateStr?: string): string => {
  if (!dateStr) return 'Chưa đăng nhập';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
};
