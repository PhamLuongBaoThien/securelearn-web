import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeQuizProgress,
  getCourseProgress,
  sendProgressHeartbeat,
  type ProgressHeartbeatPayload,
  type QuizCompleteProgressPayload,
} from '@/services/progressApi';
import { enrolledKeys } from './useEnrolledCourses';
import { useAppSelector } from '@/app/hooks';

export const learningProgressKeys = {
  course: (courseId: string) => ['learning-progress', 'course', courseId] as const,
};

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: learningProgressKeys.course(courseId),
    queryFn: async () => {
      const response = await getCourseProgress(courseId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải tiến độ học tập.');
      }
      return response.data;
    },
    enabled: Boolean(courseId),
    staleTime: 15_000,
  });
}

export function useProgressHeartbeat(courseId: string) {
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?._id ?? '');

  return useMutation({
    mutationFn: async (payload: ProgressHeartbeatPayload) => {
      const response = await sendProgressHeartbeat(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể ghi nhận tiến độ học tập.');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(learningProgressKeys.course(courseId), data);
      if (userId) queryClient.invalidateQueries({ queryKey: enrolledKeys.byUser(userId) });
    },
  });
}

export function useCompleteQuizProgress(courseId: string) {
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?._id ?? '');

  return useMutation({
    mutationFn: async (payload: QuizCompleteProgressPayload) => {
      const response = await completeQuizProgress(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể hoàn tất tiến độ quiz.');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(learningProgressKeys.course(courseId), data);
      if (userId) queryClient.invalidateQueries({ queryKey: enrolledKeys.byUser(userId) });
    },
  });
}
