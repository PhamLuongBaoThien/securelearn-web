import { useEffect, useMemo, useState, type ElementType } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  GraduationCap,
  Heart,
  Library,
  PlayCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../../components/ui/dropdown-menu';
import { useEnrolledCourses, type EnrolledCourseItem } from '../../../hooks/useEnrolledCourses';
import { useAppSelector } from '../../../app/hooks';
import { CourseCard as CatalogCourseCard } from '../../../components/ui/CourseCard';
import type { ICourse } from '../../../services/courseApi';
import type { CartItem } from '../../../features/courses/cartSlice';

type TabId = 'my-courses' | 'wishlist' | 'certificates';
type SortKey = 'recent' | 'name-az';

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
  { id: 'my-courses', label: 'Khóa học của tôi' },
  { id: 'wishlist', label: 'Khóa học mong muốn' },
  { id: 'certificates', label: 'Chứng chỉ' },
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
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

function getStableProgress(seed: string): number {
  const value = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  if (value % 7 === 0) return 100;
  return (value % 58) + 12;
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
  const progress = getStableProgress(course.enrollmentId || course.courseId || course.title);

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
      onClick={() => navigate(`/student/courses/${course.courseId}/learn`)}
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
          <span
            className={`absolute left-3 top-3 rounded-md border px-2 py-1 text-xs font-semibold ${
              LEVEL_COLOR[course.level] ?? 'border-zinc-200 bg-white text-zinc-600'
            }`}
          >
            {LEVEL_LABEL[course.level] ?? course.level}
          </span>
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
        </div>

        <Button
          type="button"
          variant="udemy_dark"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/student/courses/${course.courseId}/learn`);
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

export function StudentDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resolveTabFromParams = (params: URLSearchParams): TabId => {
    const tab = params.get('tab');
    if (tab === 'wishlist' || tab === 'certificates') return tab;
    return 'my-courses';
  };
  const initialTab = resolveTabFromParams(searchParams);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const user = useAppSelector((state) => state.auth.user);
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const firstName = user?.fullName?.split(' ').pop() ?? 'bạn';

  const { data: enrolledCourses = [], isLoading, isError } = useEnrolledCourses();

  const sortedCourses = useMemo(
    () => sortCourses(enrolledCourses, sortKey),
    [enrolledCourses, sortKey]
  );

  const courseProgress = useMemo(
    () =>
      enrolledCourses.map((course) => ({
        id: course.enrollmentId,
        progress: getStableProgress(course.enrollmentId || course.courseId || course.title),
      })),
    [enrolledCourses]
  );

  const inProgressCount = courseProgress.filter((course) => course.progress > 0 && course.progress < 100).length;
  const completedCount = courseProgress.filter((course) => course.progress >= 100).length;

  const tabCounts: Record<TabId, number> = {
    'my-courses': enrolledCourses.length,
    wishlist: wishlist.length,
    certificates: 0,
  };

  useEffect(() => {
    setActiveTab(resolveTabFromParams(searchParams));
  }, [searchParams]);

  return (
    <div className="relative -mt-[88px] min-h-screen bg-zinc-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <section className="bg-zinc-900 px-4 pb-20 pt-[120px] text-zinc-50 sm:px-6 lg:pb-24 lg:pt-[136px]">
        <div className="mx-auto max-w-6xl">
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
                    setActiveTab(tab.id);
                    if (tab.id === 'my-courses') {
                      setSearchParams({});
                    } else {
                      setSearchParams({ tab: tab.id });
                    }
                  }}
                  className={`relative flex shrink-0 items-center gap-2 pb-3 text-sm transition-colors rounded-none bg-transparent hover:bg-transparent px-0 pt-0 h-auto ${
                    activeTab === tab.id
                      ? 'font-semibold text-zinc-950 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs ${
                      activeTab === tab.id
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400'
                    }`}
                  >
                    {tabCounts[tab.id]}
                  </span>
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

            <div className={`pb-3 md:pb-2.5 transition-opacity duration-200 ${
              activeTab === 'my-courses' && !isLoading && enrolledCourses.length > 0
                ? 'opacity-100 pointer-events-auto block'
                : 'opacity-0 pointer-events-none hidden md:block'
            }`}>
              <SortDropdown value={sortKey} onChange={setSortKey} />
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
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">Theo dõi tiến độ</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Tiến độ sẽ được cập nhật rõ hơn khi backend trả dữ liệu học tập thực tế.
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
