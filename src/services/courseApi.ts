// ========================
// Course API Service: Tập trung toàn bộ API calls liên quan Khóa học
// Tất cả đều gọi qua Kong API Gateway → /api/courses
// ========================
import apiClient from './apiClient';

// ===== Types =====
export interface ICourse {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  instructorId: string;
  instructorName: string;
  category?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  price: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  totalStudents: number;
  totalDuration: number;    // Tổng thời lượng (giây)
  totalLessons: number;     // Tổng số bài học
  enrollmentCount: number;  // Số lượt ghi danh
  sections: ISection[];
  createdAt: string;
  updatedAt: string;
}

export interface ISection {
  _id?: string;
  title: string;
  order: number;
  lessons: ILesson[];
}

export interface ILesson {
  _id?: string;
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ';
  content?: string;
  duration?: number;
  order: number;
  isFreePreview?: boolean;
}

export interface IEnrollment {
  _id: string;
  userId: string;
  courseId: ICourse;
  progress: number;
  enrolledAt: string;
}

interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
}

interface PaginatedData {
  courses: ICourse[];
  total: number;
  page: number;
  totalPages: number;
}

// =============================================
// INSTRUCTOR APIs (Cần đăng nhập + role INSTRUCTOR)
// =============================================

/**
 * Tạo khóa học mới.
 * POST /api/courses
 */
export const createCourse = async (payload: {
  title: string;
  description?: string;
  category?: string;
  level?: string;
  price?: number;
}) => {
  const { data } = await apiClient.post<ApiResponse<ICourse>>('/api/courses', payload);
  return data;
};

/**
 * Danh sách khóa học của giảng viên.
 * GET /api/courses/my-courses
 */
export const getMyCourses = async () => {
  const { data } = await apiClient.get<ApiResponse<ICourse[]>>('/api/courses/my-courses');
  return data;
};

/**
 * Chi tiết khóa học để quản lý (bao gồm sections/lessons).
 * GET /api/courses/:id/manage
 */
export const getCourseForManage = async (courseId: string) => {
  const { data } = await apiClient.get<ApiResponse<ICourse>>(`/api/courses/${courseId}/manage`);
  return data;
};

/**
 * Cập nhật khóa học (bao gồm sections/lessons).
 * PUT /api/courses/:id
 */
export const updateCourse = async (courseId: string, payload: Partial<ICourse>) => {
  const { data } = await apiClient.put<ApiResponse<ICourse>>(`/api/courses/${courseId}`, payload);
  return data;
};

/**
 * Publish khóa học (chuyển từ DRAFT → PUBLISHED).
 * PATCH /api/courses/:id/publish
 */
export const publishCourse = async (courseId: string) => {
  const { data } = await apiClient.patch<ApiResponse<ICourse>>(`/api/courses/${courseId}/publish`);
  return data;
};

/**
 * Xóa khóa học.
 * DELETE /api/courses/:id
 */
export const deleteCourse = async (courseId: string) => {
  const { data } = await apiClient.delete<ApiResponse>(`/api/courses/${courseId}`);
  return data;
};

// =============================================
// STUDENT APIs (Cần đăng nhập + role STUDENT)
// =============================================

/**
 * Ghi danh vào khóa học.
 * POST /api/courses/:id/enroll
 */
export const enrollCourse = async (courseId: string) => {
  const { data } = await apiClient.post<ApiResponse<IEnrollment>>(`/api/courses/${courseId}/enroll`);
  return data;
};

/**
 * Danh sách khóa học đã ghi danh.
 * GET /api/courses/enrolled
 */
export const getEnrolledCourses = async () => {
  const { data } = await apiClient.get<ApiResponse<IEnrollment[]>>('/api/courses/enrolled');
  return data;
};

// =============================================
// PUBLIC APIs (Không cần đăng nhập)
// =============================================

/**
 * Danh sách khóa học đã publish (có search, filter, phân trang).
 * GET /api/courses
 */
export const getPublishedCourses = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: string;
}) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedData>>('/api/courses', { params });
  return data;
};

/**
 * Chi tiết khóa học theo slug (public).
 * GET /api/courses/:slug
 */
export const getCourseBySlug = async (slug: string) => {
  const { data } = await apiClient.get<ApiResponse<ICourse>>(`/api/courses/${slug}`);
  return data;
};
