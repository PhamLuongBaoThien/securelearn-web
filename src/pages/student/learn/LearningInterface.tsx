// [GIAO DIỆN HỌC TẬP CHÍNH - BƯỚC 1]
// Component cha điều phối màn hình học tập của học viên.
// Vai trò chính:
// 1. Quản lý trạng thái giao diện học tập: chọn bài học (selectedLessonId), ẩn/hiện sidebar giáo trình, đồng bộ theme sáng/tối.
// 2. Đồng bộ các hooks dữ liệu (Curriculum từ course-service, Tiến độ học tập & Mở khóa tuần tự từ progress-service).
// 3. Tự động kiểm tra quyền truy cập bài học và chuyển hướng bảo mật nếu học viên cố tình vào các bài học bị khóa.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Menu, X, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { toggleTheme } from '@/features/dashboard/uiSlice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCourseLearning } from '@/hooks/useCourseLearning';
import { useCourseAccess, useCourseProgress, useLearnerActivity } from '@/hooks/useLearningProgress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StreakGoalWidget } from '@/components/student/StreakGoalWidget';
import type { ILesson } from '@/services/courseApi';
import type { LessonProgressSummary } from '@/services/progressApi';
import logoWeb from '@/assets/logoweb.png';
import { CurriculumSidebar } from './CurriculumSidebar';
import { VideoPlayer } from './VideoPlayer';
import { InteractiveTabs, type LearningTabId } from './InteractiveTabs';
import { QuizPlayer } from './QuizPlayer';

// Tạo hình tròn để hiển thị tiến độ học tập: 
// PROGRESS_RING_SIZE: Kích thước của hình tròn
// PROGRESS_RING_STROKE: Độ dày của đường tròn
// PROGRESS_RING_RADIUS: Bán kính của hình tròn
// PROGRESS_RING_CIRCUMFERENCE: Chu vi của hình tròn
const PROGRESS_RING_SIZE = 32;
const PROGRESS_RING_STROKE = 3;
const PROGRESS_RING_RADIUS = (PROGRESS_RING_SIZE - PROGRESS_RING_STROKE) / 2;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

