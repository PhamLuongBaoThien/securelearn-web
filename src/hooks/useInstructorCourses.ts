// ========================
// File này chứa React Query hooks cấp course cho instructor.
// Lưu ý:
// - file này bọc toàn bộ course-level và curriculum-level operations cho instructor
// - bao gồm cả opt-in / rút khóa học khỏi gói thuê bao để page chỉ còn phần hiển thị
// - validate publish vẫn là mutation riêng trước khi publish thật
// ========================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createCourseLesson,
  createCourseSection,
  getMyCourses,
  createCourse,
  createLessonQuiz,
  deleteCourseLesson,
  deleteCourseSection,
  getLessonQuiz,
  getCourseForManage,
  getPublishedCourseForManage,
  reorderCourseLessons,
  reorderCourseSections,
  updateCourse,
  updateCourseLesson,
  updateCourseSection,
  updateLessonQuiz,
  submitCourseForReview,
  deleteCourse,
  validatePublishCourse,
  createOrGetCourseRevision,
  optInCourseSubscription,
  withdrawCourseSubscription,
  type ICourse,
  type ILesson,
  type IQuiz,
  type ISection,
} from '@/services/courseApi';

// ===== Query Keys =====
export const instructorKeys = {
  myCourses: ['instructor', 'my-courses'] as const,
  courseDetail: (id: string) => ['instructor', 'course', id] as const,
  publishedCourseDetail: (id: string) => ['instructor', 'course', id, 'published'] as const,
  lessonQuiz: (courseId: string, lessonId: string) => ['instructor', 'course', courseId, 'lesson', lessonId, 'quiz'] as const,
};

const invalidateInstructorCaches = async (queryClient: ReturnType<typeof useQueryClient>, courseId: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses }),
    queryClient.invalidateQueries({ queryKey: instructorKeys.courseDetail(courseId) }),
  ]);
};

// ===== useGetMyCourses: Lấy danh sách khóa học của giảng viên =====
export function useGetMyCourses() {
  return useQuery({
    queryKey: instructorKeys.myCourses,
    queryFn: async () => {
      const response = await getMyCourses();
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICourse[];
    },
    staleTime: 2 * 60 * 1000, // cách 2 phút sẽ refetch lại dữ liệu
  });
}

// ===== useGetCourseForManage: Lấy chi tiết khóa học để chỉnh sửa =====
export function useGetCourseForManage(courseId: string) {
  return useQuery({
    queryKey: instructorKeys.courseDetail(courseId),
    queryFn: async () => {
      const response = await getCourseForManage(courseId);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICourse;
    },
    enabled: !!courseId, // Chỉ fetch khi có courseId
    // Luôn fetch lại khi mount để tránh hiển thị trạng thái video cũ (ví dụ: PROCESSING)
    // khi thực tế backend đã xử lý xong (READY). Nếu không, user sẽ thấy cảnh báo
    // "video đang xử lý" giả khi quay lại trang chỉnh sửa.
    staleTime: 0,
  });
}

export function useGetPublishedCourseForManage(courseId: string, enabled = false) {
  return useQuery({
    queryKey: instructorKeys.publishedCourseDetail(courseId),
    queryFn: async () => {
      const response = await getPublishedCourseForManage(courseId);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICourse;
    },
    enabled: !!courseId && enabled,
    staleTime: 0,
  });
}

// ===== useCreateCourse =====
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      categoryId?: string;
      level?: string;
      price?: number;
    }) => {
      const response = await createCourse(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICourse;
    },
    onSuccess: () => {
      // Invalidate danh sách để tự động refetch
      queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses });
    },
  });
}

// ===== useUpdateCourse =====
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, payload }: { courseId: string; payload: FormData }) => {
      const response = await updateCourse(courseId, payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICourse;
    },
    onSuccess: (updatedCourse) => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses });
      queryClient.setQueryData(instructorKeys.courseDetail(updatedCourse._id), updatedCourse);
    },
  });
}

export function useSubmitCourseForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await submitCourseForReview(courseId);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICourse;
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses });
      queryClient.setQueryData(instructorKeys.courseDetail(course._id), course);
    },
  });
}

export function useCreateOrGetCourseRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await createOrGetCourseRevision(courseId);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICourse;
    },
    onSuccess: (revision) => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses });
      queryClient.setQueryData(instructorKeys.courseDetail(revision._id), revision);
    },
  });
}

export function useOptInCourseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: optInCourseSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses });
      toast.success('Đã gửi khóa học vào gói học theo thuê bao để quản trị viên duyệt.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể gửi duyệt thuê bao.'),
  });
}

export function useWithdrawCourseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const reason = window.prompt('Lý do rút khóa học khỏi gói học theo thuê bao (không bắt buộc):') || '';
      return withdrawCourseSubscription(courseId, reason);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses });
      toast.success('Khóa học đã được rút khỏi gói học theo thuê bao.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể rút khóa học khỏi gói học theo thuê bao.'),
  });
}

