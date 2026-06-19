import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector } from '@/app/hooks';
import { useCourseLearning } from '@/hooks/useCourseLearning';
import { useCourseAccess, useCourseProgress } from '@/hooks/useLearningProgress';
import { Button } from '@/components/ui/button';
import type { ILesson } from '@/services/courseApi';
import type { LessonProgressSummary } from '@/services/progressApi';
import logoWeb from '@/assets/logoweb.png';
import { CurriculumSidebar } from './CurriculumSidebar';
import { VideoPlayer } from './VideoPlayer';
import { InteractiveTabs } from './InteractiveTabs';
import { QuizPlayer } from './QuizPlayer';

const RESUME_GAP_THRESHOLD_SECONDS = 2;

const getResumePositionSeconds = (lesson: ILesson | undefined, lessonProgress?: LessonProgressSummary) => {
  if (!lesson || lesson.type !== 'VIDEO' || !lessonProgress) {
    return lessonProgress?.lastPositionSeconds || 0;
  }

  const durationSeconds = Math.max(0, Math.floor(lesson.duration || 0));
  const watchedSegments = [...(lessonProgress.watchedSegments || [])]
    .map((segment) => ({
      start: Math.max(0, Math.floor(segment.start)),
      end: Math.max(0, Math.floor(segment.end)),
    }))
    .filter((segment) => segment.end > segment.start)
    .sort((a, b) => a.start - b.start);

  if (watchedSegments.length === 0) {
    return lessonProgress.lastPositionSeconds || 0;
  }

  let cursor = 0;
  for (const segment of watchedSegments) {
    if (segment.start - cursor >= RESUME_GAP_THRESHOLD_SECONDS) {
      return cursor;
    }
    cursor = Math.max(cursor, segment.end);
  }

  if (durationSeconds > 0 && durationSeconds - cursor >= RESUME_GAP_THRESHOLD_SECONDS) {
    return cursor;
  }

  return lessonProgress.lastPositionSeconds || 0;
};

export function LearningInterface() {
  const navigate = useNavigate();
  const { courseId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const courseQuery = useCourseLearning(courseId);
  const progressQuery = useCourseProgress(courseId);
  const accessQuery = useCourseAccess(courseId);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [pauseSignal, setPauseSignal] = useState(0);

  const lessons = useMemo(
    () => (courseQuery.data?.sections || []).flatMap((section) => section.lessons),
    [courseQuery.data?.sections],
  );

  const requestedLessonId = searchParams.get('lessonId') || '';
  const accessByLessonId = accessQuery.data?.lessons || {};
  const requestedOrStoredLessonId = selectedLessonId || requestedLessonId || progressQuery.data?.course.lastLessonId || lessons[0]?._id || '';
  const firstUnlockedLesson = lessons.find((lesson) => !accessByLessonId[lesson._id || '']?.locked) || lessons[0];
  const activeLessonId = accessByLessonId[requestedOrStoredLessonId]?.locked
    ? firstUnlockedLesson?._id || ''
    : requestedOrStoredLessonId;
  const activeIndex = lessons.findIndex((lesson) => lesson._id === activeLessonId);
  const activeLesson = activeIndex >= 0 ? lessons[activeIndex] : lessons[0];
  const activeLessonProgress = progressQuery.data?.lessons[activeLesson?._id || ''];
  const initialPositionSeconds = getResumePositionSeconds(activeLesson, activeLessonProgress);
  const currentSection = courseQuery.data?.sections.find((section) =>
    section.lessons.some((lesson) => lesson._id === activeLesson?._id),
  );
  const previousLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  const selectLesson = (lesson: ILesson) => {
    const lessonId = lesson._id || '';
    const access = accessByLessonId[lessonId];
    if (access?.locked) {
      toast.info(access.reason || 'Bài học này đang bị khóa.');
      return;
    }
    setSelectedLessonId(lessonId);
    if (lessonId) setSearchParams({ lessonId }, { replace: true });
    setPlaybackTime(0);
  };

  if (courseQuery.isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (courseQuery.error || !courseQuery.data) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <p className="text-lg font-semibold">Không thể mở khóa học</p>
        <p className="mt-2 text-sm text-zinc-400">{(courseQuery.error as Error)?.message || 'Bạn không còn quyền truy cập.'}</p>
        <Button variant="link" className="mt-5 text-sm text-primary" onClick={() => navigate('/student/dashboard')}>
          Quay lại khóa học của tôi
        </Button>
      </div>
    );
  }

  const course = courseQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 text-zinc-900 dark:bg-[#0A0A0A] dark:text-zinc-100">
      <header className="z-10 flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <Button
          onClick={() => navigate('/student/dashboard')}
          variant="ghost"
          size="sm"
          className="h-9 gap-2 px-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <img src={logoWeb} alt="SecureLearn" className="h-8 w-auto object-contain" />
        </Button>
        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{course.title}</p>
          <p className="hidden truncate text-xs text-zinc-400 sm:block">
            {currentSection?.title}{activeLesson ? ` · ${activeLesson.title}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            onClick={() => previousLesson && selectLesson(previousLesson)}
            disabled={!previousLesson}
            title="Bài trước"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => nextLesson && selectLesson(nextLesson)}
            disabled={!nextLesson}
            title="Bài tiếp theo"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => setSidebarOpen((current) => !current)}
          title={sidebarOpen ? 'Ẩn giáo trình' : 'Hiện giáo trình'}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-y-auto">
          {activeLesson?.type === 'VIDEO' ? (
            <VideoPlayer
              key={`video-${activeLesson._id}`}
              courseId={courseId}
              lesson={activeLesson}
              watermarkIdentity={user ? { email: user.email, userId: user._id } : undefined}
              onTimeChange={setPlaybackTime}
              initialPositionSeconds={initialPositionSeconds}
              pauseSignal={pauseSignal}
            />
          ) : activeLesson ? (
            <QuizPlayer
              key={`quiz-${activeLesson._id}`}
              courseId={courseId}
              lesson={activeLesson}
              access={accessByLessonId[activeLesson._id || '']}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-zinc-950 text-sm text-zinc-400">
              Khóa học chưa có nội dung.
            </div>
          )}

          {activeLesson && (
            <InteractiveTabs
              key={`tabs-${activeLesson._id}`}
              course={course}
              lesson={activeLesson}
              playbackTime={playbackTime}
              onRequestPauseVideo={() => setPauseSignal((current) => current + 1)}
            />
          )}
        </main>

        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 320 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 38 }}
          className="shrink-0 overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <div className="h-full w-[320px]">
            <CurriculumSidebar
              sections={course.sections}
              activeLessonId={activeLesson?._id || ''}
              progressByLessonId={progressQuery.data?.lessons || {}}
              accessByLessonId={accessByLessonId}
              onSelectLesson={selectLesson}
            />
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
