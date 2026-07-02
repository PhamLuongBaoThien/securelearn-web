export type NotificationChannel = 'EMAIL' | 'IN_APP';
export type NotificationEvent = 'WELCOME' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'COURSE_APPROVED' | 'COURSE_REJECTED' | 'COURSE_SUBMITTED_FOR_REVIEW' | 'ENROLLMENT_CREATED' | 'REPORT_CREATED' | 'SUPPORT_REQUEST_CREATED' | 'FEEDBACK_CREATED' | 'INBOX_USER_REPLIED' | 'INBOX_ADMIN_REPLIED' | 'INBOX_STATUS_CHANGED' | 'MANUAL';
export type NotificationCategory = 'SYSTEM' | 'PAYMENT' | 'COURSE' | 'LEARNING' | 'INBOX' | 'CAMPAIGN';
export interface NotificationItem { _id: string; recipientType: 'USER' | 'ADMIN'; type: NotificationEvent; category: NotificationCategory; priority: 'NORMAL' | 'HIGH'; title: string; body: string; actionUrl?: string; actionLabel?: string; data?: Record<string, unknown>; readAt?: string | null; createdAt: string; }
export interface NotificationTemplate { _id: string; name: string; event: NotificationEvent; type: NotificationChannel; subject?: string; body: string; variables: string[]; isActive: boolean; createdAt: string; updatedAt: string; }
export interface PaginatedNotifications { items: NotificationItem[]; total: number; page: number; limit: number; totalPages: number; }
export type PreferenceChannels = Record<NotificationCategory, { email: boolean; inApp: boolean }>;
export type NotificationChannelCapability = { email: boolean; emailAvailable: boolean; inApp: boolean; inAppAvailable: boolean; missingEmailEvents: NotificationEvent[]; missingInAppEvents: NotificationEvent[] };
export type NotificationCapabilities = Record<NotificationCategory, NotificationChannelCapability>;
export interface NotificationPreferences { recipientType: 'USER' | 'ADMIN'; userId: string; categories: PreferenceChannels; }
export interface CampaignInput { audience: 'ALL_LEARNERS' | 'ALL_INSTRUCTORS' | 'ALL_ADMINS' | 'ALL_USERS' | 'SPECIFIC_USER' | 'COURSE_STUDENTS'; specificEmail?: string; courseId?: string; title: string; content: string; channels: NotificationChannel[]; }
export interface Campaign { _id: string; audience: CampaignInput['audience']; title: string; channels: NotificationChannel[]; status: 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'; stats: { requested: number; inAppSent: number; emailSent: number; emailFailed: number }; createdAt: string; }
export interface NotificationSocketEvents {
  'notification:new': NotificationItem;
  'notification:read': NotificationItem;
  'notification:read-all': { readAt: string; updated: number };
  'notification:unread-count': { count: number };
}