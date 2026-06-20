import { useMemo, useState, type ElementType } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  Flame,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  GraduationCap,
  Heart,
  Library,
  PlayCircle,
  Search,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../../components/ui/dropdown-menu';
import { Select } from '../../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../../components/ui/pagination';
import { useEnrolledCourses, type EnrolledCourseItem } from '../../../hooks/useEnrolledCourses';
import { useAppSelector } from '../../../app/hooks';
import { CourseCard as CatalogCourseCard } from '../../../components/ui/CourseCard';
import type { ICourse } from '../../../services/courseApi';
import type { CartItem } from '../../../features/courses/cartSlice';
import { useMyPaymentTransactions } from '../../../hooks/useMyPaymentTransactions';
import { useDebounce } from '../../../hooks/useDebounce';
import { useLearnerActivity } from '../../../hooks/useLearningProgress';
import type { PaymentTransaction } from '../../../services/paymentApi';

type TabId = 'my-courses' | 'progress' | 'wishlist' | 'payments' | 'certificates';
type SortKey = 'recent' | 'name-az';
type PaymentStatusFilter = '' | PaymentTransaction['status'];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Ghi danh gần đây' },
  { key: 'name-az', label: 'Tên A-Z' },
];

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  INTERMEDIATE: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  ADVANCED: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
};

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'progress', label: 'Theo dõi tiến độ' },
  { id: 'my-courses', label: 'Khóa học của tôi' },
  { id: 'wishlist', label: 'Khóa học mong muốn' },
  { id: 'payments', label: 'Lịch sử thanh toán' },
  { id: 'certificates', label: 'Chứng chỉ' },
];