export function useValidatePublishCourse() {
  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await validatePublishCourse(courseId);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });
}

// ===== useDeleteCourse =====
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await deleteCourse(courseId);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses });
    },
  });
}

export function useCreateCourseSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, payload }: { courseId: string; payload: { title: string; order?: number } }) => {
      const response = await createCourseSection(courseId, payload);
      if (response.status === 'ERR') throw new Error(response.message);
      return response.data as ISection;
    },
    onSuccess: async (_section, variables) => {
      await invalidateInstructorCaches(queryClient, variables.courseId);
    },
  });
}

export function useUpdateCourseSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, sectionId, payload }: { courseId: string; sectionId: string; payload: { title?: string } }) => {
      const response = await updateCourseSection(courseId, sectionId, payload);
      if (response.status === 'ERR') throw new Error(response.message);
      return response.data as ISection;
    },
    onSuccess: async (_section, variables) => {
      await invalidateInstructorCaches(queryClient, variables.courseId);
    },
  });
}

export function useDeleteCourseSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, sectionId }: { courseId: string; sectionId: string }) => {
      const response = await deleteCourseSection(courseId, sectionId);
      if (response.status === 'ERR') throw new Error(response.message);
      return response;
    },
    onSuccess: async (_response, variables) => {
      await invalidateInstructorCaches(queryClient, variables.courseId);
    },
  });
}

export function useReorderCourseSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, items }: { courseId: string; items: Array<{ sectionId: string; order: number }> }) => {
      const response = await reorderCourseSections(courseId, items);
      if (response.status === 'ERR') throw new Error(response.message);
      return response;
    },
    onSuccess: async (_response, variables) => {
      await invalidateInstructorCaches(queryClient, variables.courseId);
    },
  });
}

export function useCreateCourseLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      sectionId,
      payload,
    }: {
      courseId: string;
      sectionId: string;
      payload: {
        title: string;
        type?: ILesson['type'];
        content?: string;
        order?: number;
        duration?: number;
        isFreePreview?: boolean;
      };
    }) => {
      const response = await createCourseLesson(courseId, sectionId, payload);
      if (response.status === 'ERR') throw new Error(response.message);
      return response.data as ILesson;
    },
    onSuccess: async (_lesson, variables) => {
      await invalidateInstructorCaches(queryClient, variables.courseId);
    },
  });
}

export function useUpdateCourseLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      lessonId,
      payload,
    }: {
      courseId: string;
      lessonId: string;
      payload: Partial<Pick<ILesson, 'title' | 'type' | 'content' | 'duration' | 'isFreePreview' | 'status'>>;
    }) => {
      const response = await updateCourseLesson(courseId, lessonId, payload);
      if (response.status === 'ERR') throw new Error(response.message);
      return response.data as ILesson;
    },
    onSuccess: async (_lesson, variables) => {
      await invalidateInstructorCaches(queryClient, variables.courseId);
    },
  });
}

export function useDeleteCourseLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, lessonId }: { courseId: string; lessonId: string }) => {
      const response = await deleteCourseLesson(courseId, lessonId);
      if (response.status === 'ERR') throw new Error(response.message);
      return response;
    },
    onSuccess: async (_response, variables) => {
      await invalidateInstructorCaches(queryClient, variables.courseId);
    },
  });
}

export function useReorderCourseLessons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      sectionId,
      items,
    }: {
      courseId: string;
      sectionId: string;
      items: Array<{ lessonId: string; order: number }>;
    }) => {
      const response = await reorderCourseLessons(courseId, sectionId, items);
      if (response.status === 'ERR') throw new Error(response.message);
      return response;
    },
    onSuccess: async (_response, variables) => {
      await invalidateInstructorCaches(queryClient, variables.courseId);
    },
  });
}

export function useGetLessonQuiz(courseId: string, lessonId?: string) {
  return useQuery({
    queryKey: instructorKeys.lessonQuiz(courseId, lessonId || 'unknown'),
    queryFn: async () => {
      const response = await getLessonQuiz(courseId, lessonId!);
      if (response.status === 'ERR') throw new Error(response.message);
      return response.data as IQuiz | null;
    },
    enabled: !!courseId && !!lessonId,
  });
}

export function useSaveLessonQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      lessonId,
      quizId,
      payload,
    }: {
      courseId: string;
      lessonId: string;
      quizId?: string | null;
      payload: Omit<IQuiz, '_id'>;
    }) => {
      const response = quizId
        ? await updateLessonQuiz(courseId, lessonId, payload)
        : await createLessonQuiz(courseId, lessonId, payload);
      if (response.status === 'ERR' || !response.data) throw new Error(response.message);
      return response.data as IQuiz;
    },
    onSuccess: async (quiz, variables) => {
      await invalidateInstructorCaches(queryClient, variables.courseId);
      queryClient.setQueryData(instructorKeys.lessonQuiz(variables.courseId, variables.lessonId), quiz);
    },
  });
}
