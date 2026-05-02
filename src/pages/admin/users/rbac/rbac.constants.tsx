// ========================
// RBAC Constants: Tập trung constants dùng chung cho module RBAC đã tách nhỏ.
// ========================
import { Bell, BookOpen, DollarSign, Settings, Users } from 'lucide-react';

export const ALL_PERMISSIONS = [
  { id: 'course:read', resource: 'course', label: 'Xem khóa học', desc: 'Truy cập danh sách và chi tiết khóa học' },
  { id: 'course:update', resource: 'course', label: 'Sửa khóa học', desc: 'Chỉnh sửa nội dung và cấu trúc khóa học' },
  { id: 'course:delete', resource: 'course', label: 'Xóa khóa học', desc: 'Xóa vĩnh viễn khóa học khỏi hệ thống' },
  { id: 'course:approve', resource: 'course', label: 'Duyệt khóa học', desc: 'Phê duyệt hoặc từ chối xuất bản khóa học' },
  { id: 'user:read', resource: 'user', label: 'Xem người dùng', desc: 'Tra cứu thông tin tài khoản học viên/giảng viên' },
  { id: 'user:lock', resource: 'user', label: 'Khóa/Mở tài khoản', desc: 'Đình chỉ hoặc khôi phục tài khoản người dùng' },
  { id: 'finance:read', resource: 'finance', label: 'Xem tài chính', desc: 'Xem giao dịch và báo cáo doanh thu' },
  { id: 'finance:manage', resource: 'finance', label: 'Quản lý gói cước', desc: 'Thêm, sửa, xóa các gói cước' },
  { id: 'notif:read', resource: 'notif', label: 'Xem thông báo', desc: 'Xem lịch sử và cấu hình thông báo' },
  { id: 'notif:manage', resource: 'notif', label: 'Quản lý thông báo', desc: 'Tạo và gửi thông báo cho học viên/giảng viên' },
  { id: 'system:config', resource: 'system', label: 'Cấu hình hệ thống', desc: 'Thay đổi cài đặt toàn hệ thống' },
  { id: 'system:rbac', resource: 'system', label: 'Quản lý phân quyền', desc: 'Thiết lập RBAC và quản lý nhân viên' },
] as const;

export const RESOURCE_GROUPS = [
  { label: 'Nội dung đào tạo', key: 'course', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { label: 'Người dùng', key: 'user', icon: <Users className="w-3.5 h-3.5" /> },
  { label: 'Tài chính', key: 'finance', icon: <DollarSign className="w-3.5 h-3.5" /> },
  { label: 'Thông báo', key: 'notif', icon: <Bell className="w-3.5 h-3.5" /> },
  { label: 'Hệ thống', key: 'system', icon: <Settings className="w-3.5 h-3.5" /> },
];

export const COLOR_DOTS: Record<string, string> = {
  red: 'bg-red-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  zinc: 'bg-zinc-500',
};

export const COLOR_SELECTED: Record<string, string> = {
  red: 'border-red-400/70 dark:border-red-500/60 bg-red-50/60 dark:bg-red-500/5',
  violet: 'border-violet-400/70 dark:border-violet-500/60 bg-violet-50/60 dark:bg-violet-500/5',
  emerald: 'border-emerald-400/70 dark:border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-500/5',
  blue: 'border-blue-400/70 dark:border-blue-500/60 bg-blue-50/60 dark:bg-blue-500/5',
  amber: 'border-amber-400/70 dark:border-amber-500/60 bg-amber-50/60 dark:bg-amber-500/5',
  pink: 'border-pink-400/70 dark:border-pink-500/60 bg-pink-50/60 dark:bg-pink-500/5',
  indigo: 'border-indigo-400/70 dark:border-indigo-500/60 bg-indigo-50/60 dark:bg-indigo-500/5',
  teal: 'border-teal-400/70 dark:border-teal-500/60 bg-teal-50/60 dark:bg-teal-500/5',
  orange: 'border-orange-400/70 dark:border-orange-500/60 bg-orange-50/60 dark:bg-orange-500/5',
  zinc: 'border-zinc-400/70 dark:border-zinc-500/60 bg-zinc-50/60 dark:bg-zinc-500/5',
};
