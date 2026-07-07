// ========================
// Admin API Client
// Mục đích:
// - gom các API quản trị dùng chung của frontend admin
// - bổ sung action review catalog thuê bao cạnh các flow review course hiện có
// ========================
import apiClient from './apiClient';
import type { ICourse } from './courseApi';
import type {
  IWebsiteConfig,
  WebsiteConfigInput,
  Banner,
  BannerInput,
  BannerReorderInput,
  ICategory,
  IAdminUser,
  ICourseReview,
  IAdminCourseListItem,
  IAdminCourseListSummary,
  ISubscriptionCourseReview,
  SubscriptionCatalogStatus,
  ICourseResource,
  IEncryptionJob,
  IKmsKey,
  ISecurityConfig,
  ITransaction,
  IPricingPlan,
  IRevenueStats,
  IRevenueSplitConfig,
  IActiveSubscription,
  INotificationTemplate,
  ILearningProgress,
  IRolePermission,
  AdminApiResponse,
  IAdminStaff,
} from '@/types/admin.types';

const ADMIN = '/api/admin';
const ADMIN_FINANCE = '/api/payments/admin/finance';

type CategoryNodeResponse = Omit<ICategory, 'children'> & {
  children?: CategoryNodeResponse[];
};

export type AdminStaffPayload = {
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  adminRole: string;
  password?: string;
};

// ===== System & CMS =====

export const getWebsiteConfig = async (): Promise<AdminApiResponse<IWebsiteConfig>> => {
  const res = await apiClient.get<AdminApiResponse<IWebsiteConfig>>(`${ADMIN}/system/config`);
  return res.data;
};

const toWebsiteConfigFormData = (data: WebsiteConfigInput) => {
  const form = new FormData();
  if (data.siteUrl !== undefined) form.append('siteUrl', data.siteUrl);
  if (data.logoUrl !== undefined) form.append('logoUrl', data.logoUrl);
  if (data.faviconUrl !== undefined) form.append('faviconUrl', data.faviconUrl);
  if (data.contactEmail !== undefined) form.append('contactEmail', data.contactEmail);
  if (data.contactPhone !== undefined) form.append('contactPhone', data.contactPhone);
  if (data.address !== undefined) form.append('address', data.address);
  if (data.facebookUrl !== undefined) form.append('facebookUrl', data.facebookUrl);
  if (data.youtubeUrl !== undefined) form.append('youtubeUrl', data.youtubeUrl);
  if (data.githubUrl !== undefined) form.append('githubUrl', data.githubUrl);
  if (data.linkedinUrl !== undefined) form.append('linkedinUrl', data.linkedinUrl);
  if (data.logo) form.append('logo', data.logo);
  if (data.favicon) form.append('favicon', data.favicon);
  return form;
};

export const updateWebsiteConfig = async (data: WebsiteConfigInput): Promise<AdminApiResponse<IWebsiteConfig>> => {
  const res = await apiClient.put<AdminApiResponse<IWebsiteConfig>>(`${ADMIN}/system/config`, toWebsiteConfigFormData(data));
  return res.data;
};

const toBannerFormData = (data: BannerInput) => {
  const form = new FormData();
  form.append('title', data.title);
  form.append('subtitle', data.subtitle);
  form.append('linkUrl', data.linkUrl || '');
  if (data.image) form.append('image', data.image);
  else if (data.imageUrl) form.append('imageUrl', data.imageUrl);
  return form;
};

export const getBanners = async (): Promise<AdminApiResponse<Banner[]>> => {
  const res = await apiClient.get<AdminApiResponse<Banner[]>>(`${ADMIN}/system/banners`);
  return res.data;
};

export const createBanner = async (data: BannerInput): Promise<AdminApiResponse<Banner>> => {
  const res = await apiClient.post<AdminApiResponse<Banner>>(`${ADMIN}/system/banners`, toBannerFormData(data));
  return res.data;
};

export const updateBanner = async (id: string, data: BannerInput): Promise<AdminApiResponse<Banner>> => {
  const res = await apiClient.put<AdminApiResponse<Banner>>(`${ADMIN}/system/banners/${id}`, toBannerFormData(data));
  return res.data;
};

export const setBannerStatus = async (id: string, isActive: boolean): Promise<AdminApiResponse<Banner>> => {
  const res = await apiClient.patch<AdminApiResponse<Banner>>(`${ADMIN}/system/banners/${id}/status`, { isActive });
  return res.data;
};

export const reorderBanners = async (data: BannerReorderInput): Promise<AdminApiResponse<Banner[]>> => {
  const res = await apiClient.patch<AdminApiResponse<Banner[]>>(`${ADMIN}/system/banners/reorder`, data);
  return res.data;
};

