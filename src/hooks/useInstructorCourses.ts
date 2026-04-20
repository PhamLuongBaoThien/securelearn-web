// ========================
// React Query Hooks: Instructor Course Management
// Quản lý khóa học dành cho Giảng viên — CRUD + Publish.
// ========================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyCourses,
  createCourse,
  getCourseForManage,
  updateCourse,
  publishCourse,
  deleteCourse,
  type ICourse,
} from '@/services/courseApi';

// ===== Query Keys =====
export const instructorKeys = {
  myCourses: ['instructor', 'my-courses'] as const,
  courseDetail: (id: string) => ['instructor', 'course', id] as const,
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
    staleTime: 2 * 60 * 1000, // 2 phút
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
  });
}

// ===== useCreateCourse =====
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      category?: string;
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
    mutationFn: async ({ courseId, payload }: { courseId: string; payload: Partial<ICourse> }) => {
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

// ===== usePublishCourse =====
export function usePublishCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await publishCourse(courseId);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICourse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.myCourses });
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
