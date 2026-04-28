import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  PlayCircle,
  Lock,
  ChevronRight,
  Clock,
  ChevronDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────
export type LessonStatus = 'completed' | 'active' | 'available' | 'locked';

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  status: LessonStatus;
  type: 'video' | 'pdf';
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

// ─── Mock Curriculum ─────────────────────────
export const CURRICULUM: Chapter[] = [
  {
    id: 'ch1',
    title: 'Chương 1: Nền tảng & Kiến trúc',
    lessons: [
      { id: 'l1', title: 'Giới thiệu về Microservices', duration: '12:30', status: 'completed', type: 'video' },
      { id: 'l2', title: 'Thiết kế API Gateway chống DDoS', duration: '18:45', status: 'completed', type: 'video' },
      { id: 'l3', title: 'Tổng quan nền tảng bảo mật', duration: '08:10', status: 'completed', type: 'pdf' },
    ],
  },
  {
    id: 'ch2',
    title: 'Chương 2: API Gateway & Security',
    lessons: [
      { id: 'l4', title: 'Rate Limiting & Throttling', duration: '22:00', status: 'completed', type: 'video' },
      { id: 'l5', title: 'JWT Authentication Flow', duration: '15:20', status: 'completed', type: 'video' },
      { id: 'l6', title: 'OAuth 2.0 & Social Login', duration: '19:55', status: 'available', type: 'video' },
    ],
  },
  {
    id: 'ch3',
    title: 'Chương 3: DRM & Content Protection',
    lessons: [
      { id: 'l8', title: 'Mã hóa Video HLS (DRM Core)', duration: '25:10', status: 'active', type: 'video' },
      { id: 'l9', title: 'Dynamic Watermarking System', duration: '14:30', status: 'available', type: 'video' },
      { id: 'l10', title: 'Bảo vệ PDF – chặn Download & Copy', duration: '10:00', status: 'locked', type: 'video' },
      { id: 'l11', title: 'Tích hợp CDN & Token URL', duration: '20:15', status: 'locked', type: 'video' },
    ],
  },
  {
    id: 'ch4',
    title: 'Chương 4: Progress Tracking',
    lessons: [
      { id: 'l12', title: 'Heartbeat Service Architecture', duration: '40:00', status: 'locked', type: 'video' },
      { id: 'l13', title: 'Redis & Session Management', duration: '28:00', status: 'locked', type: 'video' },
    ],
  },
  {
    id: 'ch5',
    title: 'Chương 5: Deploy & Production',
    lessons: [
      { id: 'l15', title: 'Docker & Container Setup', duration: '35:00', status: 'locked', type: 'video' },
      { id: 'l16', title: 'Kubernetes Orchestration', duration: '42:00', status: 'locked', type: 'video' },
      { id: 'l17', title: 'CI/CD Pipeline & Monitoring', duration: '30:00', status: 'locked', type: 'video' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────
export const ALL_LESSONS = CURRICULUM.flatMap((ch) => ch.lessons);

function getTotalStats() {
  const total = ALL_LESSONS.length;
  const completed = ALL_LESSONS.filter((l) => l.status === 'completed').length;
  return { total, completed, percent: Math.round((completed / total) * 100) };
}

function StatusIcon({ status }: { status: LessonStatus }) {
  if (status === 'completed')
    return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (status === 'active')
    return <PlayCircle className="w-4 h-4 text-primary shrink-0" />;
  if (status === 'locked')
    return <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />;
  return <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0" />;
}

// ─── Component ────────────────────────────────
interface CurriculumSidebarProps {
  activeLessonId: string;
  onSelectLesson: (id: string) => void;
}

export function CurriculumSidebar({ activeLessonId, onSelectLesson }: CurriculumSidebarProps) {
  const stats = getTotalStats();

  const defaultOpen = CURRICULUM.find((ch) =>
    ch.lessons.some((l) => l.id === activeLessonId)
  )?.id;
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    new Set(defaultOpen ? [defaultOpen] : [CURRICULUM[0].id])
  );

  const toggle = (id: string) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Nội dung khóa học</h3>
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
          <span>{stats.completed}/{stats.total} bài</span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{stats.percent}%</span>
        </div>
        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stats.percent}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </div>

      {/* Chapters */}
      <div className="flex-1 overflow-y-auto">
        {CURRICULUM.map((chapter) => {
          const isOpen = openChapters.has(chapter.id);
          const chCompleted = chapter.lessons.filter((l) => l.status === 'completed').length;

          return (
            <div key={chapter.id} className="border-b border-zinc-100 dark:border-zinc-800/70">
              {/* Chapter header */}
              <button
                onClick={() => toggle(chapter.id)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
              >
                <motion.span
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="shrink-0"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                </motion.span>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 leading-snug line-clamp-2">
                    {chapter.title}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {chCompleted}/{chapter.lessons.length} bài
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Lessons */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    {chapter.lessons.map((lesson) => {
                      const isActive = lesson.id === activeLessonId;
                      const isLocked = lesson.status === 'locked';

                      return (
                        <button
                          key={lesson.id}
                          disabled={isLocked}
                          onClick={() => !isLocked && onSelectLesson(lesson.id)}
                          className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors border-l-2 ${
                            isActive
                              ? 'bg-primary/5 border-l-primary'
                              : isLocked
                              ? 'opacity-40 cursor-not-allowed border-l-transparent'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-transparent'
                          }`}
                        >
                          <div className="mt-0.5">
                            <StatusIcon status={isActive ? 'active' : lesson.status} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug line-clamp-2 ${isActive ? 'text-primary font-medium' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-zinc-400" />
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">{lesson.duration}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
