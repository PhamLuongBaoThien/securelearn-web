// ========================
// Rating Summary Component
// Mục đích:
// - Hiển thị tổng hợp xếp hạng kiểu Udemy: điểm lớn + sao bên trái,
//   thanh phân bổ 5→1 sao bên phải, kèm tổng số đánh giá.
// - Dùng chung cho trang Course Detail và trang học tập xem video.
// ========================
import { Star } from 'lucide-react';
import { Rating } from '@/components/ui/rating';
import { cn } from '@/lib/utils';
import type { ICourseReview } from '@/services/courseApi';

export interface RatingSummaryProps {
  /** Điểm đánh giá trung bình */
  averageRating: number;
  /** Tổng số lượt đánh giá (từ course metadata) */
  reviewCount: number;
  /** Mảng reviews đã tải (dùng để tính phân bổ sao) */
  reviews: ICourseReview[];
  /** Class wrapper bổ sung */
  className?: string;
}

export function RatingSummary({
  averageRating,
  reviewCount,
  reviews,
  className,
}: RatingSummaryProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-stretch gap-6 rounded-xl border border-zinc-200 p-5 sm:flex-row sm:items-center dark:border-zinc-800',
        className,
      )}
    >
      {/* Left: Big number + stars */}
      <div className="flex shrink-0 flex-col items-center text-center sm:min-w-[120px]">
        <p className="text-5xl font-bold leading-none text-amber-600 dark:text-amber-500">
          {reviewCount > 0 ? averageRating.toFixed(1) : '--'}
        </p>
        <Rating
          value={Math.round(averageRating)}
          readOnly
          className="mt-2.5"
          iconClassName="h-4 w-4"
        />
        <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
          Xếp hạng khóa học
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {reviewCount.toLocaleString('vi-VN')} đánh giá
        </p>
      </div>

      {/* Divider */}
      <div className="hidden h-24 w-px bg-zinc-200 sm:block dark:bg-zinc-800" />

      {/* Right: Rating breakdown bars */}
      <div className="flex-1 space-y-2">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const pct =
            reviews.length > 0
              ? Math.round((count / reviews.length) * 100)
              : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <div className="flex w-[88px] shrink-0 items-center justify-end gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < star
                        ? 'fill-amber-500 text-amber-500'
                        : 'fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-zinc-500 transition-all duration-500 dark:bg-zinc-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm font-semibold text-primary underline underline-offset-2">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
