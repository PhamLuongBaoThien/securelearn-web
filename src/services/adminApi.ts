// ========================
// API Service: Tất cả chức năng quản trị Admin
// Giao tiếp qua Kong API Gateway — prefix /api/admin/
// ========================
import apiClient from './apiClient';
import type {
  IWebsiteConfig,
  IBanner,
  ICategory,
  IAdminUser,
  ICourseReview,
  ICourseResource,
  IEncryptionJob,
  IKmsKey,
  ISecurityConfig,
  ITransaction,
  IPricingPlan,
  IRevenueStats,
  IActiveSubscription,
  INotificationTemplate,
  ILearningProgress,
  AdminApiResponse,
} from '@/types/admin.types';

const ADMIN = '/api/admin';

// ===== System & CMS =====

export const getWebsiteConfig = async (): Promise<AdminApiResponse<IWebsiteConfig>> => {
  const res = await apiClient.get<AdminApiResponse<IWebsiteConfig>>(`${ADMIN}/system/config`);
  return res.data;
};

export const updateWebsiteConfig = async (data: Partial<IWebsiteConfig>): Promise<AdminApiResponse> => {
  const res = await apiClient.put<AdminApiResponse>(`${ADMIN}/system/config`, data);
  return res.data;
};

export const getBanners = async (): Promise<AdminApiResponse<IBanner[]>> => {
  const res = await apiClient.get<AdminApiResponse<IBanner[]>>(`${ADMIN}/system/banners`);
  return res.data;
};

export const createBanner = async (data: Partial<IBanner>): Promise<AdminApiResponse<IBanner>> => {
  const res = await apiClient.post<AdminApiResponse<IBanner>>(`${ADMIN}/system/banners`, data);
  return res.data;
};

export const updateBanner = async (id: string, data: Partial<IBanner>): Promise<AdminApiResponse> => {
  const res = await apiClient.put<AdminApiResponse>(`${ADMIN}/system/banners/${id}`, data);
  return res.data;
};

export const deleteBanner = async (id: string): Promise<AdminApiResponse> => {
  const res = await apiClient.delete<AdminApiResponse>(`${ADMIN}/system/banners/${id}`);
  return res.data;
};

export const getCategories = async (): Promise<AdminApiResponse<ICategory[]>> => {
  const res = await apiClient.get<AdminApiResponse<ICategory[]>>(`${ADMIN}/system/categories`);
  return res.data;
};

export const createCategory = async (data: Partial<ICategory>): Promise<AdminApiResponse<ICategory>> => {
  const res = await apiClient.post<AdminApiResponse<ICategory>>(`${ADMIN}/system/categories`, data);
  return res.data;
};

