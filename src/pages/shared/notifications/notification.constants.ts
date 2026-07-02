import type React from 'react';
import { BookOpen, CreditCard, GraduationCap, Inbox, Megaphone, ShieldAlert } from 'lucide-react';
import type { NotificationCategory } from '@/types/notification.types';

export const USER_NOTIFICATION_CATEGORIES: NotificationCategory[] = ['SYSTEM', 'PAYMENT', 'COURSE', 'LEARNING', 'CAMPAIGN'];
export const ADMIN_NOTIFICATION_CATEGORIES: NotificationCategory[] = ['SYSTEM', 'COURSE', 'INBOX', 'CAMPAIGN'];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  SYSTEM: 'Hệ thống',
  PAYMENT: 'Thanh toán',
  COURSE: 'Khóa học',
  LEARNING: 'Học tập',
  INBOX: 'Hỗ trợ & Báo cáo',
  CAMPAIGN: 'Thông báo chung',
};

export const getNotificationCategoryLabel = (category: NotificationCategory, isAdmin = false) =>
  isAdmin && category === 'COURSE' ? 'Kiểm duyệt khóa học' : NOTIFICATION_CATEGORY_LABELS[category];

export const NOTIFICATION_EVENT_LABELS: Record<string, string> = {
  WELCOME: 'Chào mừng tài khoản', PAYMENT_SUCCESS: 'Thanh toán thành công', PAYMENT_FAILED: 'Thanh toán thất bại',
  COURSE_APPROVED: 'Khóa học được duyệt', COURSE_REJECTED: 'Khóa học cần chỉnh sửa',
  COURSE_SUBMITTED_FOR_REVIEW: 'Khóa học gửi duyệt', ENROLLMENT_CREATED: 'Học viên mới ghi danh', MANUAL: 'Thông báo từ quản trị viên',
  REPORT_CREATED: 'Báo cáo mới', SUPPORT_REQUEST_CREATED: 'Yêu cầu hỗ trợ mới', FEEDBACK_CREATED: 'Góp ý mới',
  INBOX_USER_REPLIED: 'Yêu cầu có phản hồi', INBOX_ADMIN_REPLIED: 'Hỗ trợ đã phản hồi', INBOX_STATUS_CHANGED: 'Trạng thái yêu cầu',
};

type CategoryStyle = {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  iconBgClass: string;
  borderClass: string;
  badgeClass: string;
};

export const NOTIFICATION_CATEGORY_STYLES: Record<NotificationCategory, CategoryStyle> = {
  SYSTEM: { icon: ShieldAlert, colorClass: 'text-blue-600 dark:text-blue-400', iconBgClass: 'bg-blue-50 dark:bg-blue-950/40', borderClass: 'border-l-blue-500', badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  PAYMENT: { icon: CreditCard, colorClass: 'text-emerald-600 dark:text-emerald-400', iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/40', borderClass: 'border-l-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  COURSE: { icon: BookOpen, colorClass: 'text-purple-600 dark:text-purple-400', iconBgClass: 'bg-purple-50 dark:bg-purple-950/40', borderClass: 'border-l-purple-500', badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  LEARNING: { icon: GraduationCap, colorClass: 'text-amber-600 dark:text-amber-400', iconBgClass: 'bg-amber-50 dark:bg-amber-950/40', borderClass: 'border-l-amber-500', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  INBOX: { icon: Inbox, colorClass: 'text-orange-600 dark:text-orange-400', iconBgClass: 'bg-orange-50 dark:bg-orange-950/40', borderClass: 'border-l-orange-500', badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  CAMPAIGN: { icon: Megaphone, colorClass: 'text-rose-600 dark:text-rose-400', iconBgClass: 'bg-rose-50 dark:bg-rose-950/40', borderClass: 'border-l-rose-500', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
};
