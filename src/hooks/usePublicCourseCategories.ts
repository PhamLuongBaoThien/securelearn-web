import { useQuery } from '@tanstack/react-query';
import { getCourseCategories, type ICourseCategoryNode } from '@/services/courseApi';

export const categoryKeys = {
  all: ['categories'] as const,
};

export function usePublicCourseCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: async () => {
      const response = await getCourseCategories();
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return (response.data || []) as ICourseCategoryNode[];
    },
    staleTime: 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
