import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, BookOpen, Clock, AlertCircle, GraduationCap, ArrowRight } from 'lucide-react';
import { Navbar } from '../../../components/layout/Header';
import { useEnrolledCourses, type EnrolledCourseItem } from '../../../hooks/useEnrolledCourses';
import { useAppSelector } from '../../../app/hooks';

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId = 'my-courses' | 'certificates';
type SortKey = 'recent' | 'name-az';

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Ghi danh gần đây' },
  { key: 'name-az', label: 'Tên A → Z' },
];

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

function sortCourses(courses: EnrolledCourseItem[], key: SortKey): EnrolledCourseItem[] {
  return [...courses].sort((a, b) => {
    switch (key) {
      case 'recent': return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
      case 'name-az': return a.title.localeCompare(b.title, 'vi');
    }
  });
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.key === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
      >
        <span>{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1.5 z-20 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden"
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { onChange(opt.key); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    opt.key === value
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function CourseCardSkeleton({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse"
    >
      <div className="h-32 bg-zinc-100 dark:bg-zinc-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded mt-4" />
      </div>
    </motion.div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, delay }: { course: EnrolledCourseItem; delay: number }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
    >
      {/* Thumbnail */}
      <div className="h-32 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
          </div>
        )}
        {/* Level badge */}
        {course.level && (
          <span className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
            {LEVEL_LABEL[course.level] ?? course.level}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-0.5">
          {course.title}
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">{course.instructorName}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500 mb-4">
          {course.totalLessons > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {course.totalLessons} bài
            </span>
          )}
          {course.totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(course.totalDuration)}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto">
          <button
            onClick={() => navigate(`/student/courses/${course.courseId}/learn`)}
            className="w-full py-2 rounded-lg text-xs font-medium transition-colors bg-primary text-primary-foreground hover:opacity-90"
          >
            Học tiếp
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyEnrolled() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center gap-4"
    >
      <GraduationCap className="w-14 h-14 text-zinc-300 dark:text-zinc-600" />
      <p className="text-lg font-semibold text-zinc-900 dark:text-white">
        Bạn chưa ghi danh khóa học nào
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
        Khám phá hàng trăm khóa học chất lượng cao và bắt đầu hành trình học tập ngay hôm nay.
      </p>
      <Link
        to="/courses"
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Khám phá khóa học <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('my-courses');
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const user = useAppSelector((state) => state.auth.user);
  const firstName = user?.fullName?.split(' ').pop() ?? 'bạn';

  const { data: enrolledCourses = [], isLoading, isError } = useEnrolledCourses();

  const sortedCourses = useMemo(
    () => sortCourses(enrolledCourses, sortKey),
    [enrolledCourses, sortKey]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Xin chào, {firstName} 👋
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isLoading
              ? 'Đang tải khóa học của bạn...'
              : `Bạn đã ghi danh ${enrolledCourses.length} khóa học`}
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center">
            {([
              { id: 'my-courses' as TabId, label: 'Khóa học của tôi', count: enrolledCourses.length },
              { id: 'certificates' as TabId, label: 'Chứng chỉ', count: 0 },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-1 pb-3 mr-6 text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-zinc-900 dark:text-white font-medium'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
                <span className="text-xs text-zinc-400">{tab.count}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'my-courses' && !isLoading && enrolledCourses.length > 0 && (
            <div className="pb-3">
              <SortDropdown value={sortKey} onChange={setSortKey} />
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'my-courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Error */}
              {isError && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Không thể tải danh sách khóa học. Vui lòng thử lại.
                  </p>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CourseCardSkeleton key={i} delay={i * 0.06} />
                  ))}
                </div>
              )}

              {/* Empty */}
              {!isLoading && !isError && enrolledCourses.length === 0 && <EmptyEnrolled />}

              {/* Grid */}
              {!isLoading && !isError && sortedCourses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sortedCourses.map((course, i) => (
                    <CourseCard key={course.enrollmentId} course={course} delay={i * 0.04} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'certificates' && (
            <motion.div
              key="certs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <Download className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Chứng chỉ sẽ hiển thị ở đây sau khi bạn hoàn thành 100% một khóa học.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