export const deleteBanner = async (id: string): Promise<AdminApiResponse> => {
  const res = await apiClient.delete<AdminApiResponse>(`${ADMIN}/system/banners/${id}`);
  return res.data;
};
export const getCategories = async (): Promise<AdminApiResponse<ICategory[]>> => {
  const res = await apiClient.get<{ status: 'OK' | 'ERR'; message?: string; data?: CategoryNodeResponse[] }>('/api/categories/admin/all');

  return {
    status: res.data.status,
    message: res.data.message || '',
    data: (res.data.data || []).map(mapCategoryNode),
  };
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
}): Promise<AdminApiResponse<ICategory>> => {
  const res = await apiClient.post<{ status: 'OK' | 'ERR'; message: string; data?: CategoryNodeResponse }>('/api/categories', data);
  return {
    status: res.data.status,
    message: res.data.message,
    data: res.data.data ? mapCategoryNode(res.data.data) : undefined,
  };
};

export const updateCategory = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<AdminApiResponse<ICategory>> => {
  const res = await apiClient.put<{ status: 'OK' | 'ERR'; message: string; data?: CategoryNodeResponse }>(`/api/categories/${id}`, data);
  return {
    status: res.data.status,
    message: res.data.message,
    data: res.data.data ? mapCategoryNode(res.data.data) : undefined,
  };
};

export const setCategoryStatus = async (id: string, isActive: boolean): Promise<AdminApiResponse<ICategory>> => {
  const res = await apiClient.patch<{ status: 'OK' | 'ERR'; message: string; data?: CategoryNodeResponse }>(`/api/categories/${id}/status`, { isActive });
  return {
    status: res.data.status,
    message: res.data.message,
    data: res.data.data ? mapCategoryNode(res.data.data) : undefined,
  };
};

export const deleteCategory = async (id: string): Promise<AdminApiResponse> => {
  const res = await apiClient.delete<{ status: 'OK' | 'ERR'; message: string }>(`/api/categories/${id}`);
  return res.data;
};

