import apiClient from './apiClient';

interface ApiResponse<T = undefined> {
  status: string;
  message?: string;
  data?: T;
}

export type LessonProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type LessonProgressType = 'VIDEO' | 'QUIZ';
export type ProgressionMode = 'FREE' | 'SEQUENTIAL' | 'QUIZ_REQUIRES_PREVIOUS_LESSONS';

export interface CourseProgressSummary {
  courseId: string;
  courseVersionId: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastLessonId: string;
  lastPositionSeconds: number;
  completedAt?: string | null;
  updatedAt?: string;
}

export interface LessonProgressSummary {
  lessonId: string;
  lessonType: LessonProgressType;
  status: LessonProgressStatus;
  watchedSeconds: number;
  durationSeconds: number;
  watchPercent: number;
  quizAttemptId: string;
  quizScore: number;
  quizPassed: boolean;
  watchedSegments?: Array<{ start: number; end: number }>;
  activeSeconds?: number;
  lastPositionSeconds: number;
  completedAt?: string | null;
  updatedAt?: string;
}

export interface CourseProgressDetail {
  course: CourseProgressSummary;
  lessons: Record<string, LessonProgressSummary>;
}

export interface LessonAccessSummary {
  lessonId: string;
  locked: boolean;
  reason?: string;
  requiredLessonIds?: string[];
}

export interface CourseAccessDetail {
  courseId: string;
  progressionMode: ProgressionMode;
  lessons: Record<string, LessonAccessSummary>;
}

export interface LearnerActivityDay {
  date: string;
  activeSeconds: number;
  completedLessons: number;
  completedCourses: number;
}

export interface LearnerActivitySummary {
  totalActiveSeconds: number;
  activeDays: number;
  currentStreakDays: number;
  days: LearnerActivityDay[];
}

export interface CourseAnalyticsSummary {
  courseId: string;
  totalLearners: number;
  completedLearners: number;
  completionRate: number;
  lessons: Array<{
    lessonId: string;
    lessonType: LessonProgressType;
    startedCount: number;
    completedCount: number;
    completionRate: number;
    averageWatchPercent?: number;
    quizPassRate?: number;
    averageQuizScore?: number;
  }>;
}

export interface ProgressHeartbeatPayload {
  courseId: string;
  lessonId: string;
  lessonType: LessonProgressType;
  sessionId: string;
  positionSeconds?: number;
  watchedSecondsDelta?: number;
  segmentStartSeconds?: number;
  playbackRate?: number;
  tabVisible?: boolean;
  quizAttemptId?: string;
}

export interface QuizCompleteProgressPayload {
  courseId: string;
  lessonId: string;
  attemptId: string;
  score: number;
  passed: boolean;
}

export const sendProgressHeartbeat = async (payload: ProgressHeartbeatPayload) => {
  const { data } = await apiClient.post<ApiResponse<CourseProgressDetail>>('/api/progress/heartbeat', payload);
  return data;
};

export const completeQuizProgress = async (payload: QuizCompleteProgressPayload) => {
  const { data } = await apiClient.post<ApiResponse<CourseProgressDetail>>('/api/progress/quiz-complete', payload);
  return data;
};

export const getCourseProgress = async (courseId: string) => {
  const { data } = await apiClient.get<ApiResponse<CourseProgressDetail>>(`/api/progress/courses/${courseId}`);
  return data;
};

export const getCourseAccess = async (courseId: string) => {
  const { data } = await apiClient.get<ApiResponse<CourseAccessDetail>>(`/api/progress/courses/${courseId}/access`);
  return data;
};

export const getLearnerActivity = async (params?: { from?: string; to?: string }) => {
  const { data } = await apiClient.get<ApiResponse<LearnerActivitySummary>>('/api/progress/me/activity', { params });
  return data;
};

export const getInstructorCourseAnalytics = async (courseId: string) => {
  const { data } = await apiClient.get<ApiResponse<CourseAnalyticsSummary>>(
    `/api/progress/instructor/courses/${courseId}/analytics`,
  );
  return data;
};

export const getMyCoursesProgress = async (courseIds: string[]) => {
  const { data } = await apiClient.get<ApiResponse<CourseProgressSummary[]>>('/api/progress/my-courses', {
    params: { courseIds: courseIds.join(',') },
  });
  return data;
};