const TRANSACTION_STATUS_META: Record<PaymentTransaction['status'], { label: string; cls: string }> = {
  PENDING: {
    label: 'Đang xử lý',
    cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  },
  SUCCEEDED: {
    label: 'Thành công',
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  FAILED: {
    label: 'Thất bại',
    cls: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    cls: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  },
};

const PRODUCT_TYPE_LABEL: Record<PaymentTransaction['productType'], string> = {
  COURSE: 'Khóa học',
  SUBSCRIPTION: 'Gói thuê bao',
};

const PAYMENT_STATUS_FILTERS: Array<{ value: PaymentStatusFilter; label: string }> = [
  { value: '', label: 'Tất cả đã ghi nhận' },
  { value: 'SUCCEEDED', label: 'Thành công' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
  { value: 'PENDING', label: 'Đang xử lý' },
];

type ActivityMonthOption = {
  value: string;
  label: string;
  from: string;
  to: string;
  daysInMonth: number;
};

function buildActivityMonthOptions(totalMonths = 6): ActivityMonthOption[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return Array.from({ length: totalMonths }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const fromDate = new Date(year, month, 1);
    const toDate = new Date(year, month + 1, 0);

    return {
      value: monthKey,
      label: monthDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
      from: toLocalDateKey(fromDate),
      to: toLocalDateKey(toDate),
      daysInMonth: toDate.getDate(),
    };
  });
}

function formatLearningTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes} phút`;
  return `${safeSeconds}s`;
}

function formatActivityDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;
  return new Date(year, month - 1, day).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatActivityMonthLabel(monthValue: string): string {
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) return monthValue;
  return new Date(year, month - 1, 1).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });
}

function getActivityIntensityClass(activeSeconds: number, maxActiveSeconds: number): string {
  if (activeSeconds <= 0) return 'bg-zinc-100 dark:bg-zinc-800';
  const ratio = maxActiveSeconds > 0 ? activeSeconds / maxActiveSeconds : 0;
  if (ratio >= 0.75) return 'bg-emerald-500';
  if (ratio >= 0.45) return 'bg-emerald-400';
  if (ratio >= 0.2) return 'bg-emerald-300';
  return 'bg-emerald-200 dark:bg-emerald-500/40';
}

function buildActivityHeatmap(days: Array<{ date: string; activeSeconds: number }>, monthOption: ActivityMonthOption) {
  const activityMap = new Map(days.map((day) => [day.date, day.activeSeconds]));
  const [year, month] = monthOption.value.split('-').map(Number);
  const result: Array<{ date: string; activeSeconds: number }> = [];

  for (let day = 1; day <= monthOption.daysInMonth; day += 1) {
    const dateKey = toLocalDateKey(new Date(year, month - 1, day));
    result.push({ date: dateKey, activeSeconds: activityMap.get(dateKey) || 0 });
  }

  return result;
}

function ActivitySection({
  selectedMonth,
  monthOptions,
  onMonthChange,
  activity,
  isLoading,
  isError,
}: {
  selectedMonth: string;
  monthOptions: ActivityMonthOption[];
  onMonthChange: (month: string) => void;
  activity?: { totalActiveSeconds: number; activeDays: number; currentStreakDays: number; days: Array<{ date: string; activeSeconds: number; completedLessons: number; completedCourses: number }> };
  isLoading: boolean;
  isError: boolean;
}) {
  const selectedMonthOption = monthOptions.find((option) => option.value === selectedMonth) || monthOptions[0];
  const heatmapDays = buildActivityHeatmap(activity?.days || [], selectedMonthOption);
  const maxActiveSeconds = Math.max(...heatmapDays.map((day) => day.activeSeconds), 0);
  const recentActiveDays = [...(activity?.days || [])]
    .filter((day) => day.activeSeconds > 0 || day.completedLessons > 0 || day.completedCourses > 0)
    .slice(-5)
    .reverse();

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-5 dark:border-zinc-800 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Theo dõi tiến độ</p>
          <h2 className="mt-2 text-xl font-bold text-zinc-950 dark:text-white">Nhịp học của bạn theo từng tháng</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Xem thời gian bạn thực sự học, số ngày có học và các buổi học gần đây trong tháng đã chọn.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <Select
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className="h-10 rounded-xl border-zinc-200 bg-white text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isError ? (
        <div className="px-5 py-10 text-sm text-zinc-500 dark:text-zinc-400">
          Không thể tải thống kê học tập lúc này. Vui lòng thử lại sau.
        </div>
      ) : isLoading ? (
        <div className="space-y-5 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-4 h-8 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 md:grid-cols-[repeat(7,minmax(0,1fr))]">
            {Array.from({ length: selectedMonthOption.daysInMonth }).map((_, index) => (
              <div key={index} className="h-8 rounded-md bg-zinc-100 dark:bg-zinc-900" />
            ))}
          </div>
        </div>
      ) : !activity || activity.days.length === 0 || activity.totalActiveSeconds <= 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <Flame className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-950 dark:text-white">Chưa có dữ liệu học tập</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Hãy học một bài mới để bắt đầu thấy lịch học và thời gian học của bạn tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-6 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tổng thời gian học</p>
              <p className="mt-3 text-3xl font-bold text-zinc-950 dark:text-white">{formatLearningTime(activity.totalActiveSeconds)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Số ngày đã học</p>
              <p className="mt-3 text-3xl font-bold text-zinc-950 dark:text-white">{activity.activeDays}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Streak hiện tại</p>
              <p className="mt-3 flex items-center gap-2 text-3xl font-bold text-zinc-950 dark:text-white"><Flame className="h-7 w-7 text-amber-500" />{activity.currentStreakDays}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Lịch học theo ngày</h3>
                <span className="text-xs text-zinc-400">{formatActivityMonthLabel(selectedMonthOption.value)}</span>
              </div>
              <TooltipProvider delayDuration={120}>
                <div className="grid grid-cols-7 gap-2 md:grid-cols-[repeat(7,minmax(0,1fr))]">
                  {heatmapDays.map((day) => (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={`h-8 rounded-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${getActivityIntensityClass(day.activeSeconds, maxActiveSeconds)}`}
                          aria-label={`${formatActivityDate(day.date)} - ${formatLearningTime(day.activeSeconds)}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent
                       className="rounded-xl">
                        <p className="text-xs font-semibold">{formatActivityDate(day.date)}</p>
                        <p className="mt-1 text-xs">{day.activeSeconds > 0 ? formatLearningTime(day.activeSeconds) : 'Chưa có thời gian học ghi nhận'}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Buổi học gần đây</h3>
              <div className="mt-4 space-y-3">
                {recentActiveDays.length > 0 ? recentActiveDays.map((day) => (
                  <div key={day.date} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{formatActivityDate(day.date)}</p>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatLearningTime(day.activeSeconds)}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {day.completedLessons} bài hoàn thành · {day.completedCourses} khóa hoàn thành
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Chưa có buổi học nào trong khoảng thời gian này.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sortedPages = Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [];
  sortedPages.forEach((pageNumber, index) => {
    const previous = sortedPages[index - 1];
    if (previous && pageNumber - previous > 1) {
      items.push(previous === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    items.push(pageNumber);
  });

  return items;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTransactionDate(value?: string | null): string {
  if (!value) return 'Chưa có thời gian';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function sortCourses(courses: EnrolledCourseItem[], key: SortKey): EnrolledCourseItem[] {
  return [...courses].sort((a, b) => {
    switch (key) {
      case 'recent':
        return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
      case 'name-az':
        return a.title.localeCompare(b.title, 'vi');
    }
  });
}

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  const current = SORT_OPTIONS.find((o) => o.key === value)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 focus-visible:ring-0"
        >
          <span>{current.label}</span>
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {SORT_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`w-full justify-start cursor-pointer text-sm py-2 px-3 transition-colors ${
              opt.key === value
                ? 'bg-zinc-100 font-semibold text-zinc-950 dark:bg-zinc-900 dark:text-white'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
            }`}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: ElementType;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <Icon className="mb-3 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      <p className="text-2xl font-bold text-zinc-950 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="aspect-video animate-pulse bg-zinc-100 dark:bg-zinc-900" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-2 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

function EnrolledCourseCard({ course }: { course: EnrolledCourseItem }) {
  const navigate = useNavigate();
  const progress = Math.max(0, Math.min(100, Math.round(course.progressPercent || 0)));
  const learnPath = course.lastLessonId
    ? `/student/courses/${course.courseId}/learn?lessonId=${course.lastLessonId}`
    : `/student/courses/${course.courseId}/learn`;

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
      onClick={() => navigate(learnPath)}
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-9 w-9 text-zinc-400" />
          </div>
        )}

        {course.level && (
          <Badge
            variant="outline"
            className={`absolute left-3 top-3 border px-2 py-1 text-xs font-semibold ${
              LEVEL_COLOR[course.level] ?? 'border-zinc-200 bg-white text-zinc-600'
            }`}
          >
            {LEVEL_LABEL[course.level] ?? course.level}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-zinc-950 dark:text-white">
          {course.title}
        </h3>
        <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">{course.instructorName}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          {course.totalLessons > 0 && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {course.totalLessons} bài
            </span>
          )}
          {course.totalDuration > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(course.totalDuration)}
            </span>
          )}
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Tiến độ</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-zinc-400">
            {course.completedLessons}/{course.progressTotalLessons || course.totalLessons || 0} bài hoàn thành
          </p>
        </div>
        <Button
          type="button"
          variant="udemy_dark"
          onClick={(event) => {
            event.stopPropagation();
            navigate(learnPath);
          }}
          className="mt-5 w-full gap-2 rounded-lg"
        >
          <PlayCircle className="h-4 w-4" />
          Học tiếp
        </Button>
      </div>
    </article>
  );
}

