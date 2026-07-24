import { useInfiniteQuery } from '@tanstack/react-query';
import { getRelatedCourses, type PaginatedData } from '@/services/courseApi';

export const RELATED_COURSES_PAGE_SIZE = 4;

export const relatedCourseKeys = {
  list: (courseId?: string) => ['courses', 'related', courseId] as const,
};

export function useRelatedCourses(courseId?: string) {
  return useInfiniteQuery<PaginatedData>({
    queryKey: relatedCourseKeys.list(courseId),
    queryFn: async ({ pageParam }) => {
      if (!courseId) {
        return { courses: [], total: 0, page: 1, totalPages: 0 };
      }

      const response = await getRelatedCourses(courseId, {
        page: Number(pageParam) || 1,
        limit: RELATED_COURSES_PAGE_SIZE,
      });
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tải khóa học liên quan.');
      }
      return response.data ?? { courses: [], total: 0, page: 1, totalPages: 0 };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined
    ),
    enabled: Boolean(courseId),
  });
}