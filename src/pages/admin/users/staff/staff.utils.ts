// ========================
// Staff Utils: Constants, type helpers, và pure functions dùng chung cho module staff đã tách nhỏ.
// ========================
import type { IAdminStaff, IRolePermission, UserStatus } from '@/types/admin.types';
import { getRoleBadgeClass } from '@/types/admin.types';

export const STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Hoạt động', color: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' },
  LOCKED: { label: 'Đã khóa', color: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400' },
};

export type StaffFormValues = Pick<IAdminStaff, 'fullName' | 'email' | 'phone' | 'department'> & {
  adminRole: string;
  password: string;
};

export const staffInputClassName =
  'w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

export const getRoleMeta = (roleKey: string, rolesData: IRolePermission[]) => {
  const found = rolesData.find((role) => role.roleKey === roleKey);
  if (found) {
    return { label: found.label, badgeClass: getRoleBadgeClass(found.color) };
  }

  return { label: roleKey, badgeClass: getRoleBadgeClass('zinc') };
};

export const getRelativeLoginTime = (timestamp: number, lastLoginAt?: string) => {
  if (!lastLoginAt) return 'Chưa đăng nhập';

  const minutes = Math.floor((timestamp - new Date(lastLoginAt).getTime()) / 60000);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  return `${Math.floor(hours / 24)} ngày trước`;
};
