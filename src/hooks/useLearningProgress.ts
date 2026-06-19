import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeQuizProgress,
  getCourseAccess,
  getCourseProgress,
  getLearnerActivity,
  getInstructorCourseAnalytics,
  sendProgressHeartbeat,
  type CourseAccessDetail,
  type CourseProgressDetail,
  type ProgressHeartbeatPayload,
  type QuizCompleteProgressPayload,
} from '@/services/progressApi';
import { enrolledKeys } from './useEnrolledCourses';
import { useAppSelector } from '@/app/hooks';


function unlockAccessFromProgress(currentAccess: CourseAccessDetail | undefined, progress: CourseProgressDetail | undefined) {
  if (!currentAccess || !progress) return currentAccess;

  const completedLessonIds = new Set(
    Object.values(progress.lessons)
      .filter((lesson) => lesson.status === 'COMPLETED')
      .map((lesson) => lesson.lessonId),
  );
  let changed = false;
  const lessons = Object.fromEntries(
    Object.entries(currentAccess.lessons).map(([lessonId, access]) => {
      if (!access.locked) return [lessonId, access];
      const requiredLessonIds = access.requiredLessonIds || [];
      const canUnlock = requiredLessonIds.length > 0 && requiredLessonIds.every((requiredLessonId) => completedLessonIds.has(requiredLessonId));
      if (!canUnlock) return [lessonId, access];
      changed = true;
      return [lessonId, { ...access, locked: false, reason: undefined, requiredLessonIds: [] }];
    }),
  );

  return changed ? { ...currentAccess, lessons } : currentAccess;
}

function preserveUnlockedAccess(previous: CourseAccessDetail | undefined, next: CourseAccessDetail | undefined) {
  if (!previous || !next) return next;

  const lessons = Object.fromEntries(
    Object.entries(next.lessons).map(([lessonId, nextAccess]) => {
      const previousAccess = previous.lessons[lessonId];
      if (previousAccess && !previousAccess.locked && nextAccess.locked) {
        return [lessonId, { ...nextAccess, locked: false, reason: undefined, requiredLessonIds: [] }];
      }
      return [lessonId, nextAccess];
    }),
  );

  return { ...next, lessons };
}


export const learningProgressKeys = {
  course: (courseId: string) => ['learning-progress', 'course', courseId] as const,
  access: (courseId: string) => ['learning-progress', 'access', courseId] as const,
  activity: (from?: string, to?: string) => ['learning-progress', 'activity', from || '', to || ''] as const,
  analytics: (courseId: string) => ['learning-progress', 'analytics', courseId] as const,
};
const learningProgressActivityKey = ['learning-progress', 'activity'] as const;

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

export function useCourseAccess(courseId: string) {
  const queryClient = useQueryClient();
  const queryKey = learningProgressKeys.access(courseId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getCourseAccess(courseId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải trạng thái mở khóa bài học.');
      }
      return preserveUnlockedAccess(queryClient.getQueryData<CourseAccessDetail>(queryKey), response.data);
    },
    enabled: Boolean(courseId),
    staleTime: 15_000,
  });
}

export function useLearnerActivity(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: learningProgressKeys.activity(params?.from, params?.to),
    queryFn: async () => {
      const response = await getLearnerActivity(params);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải hoạt động học tập.');
      }
      return response.data;
    },
    staleTime: 60_000,
  });
}

export function useInstructorCourseAnalytics(courseId: string) {
  return useQuery({
    queryKey: learningProgressKeys.analytics(courseId),
    queryFn: async () => {
      const response = await getInstructorCourseAnalytics(courseId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải dữ liệu phân tích khóa học.');
      }
      return response.data;
    },
    enabled: Boolean(courseId),
    staleTime: 60_000,
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
      if (data) {
        queryClient.setQueryData<CourseAccessDetail | undefined>(learningProgressKeys.access(courseId), (currentAccess) =>
          unlockAccessFromProgress(currentAccess, data),
        );
      }
      queryClient.invalidateQueries({ queryKey: learningProgressKeys.access(courseId) });
      queryClient.invalidateQueries({ queryKey: learningProgressActivityKey });
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
      if (data) {
        queryClient.setQueryData<CourseAccessDetail | undefined>(learningProgressKeys.access(courseId), (currentAccess) =>
          unlockAccessFromProgress(currentAccess, data),
        );
      }
      queryClient.invalidateQueries({ queryKey: learningProgressKeys.access(courseId) });
      queryClient.invalidateQueries({ queryKey: learningProgressActivityKey });
      if (userId) queryClient.invalidateQueries({ queryKey: enrolledKeys.byUser(userId) });
    },
  });
}






