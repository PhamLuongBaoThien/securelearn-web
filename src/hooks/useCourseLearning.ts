// ========================
// Hook: useCourseLearning
// Mục đích:
// - tải curriculum thật và video asset cho màn học
// ========================
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getCourseForLearning,
  getQuizAttemptHistory,
  getQuizForAttempt,
  startQuizAttempt,
  submitQuizAttempt,
  type QuizAttemptAnswerPayload,
} from '@/services/courseApi';
import { createPlaybackSession } from '@/services/mediaApi';

export const courseLearningKeys = {
  course: (courseId: string) => ['learning', 'course', courseId] as const,
  quiz: (courseId: string, lessonId: string) => ['learning', 'quiz', courseId, lessonId] as const,
  quizAttempts: (courseId: string, lessonId: string, quizId: string) => ['learning', 'quiz-attempts', courseId, lessonId, quizId] as const,
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

export function useCreatePlaybackSession() {
  return useMutation({
    mutationFn: async ({ videoAssetId, learningSession, clientInstanceId }: { videoAssetId: string; learningSession?: { id: string; token: string }; clientInstanceId?: string }) => {
      const response = await createPlaybackSession(videoAssetId, learningSession, clientInstanceId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tạo phiên phát video.');
      }
      return response.data;
    },
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

export function useQuizAttemptHistory(courseId: string, lessonId: string, quizId: string, enabled = true) {
  return useQuery({
    queryKey: courseLearningKeys.quizAttempts(courseId, lessonId, quizId),
    queryFn: async () => {
      const response = await getQuizAttemptHistory(courseId, lessonId, quizId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải lịch sử làm bài.');
      }
      return response.data;
    },
    enabled: Boolean(courseId && lessonId && quizId && enabled),
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
