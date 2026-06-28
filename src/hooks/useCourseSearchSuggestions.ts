import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { getPublishedCourses, type ICourse } from '@/services/courseApi';
import { searchPublicInstructors, type PublicInstructorSearchItem } from '@/services/authApi';

export type CourseSearchSuggestion = Pick<ICourse, '_id' | 'slug' | 'title' | 'thumbnail' | 'instructorName'>;

export function useCourseSearchSuggestions(query: string, limit = 4) {
  const debouncedQuery = useDebounce(query.trim(), 500);
  return useQuery({
    queryKey: ['global-search-suggestions', debouncedQuery],
    queryFn: async (): Promise<{ courses: CourseSearchSuggestion[]; instructors: PublicInstructorSearchItem[]; total: number }> => {
      const [courseResponse, instructorResponse] = await Promise.all([
        getPublishedCourses({ search: debouncedQuery, page: 1, limit, sort: 'newest' }),
        searchPublicInstructors(debouncedQuery, 3),
      ]);
      const courseData = courseResponse.data as { courses?: ICourse[]; total?: number } | undefined;
      return {
        courses: (courseData?.courses ?? []).map(({ _id, slug, title, thumbnail, instructorName }) => ({ _id, slug, title, thumbnail, instructorName })),
        instructors: instructorResponse.status === 'OK' ? instructorResponse.data ?? [] : [],
        total: courseData?.total ?? 0,
      };
    },
    enabled: debouncedQuery.length > 0,
    placeholderData: (previousData) => previousData,
  });
}