export const updateCategory = async (id: string, data: Partial<ICategory>): Promise<AdminApiResponse> => {
  const res = await apiClient.put<AdminApiResponse>(`${ADMIN}/system/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id: string): Promise<AdminApiResponse> => {
  const res = await apiClient.delete<AdminApiResponse>(`${ADMIN}/system/categories/${id}`);
  return res.data;
};

// ===== Users & RBAC =====

export const getUsers = async (params?: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminApiResponse<{ users: IAdminUser[]; total: number; page: number; totalPages: number }>> => {
  const res = await apiClient.get(`${ADMIN}/users`, { params });
  return res.data;
};

export const lockUser = async (userId: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch<AdminApiResponse>(`${ADMIN}/users/${userId}/lock`);
  return res.data;
};

export const unlockUser = async (userId: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch<AdminApiResponse>(`${ADMIN}/users/${userId}/unlock`);
  return res.data;
};

export const changeUserPassword = async (userId: string, newPassword: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch<AdminApiResponse>(`${ADMIN}/users/${userId}/password`, { newPassword });
  return res.data;
};

// ===== Courses =====

export const getCoursesForReview = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminApiResponse<{ courses: ICourseReview[]; total: number }>> => {
  const res = await apiClient.get(`${ADMIN}/courses/review`, { params });
  return res.data;
};

export const approveCourse = async (courseId: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch<AdminApiResponse>(`${ADMIN}/courses/${courseId}/approve`);
  return res.data;
};

export const rejectCourse = async (courseId: string, reason: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch<AdminApiResponse>(`${ADMIN}/courses/${courseId}/reject`, { reason });
  return res.data;
};

export const getCourseResources = async (params?: {
  courseId?: string;
  fileType?: string;
  page?: number;
  limit?: number;
}): Promise<AdminApiResponse<{ resources: ICourseResource[]; total: number; totalSize: number }>> => {
  const res = await apiClient.get(`${ADMIN}/courses/resources`, { params });
  return res.data;
};

// ===== Media & Security =====

export const getEncryptionJobs = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminApiResponse<{ jobs: IEncryptionJob[]; total: number }>> => {
  const res = await apiClient.get(`${ADMIN}/media/encryption-jobs`, { params });
  return res.data;
};

export const retryEncryptionJob = async (jobId: string): Promise<AdminApiResponse> => {
  const res = await apiClient.post<AdminApiResponse>(`${ADMIN}/media/encryption-jobs/${jobId}/retry`);
  return res.data;
};

export const getKmsKeys = async (params?: {
  status?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}): Promise<AdminApiResponse<{ keys: IKmsKey[]; total: number }>> => {
  const res = await apiClient.get(`${ADMIN}/media/kms-keys`, { params });
  return res.data;
};

export const revokeKmsKey = async (keyId: string): Promise<AdminApiResponse> => {
  const res = await apiClient.delete<AdminApiResponse>(`${ADMIN}/media/kms-keys/${keyId}`);
  return res.data;
};

export const getSecurityConfig = async (): Promise<AdminApiResponse<ISecurityConfig>> => {
  const res = await apiClient.get<AdminApiResponse<ISecurityConfig>>(`${ADMIN}/media/security-config`);
  return res.data;
};

export const updateSecurityConfig = async (data: Partial<ISecurityConfig>): Promise<AdminApiResponse> => {
  const res = await apiClient.put<AdminApiResponse>(`${ADMIN}/media/security-config`, data);
  return res.data;
};

// ===== Finance =====

export const getTransactions = async (params?: {
  provider?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<AdminApiResponse<{ transactions: ITransaction[]; total: number; totalAmount: number }>> => {
  const res = await apiClient.get(`${ADMIN}/finance/transactions`, { params });
  return res.data;
};

export const getPricingPlans = async (): Promise<AdminApiResponse<IPricingPlan[]>> => {
  const res = await apiClient.get<AdminApiResponse<IPricingPlan[]>>(`${ADMIN}/finance/plans`);
  return res.data;
};

export const updatePricingPlan = async (planId: string, data: Partial<IPricingPlan>): Promise<AdminApiResponse> => {
  const res = await apiClient.put<AdminApiResponse>(`${ADMIN}/finance/plans/${planId}`, data);
  return res.data;
};

export const getRevenueStats = async (): Promise<AdminApiResponse<IRevenueStats>> => {
  const res = await apiClient.get<AdminApiResponse<IRevenueStats>>(`${ADMIN}/finance/revenue`);
  return res.data;
};

export const getActiveSubscriptions = async (): Promise<AdminApiResponse<IActiveSubscription[]>> => {
  const res = await apiClient.get<AdminApiResponse<IActiveSubscription[]>>(`${ADMIN}/finance/subscriptions`);
  return res.data;
};

// ===== Notifications & Progress =====

export const getNotificationTemplates = async (): Promise<AdminApiResponse<INotificationTemplate[]>> => {
  const res = await apiClient.get<AdminApiResponse<INotificationTemplate[]>>(`${ADMIN}/notifications/templates`);
  return res.data;
};

export const createNotificationTemplate = async (data: Partial<INotificationTemplate>): Promise<AdminApiResponse<INotificationTemplate>> => {
  const res = await apiClient.post<AdminApiResponse<INotificationTemplate>>(`${ADMIN}/notifications/templates`, data);
  return res.data;
};

export const updateNotificationTemplate = async (id: string, data: Partial<INotificationTemplate>): Promise<AdminApiResponse> => {
  const res = await apiClient.put<AdminApiResponse>(`${ADMIN}/notifications/templates/${id}`, data);
  return res.data;
};

export const getLearningProgress = async (params?: {
  courseId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<AdminApiResponse<{ progress: ILearningProgress[]; total: number }>> => {
  const res = await apiClient.get(`${ADMIN}/notifications/learning-progress`, { params });
  return res.data;
};
