// ========================
// Hook: useAdminCourseReview
// Mục đích:
// - gom query/mutation cho duyệt xuất bản và duyệt khóa học vào gói thuê bao
// - giữ query key và invalidation ngoài page kiểm duyệt
// ========================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  approveCourse,
  getCourseReviewDetail,
  getCoursesForReview,
  getSubscriptionCourseReviewDetail,
  getSubscriptionCoursesForReview,
  rejectCourse,
  reviewCourseSubscription,
} from '@/services/adminApi';
import type { SubscriptionCatalogStatus } from '@/types/admin.types';

export const adminCourseReviewKeys = {
  published: (status: string, search: string) => ['admin', 'courses', 'review', status, search] as const,
  publishedDetail: (courseId: string) => ['admin', 'courses', 'review-detail', courseId] as const,
  subscription: (status: SubscriptionCatalogStatus, search: string) =>
    ['admin', 'courses', 'subscription-review', status, search] as const,
  subscriptionDetail: (courseId: string) => ['admin', 'courses', 'subscription-review-detail', courseId] as const,
};

export function usePublishedCourseReviews(status: string, search: string, enabled = true) {
  return useQuery({
    queryKey: adminCourseReviewKeys.published(status, search),
    queryFn: async () => {
      const response = await getCoursesForReview({ status, search: search || undefined, page: 1, limit: 50 });
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không tải được danh sách khóa học.');
      }
      return response.data;
    },
    enabled,
  });
}

export function usePublishedCourseReviewDetail(courseId: string, enabled = true) {
  return useQuery({
    queryKey: adminCourseReviewKeys.publishedDetail(courseId),
    queryFn: async () => {
      const response = await getCourseReviewDetail(courseId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không tải được chi tiết khóa học.');
      }
      return response.data;
    },
    enabled: Boolean(courseId) && enabled,
  });
}

export function useSubscriptionCourseReviews(status: SubscriptionCatalogStatus, search: string, enabled = true) {
  return useQuery({
    queryKey: adminCourseReviewKeys.subscription(status, search),
    queryFn: async () => {
      const response = await getSubscriptionCoursesForReview({ status, search: search || undefined, page: 1, limit: 50 });
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không tải được danh sách khóa học đăng ký gói thuê bao.');
      }
      return response.data;
    },
    enabled,
  });
}

export function useSubscriptionCourseReviewDetail(courseId: string, enabled = true) {
  return useQuery({
    queryKey: adminCourseReviewKeys.subscriptionDetail(courseId),
    queryFn: async () => {
      const response = await getSubscriptionCourseReviewDetail(courseId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không tải được chi tiết khóa học.');
      }
      return response.data;
    },
    enabled: Boolean(courseId) && enabled,
  });
}

export function useApprovePublishedCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, finalCategoryId }: { courseId: string; finalCategoryId?: string }) =>
      approveCourse(courseId, finalCategoryId),
    onSuccess: async (response) => {
      if (response.status === 'ERR') throw new Error(response.message);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'courses', 'review'] });
      toast.success(response.message || 'Khóa học đã được phê duyệt và xuất bản.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể phê duyệt khóa học.'),
  });
}

export function useRejectPublishedCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, reason }: { courseId: string; reason: string }) => rejectCourse(courseId, reason),
    onSuccess: async (response) => {
      if (response.status === 'ERR') throw new Error(response.message);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'courses', 'review'] });
      toast.success(response.message || 'Đã gửi yêu cầu chỉnh sửa.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể gửi yêu cầu chỉnh sửa.'),
  });
}

export function useReviewCourseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      action,
      reason,
    }: {
      courseId: string;
      action: 'APPROVE' | 'REJECT' | 'REMOVE';
      reason?: string;
    }) => reviewCourseSubscription(courseId, action, reason),
    onSuccess: async (_response, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'courses', 'subscription-review'] });
      const message = variables.action === 'APPROVE'
        ? 'Đã đưa khóa học vào gói thuê bao.'
        : variables.action === 'REJECT'
          ? 'Đã từ chối đăng ký gói thuê bao.'
          : 'Đã rút khóa học khỏi gói thuê bao.';
      toast.success(message);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái thuê bao.'),
  });
}
