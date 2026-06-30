export type NotificationChannel = 'EMAIL' | 'IN_APP';
export type NotificationEvent = 'WELCOME' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'COURSE_APPROVED' | 'COURSE_REJECTED' | 'MANUAL';
export interface NotificationItem {
    _id: string;
    type: NotificationEvent;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    readAt?: string | null;
    createdAt: string;
}
export interface NotificationTemplate {
    _id: string;
    name: string;
    event: NotificationEvent;
    type: NotificationChannel;
    subject?: string;
    body: string;
    variables: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface PaginatedNotifications {
    items: NotificationItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface CampaignInput {
    audience: 'ALL_STUDENTS' | 'ALL_INSTRUCTORS' | 'ALL_USERS' | 'SPECIFIC_USER';
    specificEmail?: string;
    title: string;
    content: string;
    channels: NotificationChannel[];
}

