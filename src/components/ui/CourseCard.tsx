import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, BookOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoverCard } from '@/components/animations/HoverCard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ICourse } from '@/services/courseApi';

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
export const CourseCard = ({ course }: { course: ICourse }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasLearningPoints = Array.isArray(course.whatYouWillLearn) && course.whatYouWillLearn.length > 0;

  const cardContent = (
    <HoverCard className="group flex flex-col h-full cursor-pointer bg-zinc-50 dark:bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail — bọc trong Link */}
      <Link
        to={`/course/${course.slug}`}
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
        <Link to={`/course/${course.slug}`}>
          <h3 className="font-bold text-base leading-snug line-clamp-2 mb-0.5 text-foreground">
            {course.title}
          </h3>
        </Link>

        {/* Instructor */}
        <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">{course.instructorName}</p>

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

  if (!hasLearningPoints) {
    return cardContent;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {cardContent}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={15}
        className="w-80 p-5 shadow-xl pointer-events-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hidden md:block"
      >
        <h4 className="font-bold text-sm mb-3 text-zinc-900 dark:text-zinc-50">
          Những gì bạn sẽ học được:
        </h4>
        <ul className="space-y-2.5">
          {course.whatYouWillLearn?.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
