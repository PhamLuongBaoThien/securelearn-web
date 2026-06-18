import apiClient from './apiClient';

interface ApiResponse<T = undefined> {
  status: string;
  message?: string;
  data?: T;
}

export type LessonProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type LessonProgressType = 'VIDEO' | 'QUIZ';

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

export const getMyCoursesProgress = async (courseIds: string[]) => {
  const { data } = await apiClient.get<ApiResponse<CourseProgressSummary[]>>('/api/progress/my-courses', {
    params: { courseIds: courseIds.join(',') },
  });
  return data;
};
