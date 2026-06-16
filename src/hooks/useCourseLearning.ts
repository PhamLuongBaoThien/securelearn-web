// ========================
// Hook: useCourseLearning
// Mục đích:
// - tải curriculum thật và video asset cho màn học
// - gửi heartbeat thuê bao qua course-service khi player xác nhận thời gian xem hợp lệ
// ========================
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getCourseForLearning,
  getQuizForAttempt,
  sendSubscriptionHeartbeat,
  startQuizAttempt,
  submitQuizAttempt,
  type QuizAttemptAnswerPayload,
} from '@/services/courseApi';
import { getVideoAsset } from '@/services/mediaApi';

export const courseLearningKeys = {
  course: (courseId: string) => ['learning', 'course', courseId] as const,
  video: (videoAssetId: string) => ['learning', 'video', videoAssetId] as const,
  quiz: (courseId: string, lessonId: string) => ['learning', 'quiz', courseId, lessonId] as const,
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

export function useLearningQuiz(courseId: string, lessonId?: string, enabled = true) {
  return useQuery({
    queryKey: courseLearningKeys.quiz(courseId, lessonId || ''),
    queryFn: async () => {
      const response = await getQuizForAttempt(courseId, lessonId!);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải bài quiz.');
      }
      return response.data;
    },
    enabled: Boolean(courseId && lessonId && enabled),
    staleTime: 30_000,
  });
}

export function useStartQuizAttempt(courseId: string, lessonId: string, quizId: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await startQuizAttempt(courseId, lessonId, quizId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể bắt đầu bài quiz.');
      }
      return response.data;
    },
  });
}

export function useSubmitQuizAttempt(courseId: string, lessonId: string, quizId: string, attemptId: string) {
  return useMutation({
    mutationFn: async (answers: QuizAttemptAnswerPayload[]) => {
      const response = await submitQuizAttempt(courseId, lessonId, quizId, attemptId, answers);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể nộp bài quiz.');
      }
      return response.data;
    },
  });
}
