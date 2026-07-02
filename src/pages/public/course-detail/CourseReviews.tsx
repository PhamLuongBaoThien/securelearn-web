import { useEffect, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/rating';
import { useCourseReviews, useMyCourseReview, useUpsertCourseReview } from '@/hooks/useCourseReviews';
import type { ICourse } from '@/services/courseApi';
import { useAppSelector } from '@/app/hooks';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { RatingSummary } from '@/components/ui/RatingSummary';
import { ReportDialog } from '@/components/inbox/ReportDialog';

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function CourseReviews({ course, canReview }: { course: ICourse; canReview: boolean }) {
  const user = useAppSelector((state) => state.auth.user);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const reviewsQuery = useCourseReviews(course._id);
  const myReviewQuery = useMyCourseReview(course._id, canReview);
  const upsertReview = useUpsertCourseReview(course._id, course.slug);
  const reviews = reviewsQuery.data?.reviews ?? [];
  const reviewCount = course.reviews ?? 0;
  const averageRating = course.rating ?? 0;
  const existingReview = myReviewQuery.data;
  const hasReviewChanged = !existingReview
    || existingReview.rating !== rating
    || (existingReview.comment || '').trim() !== comment.trim();

  useEffect(() => {
    if (!myReviewQuery.data) return;
    setRating(myReviewQuery.data.rating);
    setComment(myReviewQuery.data.comment || '');
  }, [myReviewQuery.data]);

  const handleSubmit = async () => {
    try {
      const response = await upsertReview.mutateAsync({
        rating,
        comment,
        userAvatarUrl: user?.profile?.avatarUrl || user?.avatarUrl || '',
      });
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể lưu đánh giá.');
      }
      toast.success(existingReview ? 'Đã cập nhật đánh giá.' : 'Đã gửi đánh giá.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu đánh giá.');
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-6 lg:p-7 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold">Đánh giá khóa học</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Cảm nhận thật từ những học viên đã ghi danh khóa học này.
        </p>
      </div>

      <div className="mt-5">
        <RatingSummary
          averageRating={averageRating}
          reviewCount={reviewCount}
          reviews={reviews}
        />
      </div>

      {canReview && (
        <div className="mt-6 rounded-lg border border-border bg-background p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="md:w-56">
              <p className="text-sm font-semibold">Đánh giá của bạn</p>
              <Rating value={rating} onValueChange={setRating} iconClassName="h-6 w-6" className="mt-2" />
            </div>
            <div className="flex-1">
              <textarea
                rows={4}
                maxLength={1000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về khóa học..."
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{comment.trim().length}/1000 ký tự</span>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={upsertReview.isPending || myReviewQuery.isLoading || !hasReviewChanged}
                  className="gap-2 rounded-lg"
                >
                  {upsertReview.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {existingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        {reviewsQuery.isLoading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải đánh giá...
          </div>
        )}

        {!reviewsQuery.isLoading && reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Khóa học này chưa có đánh giá nào.</p>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="divide-y divide-border border-y border-border">
            {reviews.map((review) => (
              <article key={review._id} className="py-4 relative">
                {user && user._id !== review.userId && (
                  <div className="absolute right-0 top-3">
                    <ReportDialog targetType="REVIEW" targetId={review._id} courseId={course._id} label="Báo cáo" />
                  </div>
                )}
                <div className="flex gap-3">
                  <UserAvatar
                    user={{ fullName: review.userName, avatarUrl: review.userAvatarUrl }}
                    className="h-10 w-10 text-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 pr-8">
                      <p className="text-sm font-bold text-foreground">{review.userName || 'Học viên SecureLearn'}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Rating value={review.rating} readOnly />
                        <span className="text-xs text-muted-foreground">• {formatDate(review.updatedAt)}</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
