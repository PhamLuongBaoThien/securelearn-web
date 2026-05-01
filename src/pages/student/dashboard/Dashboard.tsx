import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download } from 'lucide-react';
import { Navbar } from '../../../components/layout/Header';

// ─── Types ───────────────────────────────────
type AccessType = 'lifetime' | 'subscription';
type TabId = 'my-courses' | 'certificates';
type SortKey = 'progress-desc' | 'progress-asc' | 'name-az' | 'recent';

interface EnrolledCourse {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  duration: string;
  accessType: AccessType;
  lastLessonTitle: string;
  lastAccessedAt: number; // timestamp for sorting
}

interface Certificate {
  id: string;
  courseTitle: string;
  instructor: string;
  completedDate: string;
  credentialId: string;
}

// ─── Mock Data ───────────────────────────────
const MOCK_USER = { name: 'Minh Tuấn' };

const ENROLLED_COURSES: EnrolledCourse[] = [
  {
    id: '1',
    title: 'Kiến trúc Microservices & Security Platform',
    instructor: 'Nguyễn Văn Thắng',
    progress: 65,
    totalLessons: 45,
    completedLessons: 29,
    duration: '38h 20m',
    accessType: 'lifetime',
    lastLessonTitle: 'Mã hóa Video HLS (DRM Core)',
    lastAccessedAt: Date.now() - 1000 * 60 * 30, // 30 phút trước
  },
  {
    id: '2',
    title: 'Next.js 14 Full-Stack: Từ Zero đến Production',
    instructor: 'Trần Thị Mai',
    progress: 100,
    totalLessons: 62,
    completedLessons: 62,
    duration: '52h 10m',
    accessType: 'lifetime',
    lastLessonTitle: 'Deploy lên Vercel & CloudFlare',
    lastAccessedAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 ngày trước
  },
  {
    id: '3',
    title: 'DevOps CI/CD Pipeline với Docker & Kubernetes',
    instructor: 'Lê Văn Hùng',
    progress: 23,
    totalLessons: 38,
    completedLessons: 9,
    duration: '29h 45m',
    accessType: 'subscription',
    lastLessonTitle: 'Thiết lập CI/CD với GitHub Actions',
    lastAccessedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 giờ trước
  },
  {
    id: '4',
    title: 'Machine Learning với Python: Thực chiến',
    instructor: 'Phạm Thị Lan',
    progress: 0,
    totalLessons: 55,
    completedLessons: 0,
    duration: '44h 00m',
    accessType: 'subscription',
    lastLessonTitle: 'Giới thiệu Machine Learning',
    lastAccessedAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 ngày trước
  },
];

const CERTIFICATES: Certificate[] = [
  {
    id: 'c1',
    courseTitle: 'Next.js 14 Full-Stack: Từ Zero đến Production',
    instructor: 'Trần Thị Mai',
    completedDate: '20/03/2025',
    credentialId: 'SL-2025-NX14-001234',
  },
];

// ─── Sort options ─────────────────────────────
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Truy cập gần đây' },
  { key: 'progress-desc', label: 'Tiến độ cao nhất' },
  { key: 'progress-asc', label: 'Tiến độ thấp nhất' },
  { key: 'name-az', label: 'Tên A → Z' },
];

function sortCourses(courses: EnrolledCourse[], key: SortKey): EnrolledCourse[] {
  return [...courses].sort((a, b) => {
    switch (key) {
      case 'recent':       return b.lastAccessedAt - a.lastAccessedAt;
      case 'progress-desc': return b.progress - a.progress;
      case 'progress-asc':  return a.progress - b.progress;
      case 'name-az':      return a.title.localeCompare(b.title, 'vi');
    }
  });
}

// ─── Sort Dropdown ────────────────────────────
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
            {/* Backdrop */}
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

// ─── Course Card ──────────────────────────────
function CourseCard({ course, delay }: { course: EnrolledCourse; delay: number }) {
  const navigate = useNavigate();
  const isCompleted = course.progress === 100;
  const isNew = course.progress === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
    >
      {/* Thumbnail */}
      <div className="h-32 bg-zinc-100 dark:bg-zinc-800 relative">
        {/* Access type — subtle top-right label only */}
        <span className="absolute top-3 right-3 text-xs text-zinc-400 dark:text-zinc-500">
          {course.accessType === 'lifetime' ? 'Vĩnh viễn' : 'Thuê bao'}
        </span>
        {/* Progress strip */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-700">
          <motion.div
            className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${course.progress}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-0.5">
          {course.title}
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">{course.instructor}</p>

        {/* Progress */}
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-zinc-400 dark:text-zinc-500">{course.completedLessons}/{course.totalLessons} bài</span>
          <span className={`font-semibold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
            {course.progress}%
          </span>
        </div>
        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
          <motion.div
            className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${course.progress}%` }}
            transition={{ duration: 0.8, delay: delay + 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* CTA */}
        <div className="mt-auto flex gap-2">
          <button
            onClick={() => navigate(`/student/courses/${course.id}/learn`)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              isCompleted
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {isCompleted ? 'Xem lại' : isNew ? 'Bắt đầu' : 'Học tiếp'}
          </button>
          {isCompleted && (
            <button className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700">
              Chứng chỉ
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Certificate Row ──────────────────────────
function CertificateRow({ cert, delay }: { cert: Certificate; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-sm transition-shadow"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1">{cert.courseTitle}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          {cert.instructor} · Cấp ngày {cert.completedDate} · <span className="font-mono">{cert.credentialId}</span>
        </p>
      </div>
      <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
        <Download className="w-3.5 h-3.5" />
        PDF
      </button>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────
export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('my-courses');
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const sortedCourses = useMemo(() => sortCourses(ENROLLED_COURSES, sortKey), [sortKey]);

  const inProgress = ENROLLED_COURSES.filter((c) => c.progress > 0 && c.progress < 100).length;
  const completed  = ENROLLED_COURSES.filter((c) => c.progress === 100).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Xin chào, {MOCK_USER.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Bạn đang học {inProgress} khóa · Đã hoàn thành {completed} khóa · {CERTIFICATES.length} chứng chỉ
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center">
            {([
              { id: 'my-courses' as TabId, label: 'Khóa học', count: ENROLLED_COURSES.length },
              { id: 'certificates' as TabId, label: 'Chứng chỉ', count: CERTIFICATES.length },
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

          {/* Sort — chỉ hiện khi ở tab khóa học */}
          {activeTab === 'my-courses' && (
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {sortedCourses.map((course, i) => (
                <CourseCard key={course.id} course={course} delay={i * 0.04} />
              ))}
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
              {CERTIFICATES.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 py-12 text-center">
                  Chưa có chứng chỉ nào. Hoàn thành 100% một khóa học để nhận chứng chỉ.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {CERTIFICATES.map((cert, i) => (
                    <CertificateRow key={cert.id} cert={cert} delay={i * 0.06} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
