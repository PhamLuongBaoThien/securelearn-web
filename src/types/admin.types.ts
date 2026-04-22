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
  order: number;
  isActive: boolean;
  courseCount: number;
  children?: ICategory[];
  createdAt: string;
}

// ===== Users & RBAC =====

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'UNVERIFIED';

export interface IAdminUser {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
  phone?: string;
  coursesPurchased?: number;
  coursesCreated?: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface IPermission {
  action: string;
  resource: string;
  description: string;
}

export interface IRolePermission {
  role: UserRole;
  permissions: string[]; // Array of "resource:action"
}

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
