// ========================
// Course API Service: Tập trung toàn bộ API calls liên quan Khóa học
// Tất cả đều gọi qua Kong API Gateway → /api/courses
// ========================
import apiClient from './apiClient';

// ===== Types =====
export interface ICourseCategory {
  _id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface ICourseCategoryNode extends ICourseCategory {
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  children: ICourseCategoryNode[];
}

export interface ICourse {
  _id: string;
  title: string;
  slug: string;
  description?: string;           // Mô tả chi tiết (rich text HTML)
  shortDescription?: string;      // Mô tả ngắn hiển thị dưới tên khóa học
  thumbnail?: string;             // URL hình ảnh quảng cáo
  whatYouWillLearn?: string[];    // Học viên sẽ học được gì (danh sách)
  requirements?: string[];        // Điều kiện tiên quyết (danh sách)
  instructorId: string;
  instructorName: string;
  categoryId?: string | null;
  category?: ICourseCategory | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  price: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
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

export type VideoProcessingStatus = 'NONE' | 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface ILesson {
  _id?: string;
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ';
  content?: string;       // URL document hoặc nội dung quiz
  duration?: number;      // Thời lượng (giây)
  order: number;
  isFreePreview?: boolean;
  // ─── Video fields (chỉ khi type === 'VIDEO') ───
  videoId?: string;               // ID từ Media Service sau khi upload xong
  processingStatus?: VideoProcessingStatus; // Trạng thái xử lý HLS
  processingProgress?: number;    // Tiến độ mã hóa 0-100
  playbackUrl?: string;           // m3u8 URL khi DONE
  videoFileName?: string;         // Tên file gốc để hiển thị
  videoDurationSec?: number;      // Thời lượng video (giây)
}

export interface IEnrollment {
  _id: string;
  userId: string;
  courseId: string | (Pick<ICourse, '_id' | 'title' | 'slug' | 'thumbnail' | 'instructorName' | 'level' | 'totalDuration' | 'totalLessons' | 'enrollmentCount'> & {
    categoryId?: string | ICourseCategory | null;
  });
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  enrolledAt: string;
  createdAt?: string;
  updatedAt?: string;
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
  categoryId?: string;
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

/**
 * Lấy cây danh mục public để hiển thị cho instructor/student.
 * GET /api/categories
 */
export const getCourseCategories = async () => {
  const { data } = await apiClient.get<ApiResponse<ICourseCategoryNode[]>>('/api/categories');
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
