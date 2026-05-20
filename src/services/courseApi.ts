// ========================
// File này chứa:
// - type dùng cho course editor
// - API gọi course-service cho instructor/student/public
// - API CRUD section/lesson/quiz và bind asset cho lesson
// Lưu ý:
// - frontend editor hiện đang phụ thuộc trực tiếp vào type trong file này
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

export type LessonStatus = 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED';
export type VideoProcessingStatus = 'NONE' | 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface ILesson {
  _id?: string;
  title: string;
  type: 'VIDEO' | 'QUIZ';         // Chỉ 2 type: VIDEO và QUIZ
  status?: LessonStatus;
  content?: string;               // Mô tả chi tiết bài học (rich text HTML)
  duration?: number;              // Thời lượng (giây)
  order: number;
  isFreePreview?: boolean;
  videoAssetId?: string | null;
  attachments?: string[];         // Tài liệu đính kèm — áp dụng cho cả VIDEO lẫn QUIZ
  quizId?: string | null;
  videoFileName?: string;         // Tên file gốc để hiển thị (virtual, poll từ media-service)
  videoDurationSec?: number;      // Thời lượng video (giây) (virtual, poll từ media-service)
  processingProgress?: number;    // Tiến độ xử lý (virtual, poll từ media-service)
  processingStatus?: VideoProcessingStatus; // Trạng thái xử lý (virtual, map từ media-service)
  contentMeta?: {
    questionCount?: number;
  } | null;
}

export interface IQuizQuestionOption {
  text: string;
}

export interface IQuizQuestion {
  questionId?: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  prompt: string;
  options: IQuizQuestionOption[];
  correctOptionIndexes: number[];
  explanation?: string;
  points?: number;
}

export interface IQuiz {
  _id: string;
  title: string;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  timeLimitSec?: number | null;
  questions: IQuizQuestion[];
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

interface ApiResponse<T = undefined> {
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
export const updateCourse = async (courseId: string, formData: FormData) => {
  const response = await apiClient.put<ApiResponse<ICourse>>(`/api/courses/${courseId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Publish khóa học (chuyển từ DRAFT → PUBLISHED).
 * PATCH /api/courses/:id/publish
 */
export const publishCourse = async (courseId: string) => {
  const { data } = await apiClient.patch<ApiResponse<ICourse>>(`/api/courses/${courseId}/publish`);
  return data;
};

export const validatePublishCourse = async (courseId: string) => {
  const { data } = await apiClient.post<ApiResponse<{ ok: boolean; errors: Array<{ field: string; message: string; sectionId?: string; lessonId?: string }> }>>(
    `/api/courses/${courseId}/publish/validate`
  );
  return data;
};

// Section CRUD cho editor theo hướng item-level.
export const createCourseSection = async (courseId: string, payload: { title: string; order?: number }) => {
  const { data } = await apiClient.post<ApiResponse<ISection>>(`/api/courses/${courseId}`, payload);
  return data;
};

export const updateCourseSection = async (courseId: string, sectionId: string, payload: { title?: string }) => {
  const { data } = await apiClient.put<ApiResponse<ISection>>(`/api/courses/${courseId}/${sectionId}`, payload);
  return data;
};

export const reorderCourseSections = async (courseId: string, items: Array<{ sectionId: string; order: number }>) => {
  const { data } = await apiClient.put<ApiResponse>(`/api/courses/${courseId}/reorder`, { items });
  return data;
};

export const deleteCourseSection = async (courseId: string, sectionId: string) => {
  const { data } = await apiClient.delete<ApiResponse>(`/api/courses/${courseId}/${sectionId}`);
  return data;
};

// Lesson CRUD cho editor theo hướng item-level.
export const createCourseLesson = async (
  courseId: string,
  sectionId: string,
  payload: {
    title: string;
    type?: ILesson['type'];
    content?: string;
    order?: number;
    duration?: number;
    isFreePreview?: boolean;
  }
) => {
  const { data } = await apiClient.post<ApiResponse<ILesson>>(`/api/courses/${courseId}/sections/${sectionId}/lessons`, payload);
  return data;
};

export const updateCourseLesson = async (
  courseId: string,
  lessonId: string,
  payload: Partial<Pick<ILesson, 'title' | 'type' | 'content' | 'duration' | 'isFreePreview' | 'status'>>
) => {
  const { data } = await apiClient.put<ApiResponse<ILesson>>(`/api/courses/${courseId}/lessons/${lessonId}`, payload);
  return data;
};

export const reorderCourseLessons = async (courseId: string, sectionId: string, items: Array<{ lessonId: string; order: number }>) => {
  const { data } = await apiClient.put<ApiResponse>(`/api/courses/${courseId}/sections/${sectionId}/lessons/reorder`, { items });
  return data;
};

export const deleteCourseLesson = async (courseId: string, lessonId: string) => {
  const { data } = await apiClient.delete<ApiResponse>(`/api/courses/${courseId}/lessons/${lessonId}`);
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

// Quiz hiện là domain riêng gắn với lesson type QUIZ.
export const createLessonQuiz = async (courseId: string, lessonId: string, payload: Omit<IQuiz, '_id'>) => {
  const { data } = await apiClient.post<ApiResponse<IQuiz>>(`/api/courses/${courseId}/lessons/${lessonId}/quiz`, payload);
  return data;
};

export const updateLessonQuiz = async (courseId: string, lessonId: string, payload: Partial<Omit<IQuiz, '_id'>>) => {
  const { data } = await apiClient.put<ApiResponse<IQuiz>>(`/api/courses/${courseId}/lessons/${lessonId}/quiz`, payload);
  return data;
};

export const getLessonQuiz = async (courseId: string, lessonId: string) => {
  const { data } = await apiClient.get<ApiResponse<IQuiz | null>>(`/api/courses/${courseId}/lessons/${lessonId}/quiz`);
  return data;
};

// Bind asset là bước nối giữa media-service và lesson của course-service.
export const bindVideoAssetToLesson = async (courseId: string, lessonId: string, videoAssetId: string) => {
  const { data } = await apiClient.post<ApiResponse<ILesson>>(`/api/courses/${courseId}/lessons/${lessonId}/video-asset`, { videoAssetId });
  return data;
};

export const removeVideoAssetFromLesson = async (courseId: string, lessonId: string) => {
  const { data } = await apiClient.delete<ApiResponse<ILesson>>(`/api/courses/${courseId}/lessons/${lessonId}/video-asset`);
  return data;
};

// Attachment API — tài liệu đính kèm cho cả VIDEO lẫn QUIZ
export const addAttachmentToLesson = async (courseId: string, lessonId: string, documentAssetId: string) => {
  const { data } = await apiClient.post<ApiResponse<ILesson>>(
    `/api/courses/${courseId}/lessons/${lessonId}/attachments`,
    { documentAssetId }
  );
  return data;
};

export const removeAttachmentFromLesson = async (courseId: string, lessonId: string, documentAssetId: string) => {
  const { data } = await apiClient.delete<ApiResponse<ILesson>>(
    `/api/courses/${courseId}/lessons/${lessonId}/attachments/${documentAssetId}`
  );
  return data;
};
