// User Profile Utils: Hằng số tab, style dùng chung và tiện ích hiển thị cho trang hồ sơ người dùng.
import React from 'react';
import { Briefcase, Calendar, Camera, Eye, FileText, Mail, Phone, Shield, User } from 'lucide-react';
import type { ProfileTabType } from './profile.types';

export const profileTabs: Array<{
  id: ProfileTabType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'public', label: 'Xem hồ sơ công khai', icon: Eye },
  { id: 'edit-profile', label: 'Chỉnh sửa hồ sơ', icon: User },
  { id: 'avatar', label: 'Ảnh đại diện', icon: Camera },
  { id: 'security', label: 'Bảo mật', icon: Shield },
];

export const profileInputClassName =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export const profileInputDisabledClassName = `${profileInputClassName} bg-muted cursor-not-allowed opacity-70`;

export const publicInfoIcons = {
  briefcase: Briefcase,
  calendar: Calendar,
  fileText: FileText,
  mail: Mail,
  phone: Phone,
};

export const formatProfileDate = (dateStr?: string) => {
  if (!dateStr) return 'Không xác định';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
