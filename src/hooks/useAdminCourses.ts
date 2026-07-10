import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminCourses, updateAdminCourseWatch } from '@/services/adminApi';
import { toast } from 'sonner';

export type AdminCourseListParams = {
  search?: string;
  status?: string;
  subscriptionStatus?: string;
  categoryId?: string;
  level?: string;
  instructorId?: string;
  adminWatched?: boolean;
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
    placeholderData: (previousData) => previousData,
  });
}
export function useUpdateAdminCourseWatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, isWatched }: { ids: string[]; isWatched: boolean }) => updateAdminCourseWatch(ids, isWatched),
    onSuccess: async (response, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'courses', 'list'] });
      toast.success(response.message || (variables.isWatched ? 'Đã đánh dấu theo dõi khóa học.' : 'Đã bỏ theo dõi khóa học.'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái theo dõi.'),
  });
}