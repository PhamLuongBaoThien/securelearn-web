// User Profile Utils: tab và style dùng chung cho trang cài đặt tài khoản.
import React from 'react';
import { Camera, KeyRound, MonitorSmartphone, User } from 'lucide-react';
import type { ProfileTabType } from './profile.types';

export const profileTabs: Array<{
  id: ProfileTabType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'profile', label: 'Thông tin tài khoản', description: 'Thông tin cá nhân và hồ sơ hiển thị', icon: User },
  { id: 'avatar', label: 'Ảnh đại diện', description: 'Cập nhật hình ảnh của bạn', icon: Camera },
  { id: 'security', label: 'Bảo mật', description: 'Mật khẩu và xóa tài khoản', icon: KeyRound },
  { id: 'sessions', label: 'Phiên đăng nhập', description: 'Thiết bị đang truy cập tài khoản', icon: MonitorSmartphone },
];

export const profileInputClassName =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
