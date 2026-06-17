// File: CourseDetail.tsx
// Component chính của trang xem chi tiết khóa học (route: /course/:slug).
// Luồng hoạt động:
//   1. Lấy slug từ URL params
//   2. Fetch dữ liệu khóa học bằng useCourseDetail(slug)
//   3. Kiểm tra user đã ghi danh chưa bằng useEnrolledCourses
//   4. Render skeleton khi đang tải, error state khi gặp lỗi
//   5. Render layout 2 cột: cột trái là nội dung, cột phải là sidebar mua hàng

import { useParams } from 'react-router-dom';
import { FadeIn } from '@/components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { useCourseDetail } from '@/hooks/useCourseDetail';
import { useEnrolledCourses } from '@/hooks/useEnrolledCourses';
import { useAppSelector } from '@/app/hooks';
import { AlertCircle, BookOpen } from 'lucide-react';

import { CourseHeroBanner } from './CourseHeroBanner';
import { CoursePurchaseCard } from './CoursePurchaseCard';
import { CourseCurriculum } from './CourseCurriculum';
import { CourseWhatYouLearn } from './CourseWhatYouLearn';
import { CourseRequirements } from './CourseRequirements';
import { CourseInstructor } from './CourseInstructor';
import { CourseIncludes } from './CourseIncludes';
import { CourseReviews } from './CourseReviews';

// Skeleton cho phần hero banner — hiển thị trong lúc API đang tải
function HeroBannerSkeleton() {
  return (
    <div className="bg-zinc-900 pt-[120px] pb-8 lg:pt-[136px] lg:pb-12 px-6">
      <div className="max-w-[1340px] mx-auto lg:w-2/3 space-y-4 animate-pulse">
        <div className="h-4 w-48 bg-zinc-700 rounded" />
        <div className="h-10 w-3/4 bg-zinc-700 rounded" />
        <div className="h-6 w-full bg-zinc-700 rounded" />
        <div className="h-6 w-2/3 bg-zinc-700 rounded" />
        <div className="flex gap-3">
          <div className="h-5 w-24 bg-zinc-700 rounded" />
          <div className="h-5 w-32 bg-zinc-700 rounded" />
        </div>
      </div>
    </div>
  );
}

// Skeleton cho phần nội dung bên dưới — hiển thị trong lúc API đang tải
function ContentSkeleton() {
  return (
    <div className="max-w-[1340px] mx-auto px-6 flex flex-col-reverse lg:flex-row gap-12 pt-8 lg:pt-0 animate-pulse">
      {/* Cột trái: các khối nội dung */}
      <div className="w-full lg:w-2/3 space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-7 w-48 bg-secondary rounded" />
            <div className="h-4 w-full bg-secondary rounded" />
            <div className="h-4 w-5/6 bg-secondary rounded" />
            <div className="h-4 w-4/6 bg-secondary rounded" />
          </div>
        ))}
      </div>
      {/* Cột phải: sidebar mua hàng */}
      <div className="w-full lg:w-1/3">
        <div className="border border-border bg-card">
          <div className="aspect-video bg-secondary" />
          <div className="p-6 space-y-4">
            <div className="h-9 w-1/2 bg-secondary rounded" />
            <div className="h-12 bg-secondary rounded" />
            <div className="h-12 bg-secondary rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CourseDetail() {
  // Lấy slug từ URL (ví dụ: /course/react-co-ban → slug = "react-co-ban")
  const { slug } = useParams<{ slug: string }>();

  // Fetch dữ liệu khóa học theo slug
  const { data: course, isLoading, isError, error } = useCourseDetail(slug);

  // Kiểm tra người dùng đã đăng nhập chưa (dùng để quyết định gọi useEnrolledCourses)
  const isAuthenticated = Boolean(useAppSelector((state) => state.auth.user));

  // Danh sách khóa học đã ghi danh của user — chỉ fetch khi đã đăng nhập
  const { data: enrolledCourses = [] } = useEnrolledCourses();

  // Kiểm tra khóa học hiện tại có nằm trong danh sách đã ghi danh không
  const isEnrolled = isAuthenticated && Boolean(
    course && enrolledCourses.some((e) => e.courseId === course._id)
  );

  // Trạng thái đang tải: hiển thị skeleton
  if (isLoading) {
    return (
      <div className="bg-background min-h-screen pb-20 relative -mt-[88px]">
        <HeroBannerSkeleton />
        <ContentSkeleton />
      </div>
    );
  }

  // Trạng thái lỗi hoặc không tìm thấy khóa học
  if (isError || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        {isError ? (
          // Lỗi API (network, server, ...)
          <>
            <AlertCircle className="w-14 h-14 text-destructive" />
            <h1 className="text-2xl font-bold">Không thể tải khóa học</h1>
            <p className="text-muted-foreground">
              {(error as Error)?.message ?? 'Vui lòng thử lại sau.'}
            </p>
          </>
        ) : (
          // Slug không khớp với bất kỳ khóa học nào
          <>
            <BookOpen className="w-14 h-14 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Không tìm thấy khóa học</h1>
            <p className="text-muted-foreground">
              Khóa học này không tồn tại hoặc đã bị xóa.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20 relative -mt-[88px]">
      {/* Banner tối phía trên — chứa thông tin tổng quan */}
      <FadeIn>
        <CourseHeroBanner course={course} />
      </FadeIn>

      {/* Khu vực nội dung chính: 2 cột (nội dung | sidebar mua hàng) */}
      <div className="max-w-[1340px] mx-auto px-6 relative flex flex-col-reverse lg:flex-row gap-12 lg:pt-0 pt-8 lg:items-stretch items-start">

        {/* Cột trái: nội dung chi tiết — animation xuất hiện lần lượt */}
        <StaggerContainer className="w-full lg:w-2/3 space-y-12 pt-8">

          {/* Phần "Bạn sẽ học được gì" — chỉ hiện khi có dữ liệu */}
          {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
            <StaggerItem>
              <CourseWhatYouLearn items={course.whatYouWillLearn} />
            </StaggerItem>
          )}

          <StaggerItem>
            <CourseIncludes
              totalDuration={course.totalDuration}
              totalLessons={course.totalLessons}
              totalQuizzes={course.totalQuizzes}
              totalDocuments={course.totalDocuments}
            />
          </StaggerItem>

          {/* Nội dung chương trình học — chỉ hiện khi có section */}
          {course.sections && course.sections.length > 0 && (
            <StaggerItem>
              <CourseCurriculum
                sections={course.sections}
                totalDuration={course.totalDuration}
                totalLessons={course.totalLessons}
              />
            </StaggerItem>
          )}

          {/* Yêu cầu và mô tả — chỉ hiện khi có ít nhất một trong hai */}
          {((course.requirements && course.requirements.length > 0) || course.description) && (
            <StaggerItem>
              <CourseRequirements
                requirements={course.requirements ?? []}
                description={course.description}
              />
            </StaggerItem>
          )}

          {/* Thông tin giảng viên — luôn hiện */}
          <StaggerItem>
            <CourseInstructor
              instructorId={course.instructorId}
              instructorName={course.instructorName}
              enrollmentCount={course.enrollmentCount}
              avatarUrl={course.instructorProfile?.avatarUrl}
              bio={course.instructorProfile?.bio}
            />
          </StaggerItem>

          <StaggerItem>
            <CourseReviews course={course} canReview={isEnrolled} />
          </StaggerItem>

        </StaggerContainer>

        {/* Cột phải: sidebar mua hàng (sticky) */}
        <CoursePurchaseCard course={course} isEnrolled={isEnrolled} />

      </div>
    </div>
  );
}
