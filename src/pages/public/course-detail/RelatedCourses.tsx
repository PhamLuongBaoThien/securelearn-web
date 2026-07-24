import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { CourseCard } from '@/components/ui/CourseCard';
import { Button } from '@/components/ui/button';
import { CourseCardSkeleton } from '@/pages/public/catalog/CourseCardSkeleton';
import { useRelatedCourses, RELATED_COURSES_PAGE_SIZE } from '@/hooks/useRelatedCourses';
import { useCourseCouponPreviews } from '@/hooks/useCourseCouponPreviews';
import { useEnrolledCourses } from '@/hooks/useEnrolledCourses';
import type { ICourse } from '@/services/courseApi';

export function RelatedCourses({ course }: { course: ICourse }) {
  const relatedQuery = useRelatedCourses(course._id);

  const relatedCourses = useMemo(() => {
    const uniqueCourses = new Map<string, ICourse>();
    relatedQuery.data?.pages.forEach((page) => {
      page.courses.forEach((relatedCourse) => {
        if (relatedCourse._id !== course._id) {
          uniqueCourses.set(relatedCourse._id, relatedCourse);
        }
      });
    });
    return Array.from(uniqueCourses.values());
  }, [course._id, relatedQuery.data]);

  const couponPreviewsQuery = useCourseCouponPreviews(
    relatedCourses,
    relatedCourses.length > 0 && !relatedQuery.isPending,
  );
  const enrolledCoursesQuery = useEnrolledCourses();
  const enrolledCourseIds = useMemo(
    () => new Set((enrolledCoursesQuery.data ?? []).map((item) => item.courseId)),
    [enrolledCoursesQuery.data],
  );
  const couponPreviews = couponPreviewsQuery.data ?? {};
  const isInitialCardsLoading = relatedQuery.isPending && relatedCourses.length === 0;
  const isLoadingMore = relatedQuery.isFetchingNextPage;

  if (!course.category?._id && !course.categoryId) return null;

  return (
    <section className="mx-auto mt-16 max-w-[1340px] border-t border-border px-6 pt-10" aria-labelledby="related-courses-title">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">Tiếp tục khám phá</p>
        <h2 id="related-courses-title" className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Khóa học liên quan
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Các khóa học được đánh giá cao trong danh mục {course.category?.name}.
        </p>
      </div>

      {isInitialCardsLoading && (
        <div className="grid auto-rows-fr grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4" aria-label="Đang tải khóa học liên quan">
          {Array.from({ length: 4 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!isInitialCardsLoading && relatedQuery.isError && relatedCourses.length === 0 && (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 text-center">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="font-semibold text-foreground">Không thể tải khóa học liên quan</p>
          <Button variant="outline" onClick={() => void relatedQuery.refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {!isInitialCardsLoading && !relatedQuery.isError && relatedCourses.length === 0 && (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 text-center text-sm text-muted-foreground">
          Chưa có khóa học liên quan trong danh mục này.
        </div>
      )}

      {!isInitialCardsLoading && relatedCourses.length > 0 && (
        <>
          <div className="grid auto-rows-fr grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
            {relatedCourses.map((relatedCourse, index) => (
              <motion.div
                key={relatedCourse._id}
                className="h-full"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: (index % RELATED_COURSES_PAGE_SIZE) * 0.1 }}
              >
                <CourseCard
                  course={relatedCourse}
                  couponPreview={couponPreviews[relatedCourse._id] ?? null}
                  disableCouponPreviewFetch
                  isEnrolledOverride={enrolledCourseIds.has(relatedCourse._id)}
                />
              </motion.div>
            ))}
          </div>

          {(relatedQuery.hasNextPage || (relatedQuery.isError && relatedCourses.length > 0)) && (
            <div className="mt-10 flex flex-col items-center gap-3" aria-live="polite">
              {relatedQuery.isError && relatedCourses.length > 0 && (
                <p className="text-sm text-destructive">Không thể tải thêm khóa học. Vui lòng thử lại.</p>
              )}
              <Button
                variant="outline"
                className="min-w-44 rounded-xl"
                disabled={isLoadingMore}
                onClick={() => void relatedQuery.fetchNextPage()}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  'Xem thêm khóa học'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}