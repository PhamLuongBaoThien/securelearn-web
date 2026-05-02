// Admin Profile Utils: Hằng số tab và class dùng chung cho trang hồ sơ admin.
import React from 'react';
import { Camera, Shield, User } from 'lucide-react';
import type { AdminProfileTabType } from './adminProfile.types';

export const adminProfileTabs: Array<{
  id: AdminProfileTabType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'edit-profile', label: 'Thông tin cá nhân', icon: User },
  { id: 'avatar', label: 'Ảnh đại diện', icon: Camera },
  { id: 'security', label: 'Bảo mật', icon: Shield },
];

export const adminProfileInputClassName =
  'flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all';

export const adminProfileInputDisabledClassName = `${adminProfileInputClassName} bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed opacity-70`;
