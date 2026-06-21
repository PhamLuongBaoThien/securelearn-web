// ========================
// Hook: useCourseCouponPreviews
// Mục đích:
// - gom nhiều khóa học thành một request bulk để lấy coupon preview tốt nhất
// - tránh mỗi CourseCard tự gọi API riêng gây chậm và nhấp nháy UI
// Dùng cho:
// - catalog grid
// - course carousel hoặc các danh sách khóa học nhiều item
// ========================
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ICourse } from '@/services/courseApi';
import { getBestCourseCouponPreviews } from '@/services/paymentApi';
import { useAppSelector } from '@/app/hooks';

export function useCourseCouponPreviews(courses: ICourse[], enabled = true) {
  const userId = useAppSelector((state) => state.auth.user?._id ?? 'guest');
  const previewItems = useMemo(
    () => courses
      .filter((course) => course.price > 0)
      .map((course) => ({ courseId: course._id, price: course.price })),
    [courses]
  );
  const signature = previewItems.map((item) => `${item.courseId}:${item.price}`).join('|');

  return useQuery({
    queryKey: ['course-coupon-previews', userId, signature],
    enabled: enabled && previewItems.length > 0,
    queryFn: async () => {
      const response = await getBestCourseCouponPreviews(previewItems);
      if (!response.data) throw new Error(response.message || 'Không thể tải coupon preview.');
      return response.data.previews;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

