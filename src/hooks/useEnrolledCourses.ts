// ========================
// Hook: useEnrolledCourses
// Lấy danh sách khóa học đã ghi danh của student.
// Transform IEnrollment[] → EnrolledCourseItem[] để Dashboard dễ dùng.
// ========================
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { getEnrolledCourses, type IEnrollment, type ICourse, type ICourseCategory } from '@/services/courseApi';
import { getMyCoursesProgress, type CourseProgressSummary } from '@/services/progressApi';

// Shape đã được transform — Dashboard chỉ cần dùng interface này
export interface EnrolledCourseItem {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  instructorName: string;
  thumbnail: string;
  level: ICourse['level'];
  totalLessons: number;
  totalDuration: number; // giây
  enrolledAt: string;
  progressPercent: number;
  completedLessons: number;
  progressTotalLessons: number;
  lastLessonId: string;
  lastPositionSeconds: number;
  progressCompletedAt?: string | null;
  progressUpdatedAt?: string;
}

export const enrolledKeys = {
  all: ['courses', 'enrolled'] as const,
  byUser: (userId: string) => ['courses', 'enrolled', userId] as const,
};

// Helper: Kiểm tra courseId đã được populate chưa
function isPopulatedCourse(
  courseId: IEnrollment['courseId']
): courseId is Pick<ICourse, '_id' | 'title' | 'slug' | 'thumbnail' | 'instructorName' | 'level' | 'totalDuration' | 'totalLessons' | 'enrollmentCount'> & { categoryId?: string | ICourseCategory | null } {
  return typeof courseId === 'object' && courseId !== null && 'title' in courseId;
}

export function useEnrolledCourses() {
  // Lấy userId từ Redux để làm query key — không fetch khi chưa đăng nhập
  const { user, isAuthenticated, authResolved } = useAppSelector((state) => state.auth);
  const userId = user?._id ?? '';

  return useQuery<EnrolledCourseItem[]>({
    queryKey: enrolledKeys.byUser(userId),
    queryFn: async () => {
      const response = await getEnrolledCourses();
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tải danh sách khóa học đã ghi danh.');
      }

      const enrollments = (response.data || []) as IEnrollment[];
      const courses = enrollments
        .filter((e) => isPopulatedCourse(e.courseId))
        .map((e) => {
          const course = e.courseId as Parameters<typeof isPopulatedCourse>[0] & { title: string };
          if (!isPopulatedCourse(course)) return null;
          return {
            enrollmentId: e._id,
            courseId: course._id,
            slug: course.slug,
            title: course.title,
            instructorName: course.instructorName,
            thumbnail: course.thumbnail ?? '',
            level: course.level,
            totalLessons: course.totalLessons,
            totalDuration: course.totalDuration,
            enrolledAt: e.enrolledAt,
            progressPercent: 0,
            completedLessons: 0,
            progressTotalLessons: course.totalLessons,
            lastLessonId: '',
            lastPositionSeconds: 0,
          } as EnrolledCourseItem;
        })
        .filter((item): item is EnrolledCourseItem => item !== null);

      if (courses.length === 0) return courses;

      try {
        const progressResponse = await getMyCoursesProgress(courses.map((course) => course.courseId));
        const progressByCourseId = new Map<string, CourseProgressSummary>(
          (progressResponse.data || []).map((progress) => [progress.courseId, progress])
        );

        return courses.map((course) => {
          const progress = progressByCourseId.get(course.courseId);
          if (!progress) return course;
          return {
            ...course,
            progressPercent: progress.progressPercent,
            completedLessons: progress.completedLessons,
            progressTotalLessons: progress.totalLessons || course.totalLessons,
            lastLessonId: progress.lastLessonId || '',
            lastPositionSeconds: progress.lastPositionSeconds || 0,
            progressCompletedAt: progress.completedAt,
            progressUpdatedAt: progress.updatedAt,
          };
        });
      } catch {
        return courses;
      }
    },
    enabled: authResolved && isAuthenticated && Boolean(userId),
    staleTime: 30 * 1000,
  });
}
