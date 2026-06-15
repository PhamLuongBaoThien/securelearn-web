// ========================
// Hook: useCourseLearning
// Mục đích:
// - tải curriculum thật và video asset cho màn học
// - gửi heartbeat thuê bao qua course-service khi player xác nhận thời gian xem hợp lệ
// ========================
import { useMutation, useQuery } from '@tanstack/react-query';
import { getCourseForLearning, sendSubscriptionHeartbeat } from '@/services/courseApi';
import { getVideoAsset } from '@/services/mediaApi';

export const courseLearningKeys = {
  course: (courseId: string) => ['learning', 'course', courseId] as const,
  video: (videoAssetId: string) => ['learning', 'video', videoAssetId] as const,
};

export function useCourseLearning(courseId: string) {
  return useQuery({
    queryKey: courseLearningKeys.course(courseId),
    queryFn: async () => {
      const response = await getCourseForLearning(courseId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải nội dung khóa học.');
      }
      return response.data;
    },
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });
}

export function useLearningVideoAsset(videoAssetId?: string | null) {
  return useQuery({
    queryKey: courseLearningKeys.video(videoAssetId || ''),
    queryFn: async () => {
      const response = await getVideoAsset(videoAssetId!);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải video bài học.');
      }
      return response.data;
    },
    enabled: Boolean(videoAssetId),
    staleTime: 4 * 60_000,
  });
}

export function useSubscriptionHeartbeat() {
  return useMutation({
    mutationFn: sendSubscriptionHeartbeat,
  });
}
