import { useRef } from 'react';
import { CourseCard } from './CourseCard';
import type { ICourse } from '@/services/courseApi';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCourseCouponPreviews } from '@/hooks/useCourseCouponPreviews';
import { useEnrolledCourses } from '@/hooks/useEnrolledCourses';
import { useAppSelector } from '@/app/hooks';

export const CourseCarousel = ({ courses }: { courses: ICourse[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const couponPreviewsQuery = useCourseCouponPreviews(courses);
  const couponPreviews = couponPreviewsQuery.data ?? {};
  const enrolledCoursesQuery = useEnrolledCourses();
  const enrolledCourseIds = new Set((enrolledCoursesQuery.data ?? []).map((course) => course.courseId));
  const isEnrollmentLoading = isAuthenticated && courses.length > 0 && enrolledCoursesQuery.isLoading;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollRef.current.clientWidth + 50, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth - 50, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={scrollLeft}
        className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 bg-background border border-border shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary focus:opacity-100 disabled:opacity-0"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-4 hide-scrollbar"
        style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {isEnrollmentLoading ? (
          Array.from({ length: Math.min(courses.length || 4, 6) }).map((_, index) => (
            <div key={index} className="min-w-[240px] md:min-w-[260px] max-w-[280px] snap-start shrink-0">
              <div className="h-[320px] w-full animate-pulse rounded-xl border border-border bg-muted" />
            </div>
          ))
        ) : courses.map(course => (
          <div key={course._id} className="min-w-[240px] md:min-w-[260px] max-w-[280px] snap-start shrink-0 flex">
            <CourseCard course={course} couponPreview={couponPreviews[course._id] ?? null} disableCouponPreviewFetch isEnrolledOverride={enrolledCourseIds.has(course._id)} />
          </div>
        ))}
      </div>

      <button 
        onClick={scrollRight}
        className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 bg-background border border-border shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary focus:opacity-100 disabled:opacity-0"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};



