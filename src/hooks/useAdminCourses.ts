import { useQuery } from '@tanstack/react-query';
import { getAdminCourses } from '@/services/adminApi';

export type AdminCourseListParams = {
  search?: string;
  status?: string;
  subscriptionStatus?: string;
  categoryId?: string;
  level?: string;
  instructorId?: string;
  page?: number;
  limit?: number;
  sort?: string;
};

export const adminCourseKeys = {
  list: (params: AdminCourseListParams) => ['admin', 'courses', 'list', params] as const,
};

export function useAdminCourses(params: AdminCourseListParams) {
  return useQuery({
    queryKey: adminCourseKeys.list(params),
    queryFn: async () => {
      const response = await getAdminCourses(params);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không tải được danh sách khóa học.');
      }
      return response.data;
    },
  });
}