// Component hiển thị tiến độ học tập
const ProgressRing: React.FC<{ percent: number; completedLessons: number; totalLessons: number }> = ({
  percent,
  completedLessons,
  totalLessons,
}) => {
  const offset = PROGRESS_RING_CIRCUMFERENCE - (Math.min(100, Math.max(0, percent)) / 100) * PROGRESS_RING_CIRCUMFERENCE;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative flex h-8 w-8 shrink-0 cursor-default items-center justify-center">
            <svg width={PROGRESS_RING_SIZE} height={PROGRESS_RING_SIZE} className="-rotate-90">
              <circle
                cx={PROGRESS_RING_SIZE / 2}
                cy={PROGRESS_RING_SIZE / 2}
                r={PROGRESS_RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={PROGRESS_RING_STROKE}
                className="text-zinc-200 dark:text-zinc-700"
              />
              <circle
                cx={PROGRESS_RING_SIZE / 2}
                cy={PROGRESS_RING_SIZE / 2}
                r={PROGRESS_RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={PROGRESS_RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
                strokeDashoffset={offset}
                className="text-emerald-500 transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-200">
              {Math.round(percent)}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="rounded-xl">
          <p className="text-xs font-semibold">Tiến độ khóa học</p>
          <p className="mt-1 text-xs">{completedLessons} / {totalLessons} bài học đã hoàn thành</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Kiểm tra xem có nên tiếp tục bài học từ vị trí trước đó hay không
const RESUME_GAP_THRESHOLD_SECONDS = 2;

// Lấy vị trí tiếp tục bài học từ lessonProgress:
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
  // Lấy courseId từ dynamic parameter của URL route (/student/courses/:courseId/learn)
  const { courseId = '' } = useParams();
  
  // Quản lý lessonId đang học trên query parameters của trình duyệt (?lessonId=xxxx)
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  
  // [ĐỒNG BỘ DỮ LIỆU - BƯỚC 1]
  // Gọi đồng thời các API qua React Query để tải: thông tin giáo trình, tiến độ thực tế,
  // danh sách quyền mở khóa của từng bài học và streak hoạt động học tập hàng ngày.
  
  // hook useCourseLearning để tải thông tin của khóa học hiện tại 
  const courseQuery = useCourseLearning(courseId);
  // hook useCourseProgress để tải tiến độ của học viên trong khóa học hiện tại
  const progressQuery = useCourseProgress(courseId);
  // hook useCourseAccess để tải danh sách quyền mở khóa của từng bài học trong khóa học hiện tại
  const accessQuery = useCourseAccess(courseId);
  // hook useLearnerActivity để tải hoạt động học tập hàng ngày của học viên
  const activityQuery = useLearnerActivity();
  
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [pauseSignal, setPauseSignal] = useState(0);
  const [activeInteractionTab, setActiveInteractionTab] = useState<LearningTabId>('overview');
  const [openNotesSignal, setOpenNotesSignal] = useState(0);
  const lastLockedToastLessonIdRef = useRef('');

  // Làm phẳng danh sách Section thành mảng tất cả các Lesson để dễ dàng duyệt qua lại (Prev/Next)
  const lessons = useMemo(
    () => (courseQuery.data?.sections || []).flatMap((section) => section.lessons),
    [courseQuery.data?.sections],
  );

  // [BẢO MẬT ĐỊNH TUYẾN - BƯỚC 1]
  // Lấy lessonId được yêu cầu từ URL query (?lessonId=xxx)
  const requestedLessonId = searchParams.get('lessonId') || '';
  const accessByLessonId = accessQuery.data?.lessons || {};
  
  // Xác định ID bài học mục tiêu: Ưu tiên state hiện tại -> URL query -> Bài học học dở lần trước -> Bài học đầu tiên
  const requestedOrStoredLessonId = selectedLessonId || requestedLessonId || progressQuery.data?.course.lastLessonId || lessons[0]?._id || '';
  
  // Tìm bài học đầu tiên trong giáo trình không bị khóa để làm điểm fallback
  const firstUnlockedLesson = lessons.find((lesson) => !accessByLessonId[lesson._id || '']?.locked) || lessons[0];
  
  // Nếu bài học mục tiêu bị khóa (do progressionMode tuần tự), hệ thống TỰ ĐỘNG CHUYỂN HƯỚNG bảo mật về bài học chưa khóa đầu tiên
  const activeLessonId = accessByLessonId[requestedOrStoredLessonId]?.locked
    ? firstUnlockedLesson?._id || ''
    : requestedOrStoredLessonId;
    
  const activeIndex = lessons.findIndex((lesson) => lesson._id === activeLessonId);
  const activeLesson = activeIndex >= 0 ? lessons[activeIndex] : lessons[0];
  const activeLessonProgress = progressQuery.data?.lessons[activeLesson?._id || ''];
  
  // Lấy mốc thời gian xem gần đây nhất của video để tự động phát tiếp tục (Resume Position)
  const initialPositionSeconds = getResumePositionSeconds(activeLesson, activeLessonProgress);
  const currentSection = courseQuery.data?.sections.find((section) =>
    section.lessons.some((lesson) => lesson._id === activeLesson?._id),
  );
  const previousLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  useEffect(() => {
    if (!requestedLessonId) {
      lastLockedToastLessonIdRef.current = '';
      return;
    }
    const requestedAccess = accessByLessonId[requestedLessonId];
    if (!requestedAccess?.locked) {
      if (lastLockedToastLessonIdRef.current === requestedLessonId) {
        lastLockedToastLessonIdRef.current = '';
      }
      return;
    }
    if (lastLockedToastLessonIdRef.current === requestedLessonId) return;
    lastLockedToastLessonIdRef.current = requestedLessonId;
    toast.info(requestedAccess.reason || 'Bài học này đang bị khóa. Hãy hoàn thành bài trước để tiếp tục.');
  }, [accessByLessonId, requestedLessonId]);

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
    setActiveInteractionTab('overview');
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
        <div className="flex items-center gap-2">
          <StreakGoalWidget activity={activityQuery.data} isLoading={activityQuery.isLoading} variant="compact" />
          <ProgressRing
            percent={progressQuery.data?.course.progressPercent ?? 0}
            completedLessons={progressQuery.data?.course.completedLessons ?? 0}
            totalLessons={progressQuery.data?.course.totalLessons ?? 0}
          />

          <DropdownMenu>
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <DropdownMenuTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                      {theme === 'light' && <Sun className="h-4 w-4 text-amber-500" />}
                      {theme === 'dark' && <Moon className="h-4 w-4 text-blue-400" />}
                      {theme === 'system' && <Monitor className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />}
                    </Button>
                  </TooltipTrigger>
                </DropdownMenuTrigger>
                <TooltipContent side="bottom" className="rounded-xl">
                  <p className="text-xs font-semibold">Giao diện: {theme === 'light' ? 'Sáng' : theme === 'dark' ? 'Tối' : 'Hệ thống'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="rounded-xl border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
              <DropdownMenuItem
                onClick={() => dispatch(toggleTheme('light'))}
                className={`rounded-lg cursor-pointer flex items-center gap-2 ${theme === 'light' ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white' : ''}`}
              >
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Giao diện sáng</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => dispatch(toggleTheme('dark'))}
                className={`rounded-lg cursor-pointer flex items-center gap-2 ${theme === 'dark' ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white' : ''}`}
              >
                <Moon className="h-4 w-4 text-blue-400" />
                <span>Giao diện tối</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => dispatch(toggleTheme('system'))}
                className={`rounded-lg cursor-pointer flex items-center gap-2 ${theme === 'system' ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white' : ''}`}
              >
                <Monitor className="h-4 w-4 text-zinc-500" />
                <span>Mặc định hệ thống</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
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
              onOpenNotes={(timestampSeconds) => {
                setPlaybackTime(timestampSeconds);
                setActiveInteractionTab('notes');
                setOpenNotesSignal((current) => current + 1);
              }}
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
              activeTab={activeInteractionTab}
              onActiveTabChange={setActiveInteractionTab}
              openNotesSignal={openNotesSignal}
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