const mapCategoryNode = (category: CategoryNodeResponse): ICategory => ({
  _id: category._id,
  name: category.name,
  slug: category.slug,
  description: category.description || '',
  parentId: category.parentId ?? null,
  sortOrder: category.sortOrder ?? 0,
  isActive: category.isActive ?? true,
  courseCount: category.courseCount ?? 0,
  children: (category.children || []).map(mapCategoryNode),
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

// ===== Users & RBAC =====

export const getAdminStaff = async (): Promise<AdminApiResponse<IAdminStaff[]>> => {
  const res = await apiClient.get<AdminApiResponse<IAdminStaff[]>>(`${ADMIN}/auth/staff`);
  return res.data;
};

export const createAdminStaff = async (data: AdminStaffPayload): Promise<AdminApiResponse<IAdminStaff>> => {
  const res = await apiClient.post<AdminApiResponse<IAdminStaff>>(`${ADMIN}/auth/staff`, data);
  return res.data;
};

export const updateAdminStaff = async (id: string, data: AdminStaffPayload): Promise<AdminApiResponse<IAdminStaff>> => {
  const res = await apiClient.put<AdminApiResponse<IAdminStaff>>(`${ADMIN}/auth/staff/${id}`, data);
  return res.data;
};

export const deleteAdminStaff = async (id: string): Promise<AdminApiResponse> => {
  const res = await apiClient.delete(`${ADMIN}/auth/staff/${id}`);
  return res.data;
};

// ===== Role Permissions =====

export const getRolePermissions = async (): Promise<AdminApiResponse<IRolePermission[]>> => {
  const res = await apiClient.get<AdminApiResponse<IRolePermission[]>>(`${ADMIN}/auth/roles`);
  return res.data;
};

export const createRole = async (data: {
  roleKey: string;
  label: string;
  color: string;
  permissions?: string[];
}): Promise<AdminApiResponse<IRolePermission>> => {
  const res = await apiClient.post<AdminApiResponse<IRolePermission>>(`${ADMIN}/auth/roles`, data);
  return res.data;
};

export const updateRolePermissions = async (
  roleKey: string,
  data: { permissions?: string[]; label?: string; color?: string }
): Promise<AdminApiResponse<IRolePermission>> => {
  const res = await apiClient.put<AdminApiResponse<IRolePermission>>(
    `${ADMIN}/auth/roles/${roleKey}`,
    data
  );
  return res.data;
};

export const deleteRole = async (roleKey: string): Promise<AdminApiResponse> => {
  const res = await apiClient.delete<AdminApiResponse>(`${ADMIN}/auth/roles/${roleKey}`);
  return res.data;
};

export const getUsers = async (params?: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<AdminApiResponse<{ users: IAdminUser[]; total: number; page: number; totalPages: number }>> => {
  const res = await apiClient.get(`${ADMIN}/auth/users`, { params });
  return res.data;
};

export const lockUser = async (userId: string, reason: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch(`${ADMIN}/auth/users/${userId}/lock`, { reason });
  return res.data;
};

export const unlockUser = async (userId: string, reason?: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch(`${ADMIN}/auth/users/${userId}/unlock`, { reason });
  return res.data;
};

// ===== Courses =====

export const getAdminCourses = async (params?: {
  search?: string;
  status?: string;
  subscriptionStatus?: string;
  categoryId?: string;
  level?: string;
  instructorId?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<AdminApiResponse<{
  courses: IAdminCourseListItem[];
  total: number;
  page: number;
  totalPages: number;
  summary: IAdminCourseListSummary;
}>> => {
  const res = await apiClient.get(`${ADMIN}/courses`, { params });
  return res.data;
};

export const getCoursesForReview = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<AdminApiResponse<{ courses: ICourseReview[]; total: number; page: number; totalPages: number }>> => {
  const res = await apiClient.get(`${ADMIN}/courses/review`, { params });
  return res.data;
};

export const getCourseReviewDetail = async (courseId: string): Promise<AdminApiResponse<ICourse>> => {
  const res = await apiClient.get<AdminApiResponse<ICourse>>(`${ADMIN}/courses/${courseId}/review`);
  return res.data;
};

export const approveCourse = async (courseId: string, finalCategoryId?: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch<AdminApiResponse>(`${ADMIN}/courses/${courseId}/approve`, finalCategoryId ? { finalCategoryId } : {});
  return res.data;
};

export const getSubscriptionCoursesForReview = async (params?: {
  status?: SubscriptionCatalogStatus;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<AdminApiResponse<{ courses: ISubscriptionCourseReview[]; total: number; page: number; totalPages: number }>> => {
  const res = await apiClient.get(`${ADMIN}/courses/subscription-review`, { params });
  return res.data;
};

export const getSubscriptionCourseReviewDetail = async (courseId: string): Promise<AdminApiResponse<ICourse>> => {
  const res = await apiClient.get<AdminApiResponse<ICourse>>(`${ADMIN}/courses/${courseId}/subscription-review`);
  return res.data;
};

export const reviewCourseSubscription = async (
  courseId: string,
  action: 'APPROVE' | 'REJECT' | 'REMOVE',
  reason?: string
): Promise<AdminApiResponse> => {
  // Admin review catalog thuê bao tách khỏi flow approve/reject publish của course chính.
  const res = await apiClient.patch<AdminApiResponse>(`${ADMIN}/courses/${courseId}/subscription-review`, { action, reason });
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
  search?: string;
  provider?: string;
  status?: string;
  sort?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  productType?: 'COURSE' | 'SUBSCRIPTION';
}): Promise<AdminApiResponse<{ transactions: ITransaction[]; total: number; totalAmount: number; summary?: IRevenueStats }>> => {
  const res = await apiClient.get(`${ADMIN_FINANCE}/transactions`, { params });
  return res.data;
};

export const getRevenueSplitConfig = async (productType: 'COURSE' | 'SUBSCRIPTION' = 'COURSE'): Promise<AdminApiResponse<IRevenueSplitConfig>> => {
  const res = await apiClient.get<AdminApiResponse<IRevenueSplitConfig>>(`${ADMIN_FINANCE}/split-config`, { params: { productType } });
  return res.data;
};

export const updateRevenueSplitConfig = async (data: IRevenueSplitConfig, productType: 'COURSE' | 'SUBSCRIPTION' = 'COURSE'): Promise<AdminApiResponse<IRevenueSplitConfig>> => {
  const res = await apiClient.put<AdminApiResponse<IRevenueSplitConfig>>(`${ADMIN_FINANCE}/split-config`, data, { params: { productType } });
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
  const res = await apiClient.get<AdminApiResponse<IRevenueStats>>(`${ADMIN_FINANCE}/revenue`);
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
  if (params?.courseId) {
    const { courseId, ...rest } = params;
    const res = await apiClient.get(`${ADMIN}/courses/${courseId}/students`, { params: rest });
    return res.data;
  }
  const res = await apiClient.get(`${ADMIN}/notifications/learning-progress`, { params });
  return res.data;
};

export const multiLockUsers = async (ids: string[], reason: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch(`${ADMIN}/auth/users/multi-lock`, { ids, reason });
  return res.data;
};

export const multiUnlockUsers = async (ids: string[], reason?: string): Promise<AdminApiResponse> => {
  const res = await apiClient.patch(`${ADMIN}/auth/users/multi-unlock`, { ids, reason });
  return res.data;
};

export const multiDeleteStaff = async (ids: string[]): Promise<AdminApiResponse> => {
  const res = await apiClient.delete(`${ADMIN}/auth/staff/multi`, { data: { ids } });
  return res.data;
};

export const multiReviewCourseSubscription = async (
  ids: string[],
  action: 'APPROVE' | 'REJECT' | 'REMOVE',
  reason?: string
): Promise<AdminApiResponse> => {
  const res = await apiClient.patch<AdminApiResponse>(`${ADMIN}/courses/subscription-review/multi`, { ids, action, reason });
  return res.data;
};
