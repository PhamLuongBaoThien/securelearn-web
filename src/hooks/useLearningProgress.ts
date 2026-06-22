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

/**
 * [BƯỚC 3: TIẾN ĐỘ & HEARTBEAT - FRONTEND HOOKS]
 * File này quản lý trạng thái đồng bộ tiến độ học tập và quyền truy cập bài học (mở/khóa) của học viên ở Frontend.
 * Sử dụng React Query để tự động cache, cập nhật và tối ưu các lượt gọi API lên Backend (progress-service).
 */

/**
 * Hàm: unlockAccessFromProgress
 * Vai trò: Tự động tính toán và mở khóa bài học tiếp theo trên giao diện Frontend ngay sau khi nhận được dữ liệu tiến độ mới.
 * Cách thức hoạt động:
 *  - Lấy danh sách các bài học đã hoàn thành (COMPLETED) từ tiến độ mới.
 *  - Duyệt qua bản đồ quyền truy cập hiện tại (access map). Với mỗi bài đang bị khóa (locked), kiểm tra xem toàn bộ các bài học
 *    bắt buộc trước đó (requiredLessonIds) đã nằm trong danh sách hoàn thành hay chưa.
 *  - Nếu đủ điều kiện, cập nhật trạng thái bài học thành locked = false để học viên có thể click học ngay.
 * Khi nào sử dụng: Gọi trong hàm onSuccess của các mutation gửi heartbeat hoặc nộp bài quiz để cập nhật UI tức thời mà không cần reload trang.
 */
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

/**
 * Hàm: preserveUnlockedAccess
 * Vai trò: Đảm bảo tính nhất quán của trạng thái mở khóa trên UI, tránh hiện tượng bài đã mở khóa lại bị khóa lại do độ trễ đồng bộ từ server.
 * Cách thức hoạt động: So sánh trạng thái cũ (previous) và mới (next). Nếu bài học ở trạng thái cũ đã mở khóa nhưng ở dữ liệu mới
 *  vừa tải về từ server lại báo khóa (do cache server chưa kịp cập nhật hoặc bất đồng bộ), hàm sẽ giữ nguyên trạng thái mở khóa (locked = false).
 * Khi nào sử dụng: Gọi trong hàm queryFn của useCourseAccess trước khi trả về dữ liệu cuối cùng cho component.
 */
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


// Định nghĩa các Query Key cho React Query để quản lý và invalidate cache chính xác
export const learningProgressKeys = {
  course: (courseId: string) => ['learning-progress', 'course', courseId] as const,
  access: (courseId: string) => ['learning-progress', 'access', courseId] as const,
  activity: (from?: string, to?: string) => ['learning-progress', 'activity', from || '', to || ''] as const,
  analytics: (courseId: string) => ['learning-progress', 'analytics', courseId] as const,
};
const learningProgressActivityKey = ['learning-progress', 'activity'] as const;

/**
 * Hook: useCourseProgress
 * Vai trò: Lấy chi tiết tiến độ học tập hiện tại của học viên đối với một khóa học cụ thể.
 * Cách thức hoạt động: Gửi request GET lên endpoint tiến độ của progress-service và cache kết quả trong 15 giây.
 * Khi nào sử dụng: Sử dụng trong LearningInterface và các component con để hiển thị phần trăm hoàn thành, danh sách bài học đã hoàn thành.
 */
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

/**
 * Hook: useCourseAccess
 * Vai trò: Lấy trạng thái mở khóa hoặc khóa của từng bài học trong khóa học theo chế độ học (Sequential Mode / Free Mode).
 * Cách thức hoạt động: Gửi request lên server để lấy thông tin access control, đồng thời gọi preserveUnlockedAccess để giữ lại trạng thái mở khóa an toàn.
 * Khi nào sử dụng: Dùng trong CurriculumSidebar để render các icon khóa/mở khóa bài học và vô hiệu hóa sự kiện click vào bài chưa được mở.
 */
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

/**
 * Hook: useLearnerActivity
 * Vai trò: Lấy nhật ký hoạt động học tập của học viên (Streak, số giây học trong ngày, mục tiêu ngày).
 * Cách thức hoạt động: Gọi API lấy activity log trong khoảng thời gian từ `from` đến `to` để vẽ biểu đồ hoạt động.
 * Khi nào sử dụng: Dùng tại trang Dashboard học viên hoặc màn hình thông tin cá nhân để khuyến khích học viên duy trì Streak.
 */
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

/**
 * Hook: useInstructorCourseAnalytics
 * Vai trò: Giúp giảng viên theo dõi số liệu phân tích về tiến độ học của cả lớp trong khóa học của mình.
 * Cách thức hoạt động: Gửi yêu cầu phân tích dữ liệu khóa học (chỉ cho phép userRole = INSTRUCTOR và là chủ khóa học).
 * Khi nào sử dụng: Sử dụng trong trang quản trị/phân tích của Giảng viên (Instructor Performance Panel).
 */
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

/**
 * Hook: useProgressHeartbeat
 * Vai trò: Thực hiện gửi heartbeat tiến độ định kỳ (mỗi 10s - 15s) từ video player hoặc quiz player lên Backend.
 * Cách thức hoạt động:
 *  - Gửi các thông số như: segmentStartSeconds, positionSeconds, watchedSecondsDelta (khoảng thời gian thực học kể từ heartbeat trước).
 *  - Khi Backend trả về tiến độ mới:
 *     + Lưu đè dữ liệu tiến độ vào cache React Query.
 *     + Gọi unlockAccessFromProgress để tính toán mở khóa bài học tiếp theo trên UI ngay lập tức.
 *     + Invalidate cache access map và hoạt động học tập để các API tự động fetch lại thông tin mới nhất.
 * Khi nào sử dụng: Gọi định kỳ bên trong useEffect của component phát VideoPlayer hoặc các phiên học quiz để gửi tiến trình học của user.
 */
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

/**
 * Hook: useCompleteQuizProgress
 * Vai trò: Đồng bộ trạng thái hoàn thành bài học Quiz khi học viên vượt qua điểm sàn.
 * Cách thức hoạt động:
 *  - Gửi payload nộp điểm trắc nghiệm (đã xác thực ở course-service) sang progress-service.
 *  - Tương tự heartbeat, khi thành công sẽ cập nhật lại tiến độ khóa học, tự động mở khóa các bài học bị ràng buộc tuần tự.
 * Khi nào sử dụng: Gọi trong QuizPlayer khi nhận được phản hồi chấm điểm thành công (Passed) từ course-service.
 */
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
