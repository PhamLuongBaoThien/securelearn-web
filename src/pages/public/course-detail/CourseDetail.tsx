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
import { ReportDialog } from '@/components/inbox/ReportDialog';

// Skeleton cho phần hero banner — khớp layout Split Hero mới
function HeroBannerSkeleton() {
  return (
    <div className="relative pt-[120px] pb-10 lg:pt-[136px] lg:pb-14 px-6 overflow-hidden bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-background">
      <div className="relative z-10 max-w-[1340px] mx-auto flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12 animate-pulse">
        {/* Cột trái: thông tin */}
        <div className="lg:w-7/12 space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-secondary rounded" />
            <div className="h-3 w-3 bg-secondary rounded" />
            <div className="h-4 w-24 bg-secondary rounded" />
            <div className="h-3 w-3 bg-secondary rounded" />
            <div className="h-4 w-32 bg-secondary rounded" />
          </div>
          {/* Tiêu đề */}
          <div className="h-9 md:h-10 w-3/4 bg-secondary rounded" />
          {/* Mô tả */}
          <div className="space-y-2 max-w-2xl">
            <div className="h-5 w-full bg-secondary rounded" />
            <div className="h-5 w-2/3 bg-secondary rounded" />
          </div>
          {/* Badge cấp độ + rating + số học viên */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="h-6 w-16 bg-secondary rounded-sm" />
            <div className="h-5 w-28 bg-secondary rounded" />
            <div className="h-5 w-36 bg-secondary rounded" />
            <div className="h-5 w-28 bg-secondary rounded" />
          </div>
          {/* Giảng viên */}
          <div className="h-5 w-44 bg-secondary rounded" />
          {/* Ngày cập nhật */}
          <div className="flex items-center gap-4">
            <div className="h-5 w-48 bg-secondary rounded" />
            <div className="h-5 w-20 bg-secondary rounded" />
          </div>
        </div>
        {/* Cột phải: thumbnail skeleton với dots 4 góc */}
        <div className="lg:w-5/12 flex-shrink-0">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-[51px] h-[51px] opacity-35 dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', backgroundPosition: 'left 3px top 3px' }} />
            <div className="absolute -top-4 -right-4 w-[51px] h-[51px] opacity-35 dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', backgroundPosition: 'right 3px top 3px' }} />
            <div className="absolute -bottom-4 -left-4 w-[51px] h-[51px] opacity-35 dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', backgroundPosition: 'left 3px bottom 3px' }} />
            <div className="absolute -bottom-4 -right-4 w-[51px] h-[51px] opacity-35 dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', backgroundPosition: 'right 3px bottom 3px' }} />
            <div className="w-full aspect-video bg-secondary rounded-2xl" />
          </div>
        </div>
      </div>
      {/* Đường gạch chia hero và nội dung */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  );
}

// Skeleton cho phần nội dung bên dưới — khớp kích thước và các khối thực tế
function ContentSkeleton() {
  return (
    <div className="max-w-[1340px] mx-auto px-6 relative flex flex-col-reverse lg:flex-row gap-12 pt-8 lg:pt-0 lg:items-stretch items-start animate-pulse">
      {/* Cột trái: các khối nội dung */}
      <div className="w-full lg:w-2/3 space-y-12 pt-8">
        {/* Khối "Bạn sẽ học được gì" */}
        <div className="border border-border p-6 lg:p-8 bg-card shadow-sm rounded-lg space-y-6">
          <div className="h-7 w-48 bg-secondary rounded" />
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-5 w-5 bg-secondary rounded shrink-0 mt-0.5" />
                <div className="h-5 w-full bg-secondary rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Khối "Khóa học bao gồm" */}
        <div className="rounded-lg border border-border bg-card p-6 lg:p-7 shadow-sm space-y-5">
          <div>
            <div className="h-3 w-32 bg-secondary rounded mb-2" />
            <div className="h-7 w-48 bg-secondary rounded" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-11 bg-secondary/40 rounded-md" />
            ))}
          </div>
        </div>

        {/* Khối "Nội dung khóa học" */}
        <div className="space-y-5">
          <div>
            <div className="h-7 w-52 bg-secondary rounded mb-2" />
            <div className="h-4 w-64 bg-secondary rounded" />
          </div>
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-secondary/40" />
            ))}
          </div>
        </div>

        {/* Khối "Yêu cầu & Mô tả" */}
        <div className="rounded-lg border border-border bg-card divide-y divide-border shadow-sm">
          <div className="p-6 lg:p-7 space-y-4">
            <div className="h-6 w-36 bg-secondary rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-secondary rounded" />
              <div className="h-4 w-5/6 bg-secondary rounded" />
              <div className="h-4 w-4/6 bg-secondary rounded" />
            </div>
          </div>
          <div className="p-6 lg:p-7 space-y-4">
            <div className="h-6 w-36 bg-secondary rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-secondary rounded" />
              <div className="h-4 w-full bg-secondary rounded" />
              <div className="h-4 w-3/4 bg-secondary rounded" />
            </div>
          </div>
        </div>

        {/* Khối "Giảng viên" */}
        <div className="rounded-lg border border-border bg-card p-6 lg:p-7 shadow-sm space-y-6">
          <div className="h-7 w-36 bg-secondary rounded" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-20 w-20 rounded-full bg-secondary shrink-0" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-44 bg-secondary rounded" />
              <div className="h-4 w-32 bg-secondary rounded" />
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-5 w-36 bg-secondary rounded" />
                <div className="h-5 w-28 bg-secondary rounded" />
                <div className="h-5 w-32 bg-secondary rounded" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-secondary rounded" />
                <div className="h-4 w-4/5 bg-secondary rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Khối "Đánh giá khóa học" */}
        <div className="rounded-lg border border-border bg-card p-6 lg:p-7 shadow-sm space-y-6">
          <div>
            <div className="h-7 w-48 bg-secondary rounded mb-2" />
            <div className="h-4 w-72 bg-secondary rounded" />
          </div>
          <div className="h-28 bg-secondary/30 rounded-lg" />
          <div className="divide-y divide-border border-y border-border">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="py-4 flex gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-secondary rounded" />
                  <div className="h-3 w-28 bg-secondary rounded" />
                  <div className="h-4 w-full bg-secondary rounded pt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cột phải: sidebar mua hàng */}
      <div className="w-full lg:w-1/3 z-20">
        <div className="border border-border bg-card rounded-lg overflow-hidden shadow-xl">
          <div className="p-5 lg:p-6 space-y-4">
            <div className="h-3 w-32 bg-secondary rounded" />
            <div className="h-9 w-40 bg-secondary rounded" />
            <div className="h-4 w-full bg-secondary rounded" />
            <div className="h-[52px] bg-secondary rounded-lg" />
            <div className="h-[52px] bg-secondary rounded-lg" />
            <div className="h-[52px] bg-secondary rounded-lg" />
            <div className="pt-4 border-t border-border">
              <div className="h-[44px] bg-secondary rounded-lg" />
            </div>
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

  // Giữ cả nguồn quyền truy cập để phân biệt mua đứt với enrollment thuê bao.
  const currentEnrollment = course
    ? enrolledCourses.find((enrollment) => enrollment.courseId === course._id)
    : undefined;
  const isEnrolled = isAuthenticated && Boolean(currentEnrollment);

  // Trạng thái đang tải: hiển thị skeleton
  if (isLoading) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-20 relative -mt-[88px]">
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
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-20 relative -mt-[88px]">
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
        <CoursePurchaseCard 
          course={course} 
          isEnrolled={isEnrolled} 
          accessSource={currentEnrollment?.source}
          accessEndsAt={currentEnrollment?.accessEndsAt}
          reportButton={isAuthenticated ? <ReportDialog targetType="COURSE" targetId={course._id} label="Báo cáo khóa học" /> : null}
        />

      </div>
    </div>
  );
}
