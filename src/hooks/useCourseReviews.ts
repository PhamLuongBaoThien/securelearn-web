import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCourseReviews,
  getInstructorRatingStats,
  getMyCourseReview,
  upsertCourseReview,
  type IInstructorRatingStats,
  type ICourseReview,
} from '@/services/courseApi';
import { catalogKeys } from '@/hooks/useCatalog';
import { courseDetailKeys } from '@/hooks/useCourseDetail';
import { courseLearningKeys } from '@/hooks/useCourseLearning';

export const courseReviewKeys = {
  list: (courseId: string) => ['courses', 'reviews', courseId] as const,
  mine: (courseId: string) => ['courses', 'reviews', courseId, 'me'] as const,
  instructor: (instructorId: string) => ['courses', 'reviews', 'instructor', instructorId] as const,
};

export function useCourseReviews(courseId: string, enabled = true) {
  return useQuery({
    queryKey: courseReviewKeys.list(courseId),
    queryFn: async () => {
      const response = await getCourseReviews(courseId, { page: 1, limit: 10 });
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải đánh giá khóa học.');
      }
      return response.data;
    },
    enabled: Boolean(courseId) && enabled,
  });
}

export function useMyCourseReview(courseId: string, enabled = true) {
  return useQuery<ICourseReview | null>({
    queryKey: courseReviewKeys.mine(courseId),
    queryFn: async () => {
      const response = await getMyCourseReview(courseId);
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tải đánh giá của bạn.');
      }
      return response.data ?? null;
    },
    enabled: Boolean(courseId) && enabled,
  });
}

export function useUpsertCourseReview(courseId: string, slug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { rating: number; comment?: string; userAvatarUrl?: string }) => upsertCourseReview(courseId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseReviewKeys.list(courseId) }),
        queryClient.invalidateQueries({ queryKey: courseReviewKeys.mine(courseId) }),
        queryClient.invalidateQueries({ queryKey: courseLearningKeys.course(courseId) }),
        slug ? queryClient.invalidateQueries({ queryKey: courseDetailKeys.bySlug(slug) }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
      ]);
    },
  });
}

export function useInstructorRatingStats(instructorId: string, enabled = true) {
  return useQuery<IInstructorRatingStats>({
    queryKey: courseReviewKeys.instructor(instructorId),
    queryFn: async () => {
      const response = await getInstructorRatingStats(instructorId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải xếp hạng giảng viên.');
      }
      return response.data;
    },
    enabled: Boolean(instructorId) && enabled,
    staleTime: 60_000,
  });
}
