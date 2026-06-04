import { Link } from 'react-router-dom';
import { Star, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoverCard } from '@/components/animations/HoverCard';
import type { ICourse } from '@/services/courseApi';

// ── Shared snippet type ───────────────────────────────────────────────────────
export interface CourseSnippet {
  id: string;           // slug (dùng cho Link)
  title: string;
  instructor: string;
  rating?: number;
  reviews?: number;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  badge?: string;
  // Thông tin thêm từ API
  level?: ICourse['level'];
  totalLessons?: number;
  totalDuration?: number; // giây
  enrollmentCount?: number;
}

// ── Adapter: ICourse → CourseSnippet ─────────────────────────────────────────
export function courseToSnippet(course: ICourse): CourseSnippet {
  return {
    id: course.slug,
    title: course.title,
    instructor: course.instructorName,
    price: course.price,
    thumbnail: course.thumbnail ?? '',
    level: course.level,
    totalLessons: course.totalLessons,
    totalDuration: course.totalDuration,
    enrollmentCount: course.enrollmentCount,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const CourseCard = ({ course }: { course: CourseSnippet }) => {
  return (
    <HoverCard className="group flex flex-col h-full cursor-pointer bg-zinc-50 dark:bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail — bọc trong Link */}
      <Link
        to={`/course/${course.id}`}
        className="block w-full aspect-video overflow-hidden bg-secondary relative shrink-0"
      >
        {course.badge && (
          <div className="absolute top-2 left-2 bg-[#eceb98] text-yellow-900 text-xs font-bold px-2 py-1 rounded-sm z-10 shadow-sm">
            {course.badge}
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
            <BookOpen className="w-10 h-10 text-zinc-500" />
          </div>
        )}
      </Link>

      {/* Info area */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title */}
        <Link to={`/course/${course.id}`}>
          <h3 className="font-bold text-base leading-snug line-clamp-2 mb-0.5 text-foreground">
            {course.title}
          </h3>
        </Link>

        {/* Instructor */}
        <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">{course.instructor}</p>

        {/* Rating (chỉ hiển thị khi có data) */}
        {course.rating != null && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-amber-600 font-bold text-sm leading-none">{course.rating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i <= Math.round(course.rating!)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-muted-foreground fill-none'
                  }`}
                />
              ))}
            </div>
            {course.reviews != null && course.reviews > 0 && (
              <span className="text-xs text-muted-foreground">({course.reviews.toLocaleString()})</span>
            )}
          </div>
        )}

        {/* Stats: level + duration + lessons */}
        {(course.level || course.totalDuration || course.totalLessons) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-2 text-xs text-muted-foreground">
            {course.level && (
              <span>{LEVEL_LABEL[course.level] ?? course.level}</span>
            )}
            {course.level && (course.totalDuration || course.totalLessons) && (
              <span className="text-border">•</span>
            )}
            {course.totalDuration != null && course.totalDuration > 0 && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {formatDuration(course.totalDuration)}
              </span>
            )}
            {course.totalLessons != null && course.totalLessons > 0 && (
              <span className="flex items-center gap-0.5">
                <BookOpen className="w-3 h-3" />
                {course.totalLessons} bài giảng
              </span>
            )}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center gap-2 mb-3 mt-auto">
          <span className="font-bold text-base text-foreground">
            {course.price === 0 ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')} ₫`}
          </span>
          {course.originalPrice != null && (
            <span className="text-sm text-muted-foreground line-through">
              {course.originalPrice.toLocaleString('vi-VN')} ₫
            </span>
          )}
        </div>

        {/* CTA Button */}
        <Button
          variant="udemy_outline"
          size="sm"
          className="w-full rounded-sm font-bold"
          onClick={(e) => {
            e.preventDefault();
            // TODO: dispatch addToCart action
          }}
        >
          Thêm vào giỏ hàng
        </Button>
      </div>
    </HoverCard>
  );
};
