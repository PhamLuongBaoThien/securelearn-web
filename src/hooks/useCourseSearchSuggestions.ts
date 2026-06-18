import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { getPublishedCourses, type ICourse } from '@/services/courseApi';

export type CourseSearchSuggestion = Pick<ICourse, '_id' | 'slug' | 'title' | 'thumbnail' | 'instructorName'>;

const courseSearchSuggestionKeys = {
  all: ['courses', 'public', 'suggestions'] as const,
  list: (keyword: string) => ['courses', 'public', 'suggestions', keyword] as const,
};

export function useCourseSearchSuggestions(query: string, limit = 5) {
  const debouncedQuery = useDebounce(query.trim(), 500);

  return useQuery({
    queryKey: courseSearchSuggestionKeys.list(debouncedQuery),
    queryFn: async (): Promise<{ courses: CourseSearchSuggestion[]; total: number; keyword: string }> => {
      const response = await getPublishedCourses({
        search: debouncedQuery,
        page: 1,
        limit,
        sort: 'newest',
      });

      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tìm kiếm khóa học.');
      }

      const data = response.data as { courses?: ICourse[]; total?: number } | undefined;

      return {
        courses: (data?.courses ?? []).map((course) => ({
          _id: course._id,
          slug: course.slug,
          title: course.title,
          thumbnail: course.thumbnail,
          instructorName: course.instructorName,
        })),
        total: data?.total ?? 0,
        keyword: debouncedQuery,
      };
    },
    enabled: debouncedQuery.length > 0,
    placeholderData: (previousData) => previousData,
  });
}
