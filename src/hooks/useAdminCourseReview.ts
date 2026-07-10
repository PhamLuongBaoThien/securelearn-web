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
  multiReviewCourseSubscription,
  multiReviewPublishedCourses,
} from '@/services/adminApi';
import type { SubscriptionCatalogStatus } from '@/types/admin.types';

export const adminCourseReviewKeys = {
  published: (status: string, search: string, sort: string) => ['admin', 'courses', 'review', status, search, sort] as const,
  publishedDetail: (courseId: string) => ['admin', 'courses', 'review-detail', courseId] as const,
  subscription: (status: SubscriptionCatalogStatus, search: string, sort: string) =>
    ['admin', 'courses', 'subscription-review', status, search, sort] as const,
  subscriptionDetail: (courseId: string) => ['admin', 'courses', 'subscription-review-detail', courseId] as const,
};

export function usePublishedCourseReviews(status: string, search: string, sort: string, enabled = true) {
  return useQuery({
    queryKey: adminCourseReviewKeys.published(status, search, sort),
    queryFn: async () => {
      const response = await getCoursesForReview({ status, search: search || undefined, page: 1, limit: 50, sort });
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

export function useSubscriptionCourseReviews(status: SubscriptionCatalogStatus, search: string, sort: string, enabled = true) {
  return useQuery({
    queryKey: adminCourseReviewKeys.subscription(status, search, sort),
    queryFn: async () => {
      const response = await getSubscriptionCoursesForReview({ status, search: search || undefined, page: 1, limit: 50, sort });
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

export function useMultiReviewPublishedCourses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      action,
      reason,
    }: {
      ids: string[];
      action: 'APPROVE' | 'REJECT';
      reason?: string;
    }) => multiReviewPublishedCourses(ids, action, reason),
    onSuccess: async (response, variables) => {
      if (response.status === 'ERR') throw new Error(response.message);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'courses', 'review'] });
      const result = response.data;
      const actionLabel = variables.action === 'APPROVE' ? 'phê duyệt' : 'gửi yêu cầu chỉnh sửa';
      if (result?.failed) {
        toast.warning(`Đã ${actionLabel} ${result.success}/${result.total} khóa học. ${result.failed} khóa học chưa xử lý được.`);
      } else {
        toast.success(response.message || `Đã ${actionLabel} các khóa học được chọn.`);
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể kiểm duyệt hàng loạt.'),
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

export function useMultiReviewCourseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      action,
      reason,
    }: {
      ids: string[];
      action: 'APPROVE' | 'REJECT' | 'REMOVE';
      reason?: string;
    }) => multiReviewCourseSubscription(ids, action, reason),
    onSuccess: async (_response, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'courses', 'subscription-review'] });
      await queryClient.invalidateQueries({ queryKey: ['admin_courses'] });
      const message = variables.action === 'APPROVE'
        ? 'Đã đưa các khóa học được chọn vào gói thuê bao.'
        : variables.action === 'REJECT'
          ? 'Đã từ chối các khóa học đăng ký.'
          : 'Đã rút các khóa học được chọn khỏi gói thuê bao.';
      toast.success(message);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái thuê bao hàng loạt.'),
  });
}
