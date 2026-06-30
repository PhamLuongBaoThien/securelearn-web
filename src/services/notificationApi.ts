import apiClient from './apiClient';
import type { CampaignInput, NotificationTemplate, PaginatedNotifications } from '@/types/notification.types';
type R<T> = {
    status: 'OK' | 'ERR';
    data: T;
    message?: string;
};
export const notificationApi = { list: async (params?: Record<string, unknown>) => (await apiClient.get<R<PaginatedNotifications>>('/api/notifications', { params })).data.data, unreadCount: async () => (await apiClient.get<R<{
        count: number;
    }>>('/api/notifications/unread-count')).data.data.count, markRead: async (id: string) => (await apiClient.patch(`/api/notifications/${id}/read`)).data, markAllRead: async () => (await apiClient.patch('/api/notifications/read-all')).data, listTemplates: async () => (await apiClient.get<R<NotificationTemplate[]>>('/api/admin/notifications/templates')).data.data, createTemplate: async (input: Partial<NotificationTemplate>) => (await apiClient.post('/api/admin/notifications/templates', input)).data, updateTemplate: async (id: string, input: Partial<NotificationTemplate>) => (await apiClient.put(`/api/admin/notifications/templates/${id}`, input)).data, deleteTemplate: async (id: string) => (await apiClient.delete(`/api/admin/notifications/templates/${id}`)).data, sendCampaign: async (input: CampaignInput) => (await apiClient.post('/api/admin/notifications/campaigns', input)).data };