function toCatalogCourse(course: CartItem): ICourse {
  return {
    _id: course._id,
    slug: course.slug,
    title: course.title,
    thumbnail: course.thumbnail,
    instructorId: '',
    instructorName: course.instructorName,
    level: course.level,
    price: course.price,
    rating: course.rating,
    status: 'PUBLISHED',
    totalDuration: course.totalDuration ?? 0,
    totalLessons: course.totalLessons ?? 0,
    enrollmentCount: 0,
    sections: [],
    createdAt: '',
    updatedAt: '',
  };
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ElementType;
  title: string;
  description: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-base font-semibold text-zinc-950 dark:text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function PaymentHistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="h-4 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-44 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-8 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentTransactionCard({ transaction }: { transaction: PaymentTransaction }) {
  const statusMeta = TRANSACTION_STATUS_META[transaction.status];
  const displayDate = transaction.paidAt || transaction.failedAt || transaction.refundedAt || transaction.createdAt;
  const message = transaction.status === 'FAILED'
    ? transaction.failureReason
    : transaction.status === 'REFUNDED'
      ? transaction.refundReason
      : '';

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`border px-2 py-1 text-xs font-semibold ${statusMeta.cls}`}>
              {statusMeta.label}
            </Badge>
            <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {PRODUCT_TYPE_LABEL[transaction.productType]}
            </Badge>
            <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {transaction.provider}
            </Badge>
          </div>

          <h3 className="mt-3 truncate text-sm font-semibold text-zinc-950 dark:text-white">
            Mã giao dịch {transaction.transactionCode}
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatTransactionDate(displayDate)} · {transaction.paymentMethod}
          </p>
        </div>

        <div className="text-left md:text-right">
          <p className="text-xl font-bold text-zinc-950 dark:text-white">{formatCurrency(transaction.amount)}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {transaction.productType === 'COURSE'
              ? `${transaction.items.length} khóa học`
              : `${transaction.subscriptionSnapshot?.durationDays ?? 0} ngày truy cập`}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {transaction.productType === 'SUBSCRIPTION' ? (
          <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/70">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                {transaction.subscriptionSnapshot?.name || 'Gói thuê bao SecureLearn'}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {transaction.subscriptionSnapshot?.planType === 'YEARLY' ? 'Gói năm' : 'Gói tháng'} · {transaction.subscriptionSnapshot?.durationDays ?? 0} ngày
              </p>
            </div>
          </div>
        ) : (
          transaction.items.map((item) => (
            <div key={`${transaction._id}-${item.courseId}`} className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/70">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-800">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-5 w-5 text-zinc-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.instructorName || 'SecureLearn'} · {formatCurrency(item.price)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {message && (
        <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
          {message}
        </p>
      )}
    </article>
  );
}

export function StudentDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resolveTabFromParams = (params: URLSearchParams): TabId => {
    const tab = params.get('tab');
    if (tab === 'progress' || tab === 'wishlist' || tab === 'payments' || tab === 'certificates') return tab;
    return 'my-courses';
  };
  const activeTab = resolveTabFromParams(searchParams);
  const paymentSearch = searchParams.get('paymentSearch') || '';
  const paymentStatusFilter = (searchParams.get('paymentStatus') as PaymentStatusFilter) || '';
  const paymentPage = Math.max(Number(searchParams.get('paymentPage') || '1'), 1);
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const activityMonthOptions = useMemo(() => buildActivityMonthOptions(), []);
  const [selectedActivityMonth, setSelectedActivityMonth] = useState(activityMonthOptions[0]?.value || '');
  const debouncedPaymentSearch = useDebounce(paymentSearch.trim(), 300);
  const paymentLimit = 10;

  const user = useAppSelector((state) => state.auth.user);
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const firstName = user?.fullName?.split(' ').pop() ?? 'bạn';

  const { data: enrolledCourses = [], isLoading, isError } = useEnrolledCourses();
  const selectedActivityMonthOption = useMemo(
    () => activityMonthOptions.find((option) => option.value === selectedActivityMonth) || activityMonthOptions[0],
    [activityMonthOptions, selectedActivityMonth]
  );
  const activityQuery = useLearnerActivity({
    from: selectedActivityMonthOption?.from,
    to: selectedActivityMonthOption?.to,
  });
  const streak = activityQuery.data?.currentStreakDays ?? 0;
  const isStreakActive = streak > 0;
  const paymentsQuery = useMyPaymentTransactions({
    search: debouncedPaymentSearch,
    page: paymentPage,
    limit: paymentLimit,
    status: paymentStatusFilter || undefined,
  });
  const paymentTotal = paymentsQuery.data?.total ?? 0;
  const paymentTotalPages = Math.max(Math.ceil(paymentTotal / paymentLimit), 1);
  const paymentVisiblePages = getVisiblePages(paymentPage, paymentTotalPages);

  const sortedCourses = useMemo(
    () => sortCourses(enrolledCourses, sortKey),
    [enrolledCourses, sortKey]
  );

  const inProgressCount = enrolledCourses.filter(
    (course) => course.progressPercent > 0 && course.progressPercent < 100
  ).length;
  const completedCount = enrolledCourses.filter((course) => course.progressPercent >= 100).length;
  const tabCounts: Partial<Record<TabId, number>> = {
    'my-courses': enrolledCourses.length,
    wishlist: wishlist.length,
    payments: paymentsQuery.data?.total ?? 0,
    certificates: 0,
  };

  return (
    <div className="relative -mt-[88px] min-h-screen bg-zinc-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <section className="bg-zinc-900 px-4 pb-20 pt-[120px] text-zinc-50 sm:px-6 lg:pb-24 lg:pt-[136px]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium text-zinc-400">
              Bảng điều khiển học tập
            </p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Xin chào, {firstName}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Theo dõi khóa học đã ghi danh, xem lại danh sách mong muốn và tiếp tục học từ một nơi duy nhất.
            </p>
          </div>

          <div className="flex items-start justify-start lg:justify-end">
            <div className="relative rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
              <div className="relative flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  {isStreakActive && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-xl" />
                      <div className="absolute inset-1 rounded-full bg-orange-500/30 blur-lg" />
                    </>
                  )}
                  <Flame
                    className={`relative h-7 w-7 transition-all duration-300 ${
                      isStreakActive
                        ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                        : 'text-zinc-500 dark:text-zinc-600'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-3xl font-bold leading-none tracking-tight text-white">
                    {activityQuery.isLoading ? '-' : streak}
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-400">ngày streak</p>
                </div>
                <TooltipProvider delayDuration={120}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-white"
                      >
                        <CircleHelp className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-60 rounded-xl">
                      {isStreakActive
                        ? 'Học ít nhất một nội dung mới mỗi ngày để giữ chuỗi ngày học liên tiếp của bạn.'
                        : 'Hãy thắp sáng chuỗi học tập bằng cách học một bài học mới ngay hôm nay!'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-0 sm:px-6">
        <section className="-mt-10 mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Library} value={isLoading ? '-' : enrolledCourses.length} label="Khóa học đã ghi danh" />
          <StatCard icon={PlayCircle} value={isLoading ? '-' : inProgressCount} label="Đang học" />
          <StatCard icon={CheckCircle2} value={isLoading ? '-' : completedCount} label="Hoàn thành" />
          <StatCard icon={Heart} value={wishlist.length} label="Khóa học mong muốn" />
        </section>
        <section>
          <div className="mb-6 flex flex-col gap-4 border-b border-zinc-200 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-6 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (tab.id === 'my-courses') {
                      setSearchParams({});
                    } else {
                      const params = new URLSearchParams(searchParams);
                      params.set('tab', tab.id);
                      setSearchParams(params, { replace: true });
                    }
                  }}
                  className={`relative flex shrink-0 items-center gap-2 pb-3 text-sm transition-colors rounded-none bg-transparent hover:bg-transparent px-0 pt-0 h-auto ${
                    activeTab === tab.id
                      ? 'font-semibold text-zinc-950 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                  {tabCounts[tab.id] !== undefined && (
                    <Badge
                      variant={activeTab === tab.id ? 'default' : 'secondary'}
                      className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
                        activeTab === tab.id
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-950 dark:hover:bg-white'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      {tabCounts[tab.id]}
                    </Badge>
                  )}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="student-dashboard-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-zinc-950 dark:bg-white"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                    />
                  )}
                </Button>
              ))}
            </div>

          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'my-courses' && (
              <motion.div
                key="courses"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {!isLoading && !isError && enrolledCourses.length > 0 && (
                  <div className="mb-6 flex justify-end">
                    <SortDropdown value={sortKey} onChange={setSortKey} />
                  </div>
                )}
                {isError && (
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải danh sách khóa học"
                    description="Vui lòng thử lại sau hoặc kiểm tra kết nối của bạn."
                  />
                )}

                {isLoading && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <CourseCardSkeleton key={index} />
                    ))}
                  </div>
                )}

                {!isLoading && !isError && enrolledCourses.length === 0 && (
                  <EmptyState
                    icon={GraduationCap}
                    title="Bạn chưa ghi danh khóa học nào"
                    description="Khám phá các khóa học phù hợp để bắt đầu học theo lộ trình của riêng bạn."
                    action={{ label: 'Khám phá khóa học', to: '/courses' }}
                  />
                )}

                {!isLoading && !isError && sortedCourses.length > 0 && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sortedCourses.map((course) => (
                      <EnrolledCourseCard key={course.enrollmentId} course={course} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ActivitySection
                  selectedMonth={selectedActivityMonth}
                  monthOptions={activityMonthOptions}
                  onMonthChange={setSelectedActivityMonth}
                  activity={activityQuery.data}
                  isLoading={activityQuery.isLoading}
                  isError={activityQuery.isError}
                />
              </motion.div>
            )}

            {activeTab === 'wishlist' && (
              <motion.div
                key="wishlist"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {wishlist.length === 0 ? (
                  <EmptyState
                    icon={Heart}
                    title="Chưa có khóa học mong muốn"
                    description="Thả tim các khóa học bạn quan tâm để quay lại mua hoặc xem chi tiết sau."
                    action={{ label: 'Tìm khóa học để lưu', to: '/courses' }}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {wishlist.map((course) => (
                      <CatalogCourseCard key={course._id} course={toCatalogCourse(course)} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div
                key="payments"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <div className="flex h-10 w-full sm:w-80 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <Search className="h-4 w-4 shrink-0 text-zinc-400" />
                    <Input
                      value={paymentSearch}
                      onChange={(event) => {
                        const params = new URLSearchParams(searchParams);
                        if (event.target.value) params.set('paymentSearch', event.target.value);
                        else params.delete('paymentSearch');
                        params.delete('paymentPage');
                        setSearchParams(params, { replace: true });
                      }}
                      placeholder="Mã giao dịch, khóa học, gói..."
                      className="h-auto w-full border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="w-full sm:w-[190px]">
                    <Select
                      value={paymentStatusFilter}
                      onChange={(event) => {
                        const params = new URLSearchParams(searchParams);
                        if (event.target.value) params.set('paymentStatus', event.target.value);
                        else params.delete('paymentStatus');
                        params.delete('paymentPage');
                        setSearchParams(params, { replace: true });
                      }}
                      className="h-10 rounded-lg border-zinc-200 bg-white text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                    >
                      {PAYMENT_STATUS_FILTERS.map((option) => (
                        <option key={option.value || 'all'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                {paymentsQuery.isError && (
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải lịch sử thanh toán"
                    description="Vui lòng thử lại sau hoặc kiểm tra kết nối của bạn."
                  />
                )}

                {paymentsQuery.isLoading && <PaymentHistorySkeleton />}

                {!paymentsQuery.isLoading && !paymentsQuery.isError && (paymentsQuery.data?.transactions.length ?? 0) === 0 && (
                  <EmptyState
                    icon={CreditCard}
                    title="Chưa có giao dịch thanh toán"
                    description="Các giao dịch đã thành công, thất bại hoặc hoàn tiền sẽ được lưu lại tại đây."
                    action={{ label: 'Khám phá khóa học', to: '/courses' }}
                  />
                )}

                {!paymentsQuery.isLoading && !paymentsQuery.isError && Boolean(paymentsQuery.data?.transactions.length) && (
                  <div className="relative min-h-[560px] space-y-4">
                    {paymentsQuery.isFetching && (
                      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full w-1/3 animate-pulse bg-zinc-900 dark:bg-white" />
                      </div>
                    )}
                    <div className={`space-y-4 transition-opacity duration-150 ${paymentsQuery.isFetching ? 'opacity-70' : 'opacity-100'}`}>
                      {paymentsQuery.data!.transactions.map((transaction) => (
                        <PaymentTransactionCard key={transaction._id} transaction={transaction} />
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {paymentsQuery.data!.transactions.length} / {paymentTotal} giao dịch · Trang {paymentPage}/{paymentTotalPages}
                      </p>
                      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              text="Trước"
                              aria-disabled={paymentPage <= 1}
                              className={paymentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                              onClick={(event) => {
                                event.preventDefault();
                                const params = new URLSearchParams(searchParams);
                                const nextPage = Math.max(paymentPage - 1, 1);
                                if (nextPage > 1) params.set('paymentPage', nextPage.toString());
                                else params.delete('paymentPage');
                                setSearchParams(params, { replace: true });
                              }}
                            />
                          </PaginationItem>
                          {paymentVisiblePages.map((item) => (
                            <PaginationItem key={item}>
                              {typeof item === 'number' ? (
                                <PaginationLink
                                  href="#"
                                  isActive={item === paymentPage}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    const params = new URLSearchParams(searchParams);
                                    if (item > 1) params.set('paymentPage', item.toString());
                                    else params.delete('paymentPage');
                                    setSearchParams(params, { replace: true });
                                  }}
                                >
                                  {item}
                                </PaginationLink>
                              ) : (
                                <PaginationEllipsis />
                              )}
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              text="Sau"
                              aria-disabled={paymentPage >= paymentTotalPages}
                              className={paymentPage >= paymentTotalPages ? 'pointer-events-none opacity-50' : ''}
                              onClick={(event) => {
                                event.preventDefault();
                                const params = new URLSearchParams(searchParams);
                                const nextPage = Math.min(paymentPage + 1, paymentTotalPages);
                                if (nextPage > 1) params.set('paymentPage', nextPage.toString());
                                else params.delete('paymentPage');
                                setSearchParams(params, { replace: true });
                              }}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'certificates' && (
              <motion.div
                key="certificates"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <EmptyState
                  icon={Download}
                  title="Chưa có chứng chỉ nào"
                  description="Chứng chỉ sẽ hiển thị ở đây sau khi bạn hoàn thành toàn bộ nội dung của một khóa học."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="mt-8 grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-5 w-5 text-zinc-500" />
            <div>
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">Gợi ý học hôm nay</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Chọn một khóa đang học và hoàn thành thêm một bài ngắn.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 text-zinc-500" />
            <div>
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">Tiến độ học tập</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Dashboard dùng dữ liệu từ Progress Service để cập nhật phần trăm và trạng thái hoàn thành.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Heart className="mt-0.5 h-5 w-5 text-zinc-500" />
            <div>
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">Danh sách mong muốn</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Đây là nơi gom các khóa học người dùng đã tim để quay lại sau.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}









