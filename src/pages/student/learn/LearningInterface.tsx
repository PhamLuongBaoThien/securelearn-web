import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Menu, X, GraduationCap, ArrowLeft } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { InteractiveTabs } from './InteractiveTabs';
import { CurriculumSidebar, CURRICULUM, ALL_LESSONS } from './CurriculumSidebar';

// ─── Helpers ─────────────────────────────────
function getLessonById(id: string) {
  return ALL_LESSONS.find((l) => l.id === id) ?? ALL_LESSONS[0];
}

function getPrevNext(currentId: string) {
  const idx = ALL_LESSONS.findIndex((l) => l.id === currentId);
  return {
    prev: idx > 0 ? ALL_LESSONS[idx - 1] : null,
    next: idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : null,
  };
}

// ─── Component ────────────────────────────────
export function LearningInterface() {
  const navigate = useNavigate();

  const defaultLesson = ALL_LESSONS.find((l) => l.status === 'active') ?? ALL_LESSONS[0];
  const [activeLessonId, setActiveLessonId] = useState(defaultLesson.id);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeLesson = getLessonById(activeLessonId);
  const { prev, next } = getPrevNext(activeLessonId);

  const currentChapter = CURRICULUM.find((ch) =>
    ch.lessons.some((l) => l.id === activeLessonId)
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 font-sans">

      {/* ── Top Bar ─── */}
      <header className="h-14 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 px-4 shrink-0 z-10">
        {/* Back */}
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <GraduationCap className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />

        {/* Course / lesson title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
            Kiến trúc Microservices & Security Platform
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate hidden sm:block">
            {currentChapter?.title} · {activeLesson.title}
          </p>
        </div>

        {/* Prev / Next */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => prev && setActiveLessonId(prev.id)}
            disabled={!prev || prev.status === 'locked'}
            title="Bài trước"
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => next && setActiveLessonId(next.id)}
            disabled={!next || next.status === 'locked'}
            title="Bài tiếp theo"
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle sidebar */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? 'Ẩn giáo trình' : 'Hiện giáo trình'}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* ── Body ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Video */}
          <VideoPlayer
            key={activeLessonId}
            lessonId={activeLessonId}
            lessonTitle={activeLesson.title}
            lessonMeta={`${currentChapter?.title ?? ''} · Video · ${activeLesson.duration}`}
            watermarkText="Minh Tuấn · minhtuan@email.com"
          />

          {/* Tabs */}
          <div className="flex-1 flex flex-col p-4 min-h-[320px]">
            <InteractiveTabs />
          </div>
        </main>

        {/* Curriculum Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 300 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 38 }}
          className="shrink-0 overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <div className="w-[300px] h-full">
            <CurriculumSidebar
              activeLessonId={activeLessonId}
              onSelectLesson={setActiveLessonId}
            />
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
