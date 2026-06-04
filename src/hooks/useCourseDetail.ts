// ========================
// Hook: useCourseDetail
// Lấy chi tiết khóa học theo slug để hiển thị trang CourseDetail công khai.
// ========================
import { useQuery } from '@tanstack/react-query';
import { getCourseBySlug, type ICourse } from '@/services/courseApi';

export const courseDetailKeys = {
  all: ['courses', 'public', 'detail'] as const,
  bySlug: (slug: string) => ['courses', 'public', 'detail', slug] as const,
};

export function useCourseDetail(slug: string | undefined) {
  return useQuery<ICourse>({
    queryKey: courseDetailKeys.bySlug(slug ?? ''),
    queryFn: async () => {
      if (!slug) throw new Error('Slug không hợp lệ.');
      const response = await getCourseBySlug(slug);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Khóa học không tồn tại.');
      }
      return response.data;
    },
    enabled: Boolean(slug),
    staleTime: 60 * 1000, // 1 phút
    retry: 1,
  });
}
