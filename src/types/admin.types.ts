// ========================
// TypeScript Types: Định nghĩa kiểu dữ liệu cho Admin Management
// Phủ toàn bộ 6 nhóm chức năng quản trị.
// ========================

// ===== Shared =====

export type AdminApiResponse<T = undefined> = {
  status: 'OK' | 'ERR';
  message: string;
  data?: T;
};

// ===== System & CMS =====

export interface IWebsiteConfig {
  siteName: string;
  siteUrl: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  facebookUrl?: string;
  youtubeUrl?: string;
}

export interface IBanner {
  _id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  courseCount: number;
  children?: ICategory[];
  createdAt: string;
  updatedAt?: string;
}

// ===== Users & RBAC =====

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'LOCKED';

// Admin staff roles (sub-roles của ADMIN)
export type AdminRole = 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'FINANCE_MANAGER' | 'SUPPORT_AGENT';

export interface IAdminUser {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  isLocked?: boolean;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
  profile?: {
    avatarUrl?: string;
  };
  phone?: string;
  coursesPurchased?: number;
  coursesCreated?: number;
  createdAt: string;
  lastLoginAt?: string;
}

// Admin Staff (nhân viên) — chỉ có ADMIN role
export interface IAdminStaff {
  _id: string;
  email: string;
  fullName: string;
  adminRole: AdminRole;       // Sub-role của admin
  status: UserStatus;
  permissions: string[];      // Danh sách permission IDs
  avatarUrl?: string;
  phone?: string;
  department?: string;        // Nhóm/Phòng ban
  createdAt: string;
  lastLoginAt?: string;
  createdBy?: string;         // ID của super admin tạo
}

export interface IPermission {
  action: string;
  resource: string;
  description: string;
}

export interface IRolePermission {
  _id?: string;
  roleKey: string;       // Key duy nhất (VD: 'CONTENT_MANAGER', 'CUSTOM_ROLE')
  label: string;         // Tên hiển thị
  color: string;         // Màu badge (VD: 'violet', 'emerald')
  permissions: string[];
  isSystem: boolean;     // true = không thể xóa (SUPER_ADMIN)
  updatedAt?: string;
}

// Danh sách màu có thể chọn cho badge role
export const ROLE_COLORS = ['red', 'violet', 'emerald', 'blue', 'amber', 'pink', 'indigo', 'teal', 'orange', 'zinc'] as const;
export type RoleColor = (typeof ROLE_COLORS)[number];

// Helper: tạo Tailwind class cho badge theo color
export function getRoleBadgeClass(color: string): string {
  const map: Record<string, string> = {
    red:     'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400',
    violet:  'bg-violet-100 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400',
    blue:    'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400',
    amber:   'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400',
    pink:    'bg-pink-100 dark:bg-pink-400/10 text-pink-600 dark:text-pink-400',
    indigo:  'bg-indigo-100 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400',
    teal:    'bg-teal-100 dark:bg-teal-400/10 text-teal-600 dark:text-teal-400',
    orange:  'bg-orange-100 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400',
    zinc:    'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
  };
  return map[color] ?? map['zinc'];
}

// Danh sách tất cả permission IDs trong hệ thống (đồng bộ với BE)
export const ALL_PERMISSION_IDS = [
  'course:read', 'course:update', 'course:delete', 'course:approve',
  'user:read', 'user:lock',
  'finance:read', 'finance:manage',
  'notif:read', 'notif:manage',
  'system:config', 'system:rbac',
] as const;

export type PermissionId = (typeof ALL_PERMISSION_IDS)[number];

// ===== Courses =====

export type CourseStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface ICourseReview {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  instructor: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  category: string;
  level: CourseLevel;
  price: number;
  status: CourseStatus;
  totalLessons: number;
  totalChapters: number;
  totalDuration?: number; // phút
  submittedAt: string;
  rejectionReason?: string;
  createdAt: string;
}

export type ResourceType = 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'OTHER';

export interface ICourseResource {
  _id: string;
  fileName: string;
  fileType: ResourceType;
  fileSize: number; // bytes
  mimeType: string;
  url: string;
  courseId: string;
  courseTitle: string;
  lessonTitle?: string;
  uploadedBy: string;
  createdAt: string;
}

// ===== Media & Security =====

export type EncryptionStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface IEncryptionJob {
  _id: string;
  videoId: string;
  videoTitle: string;
  courseTitle: string;
  status: EncryptionStatus;
  progress: number; // 0-100
  duration?: number; // giây video gốc
  outputFormat: 'HLS';
  encryptionType: 'AES-128';
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export type KmsKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface IKmsKey {
  _id: string;
  keyId: string;
  courseId: string;
  courseTitle: string;
  issuedTo?: string; // userId
  issuedToName?: string;
  status: KmsKeyStatus;
  usageCount: number;
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
}

export interface ISecurityConfig {
  dynamicWatermark: {
    enabled: boolean;
    opacity: number; // 0.1 - 1.0
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    showUserId: boolean;
    showTimestamp: boolean;
  };
  viewerShield: {
    enabled: boolean;
    blockScreenCapture: boolean;
    blockDevTools: boolean;
    blockRightClick: boolean;
  };
  hlsConfig: {
    segmentDuration: number; // giây, 2-10
    playlistType: 'EVENT' | 'VOD';
  };
}

// ===== Finance =====

export type PaymentProvider = 'VNPAY' | 'MOMO' | 'STRIPE';
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
export type PlanType = 'LIFETIME' | 'MONTHLY' | 'YEARLY';

export interface ITransaction {
  _id: string;
  transactionId: string;
  user: {
    _id: string;
    email: string;
    fullName: string;
  };
  course?: {
    _id: string;
    title: string;
  };
  plan?: PlanType;
  amount: number; // VND
  provider: PaymentProvider;
  status: TransactionStatus;
  paymentMethod?: string;
  ipnReceivedAt?: string; // Từ RabbitMQ event
  createdAt: string;
  updatedAt: string;
}

export interface IPricingPlan {
  _id: string;
  type: PlanType;
  name: string;
  price: number; // VND
  durationDays?: number; // null = lifetime
  features: string[];
  isActive: boolean;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IRevenueStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  successfulTransactions: number;
  activeSubscriptions: number;
  monthlyData: {
    month: string;
    revenue: number;
    transactions: number;
  }[];
}

export interface IActiveSubscription {
  userId: string;
  fullName: string;
  email: string;
  plan: PlanType;
  expiresAt: string | null;
  isActive: boolean;
  redisKey: string;
}

// ===== Notifications & Progress =====

export type NotificationType = 'EMAIL' | 'PUSH';
export type TemplateEvent =
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'COURSE_APPROVED'
  | 'COURSE_REJECTED'
  | 'WELCOME'
  | 'PASSWORD_RESET';

export interface INotificationTemplate {
  _id: string;
  name: string;
  event: TemplateEvent;
  type: NotificationType;
  subject?: string; // Email only
  body: string;
  variables: string[]; // e.g. ['{{userName}}', '{{amount}}']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ILearningProgress {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  course: {
    _id: string;
    title: string;
    instructor: string;
  };
  progressPercent: number; // 0-100
  completedLessons: number;
  totalLessons: number;
  heartbeatCount: number; // từ heartbeat service
  totalWatchTime: number; // phút
  lastActivityAt: string;
  enrolledAt: string;
  completedAt?: string;
}
