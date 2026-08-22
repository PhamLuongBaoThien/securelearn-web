// Thành phần giao diện: CurriculumSidebar thuộc trang học khóa học của người học (route: /student/courses/:courseId/learn).
// [SIDEBAR GIÁO TRÌNH & TIẾN ĐỘ - BƯỚC 1]
// Component hiển thị danh sách chương học (Sections) và bài học (Lessons).
// Vai trò chính:
// 1. Hiển thị trực quan cấu trúc giáo trình dạng cây (thu gọn/mở rộng từng chương).
// 2. Map dữ liệu tiến độ (progressByLessonId) và quyền truy cập (accessByLessonId) của từng bài học.
// 3. Biểu diễn trạng thái của từng bài học bằng icon trực quan: khóa (Lock), hoàn thành (Check), đang học (Highlight), chưa học (Play/Help).
// 4. Vô hiệu hóa (disable) sự kiện click đối với các bài học chưa được mở khóa.

import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Clock, HelpCircle, Lock, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ILesson, ISection } from '@/services/courseApi';
import type { LessonAccessSummary, LessonProgressSummary } from '@/services/progressApi';

const formatDuration = (seconds = 0) => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} phút`;
};

const normalizeLockedReason = (reason?: string) => {
  if (!reason) return 'Hoàn thành bài trước để tiếp tục.';
  if (reason.includes('mở quiz')) return 'Hoàn thành các bài trước trong phần này để mở quiz.';
  if (reason.includes('mở bài này')) return 'Hoàn thành bài trước để mở bài học này.';
  return reason;
};

interface CurriculumSidebarProps {
  sections: ISection[];
  activeLessonId: string;
  progressByLessonId?: Record<string, LessonProgressSummary>;
  accessByLessonId?: Record<string, LessonAccessSummary>;
  onSelectLesson: (lesson: ILesson) => void;
}

export function CurriculumSidebar({
  sections,
  activeLessonId,
  progressByLessonId = {},
  accessByLessonId = {},
  onSelectLesson,
}: CurriculumSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Nội dung khóa học</h2>
          <p className="mt-1 text-xs text-zinc-500">{totalLessons} bài học</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sections.map((section, sectionIndex) => {
            const sectionKey = section._id || String(sectionIndex);
            const isCollapsed = collapsed[sectionKey];
            return (
              <section key={sectionKey} className="border-b border-zinc-200/80 dark:border-zinc-800/80">
                <Button
                  type="button"
                  onClick={() => setCollapsed((current) => ({ ...current, [sectionKey]: !isCollapsed }))}
                  variant="ghost"
                  className="h-auto w-full justify-between items-start gap-3 rounded-none px-4 py-3 text-left bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-zinc-900/80 dark:hover:bg-zinc-800/90 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs md:text-sm font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 leading-snug break-words line-clamp-2 cursor-pointer">
                          {section.title}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="end" collisionPadding={16} className="max-w-[300px] break-words">
                        <p className="font-semibold text-xs leading-relaxed">{section.title}</p>
                      </TooltipContent>
                    </Tooltip>
                    <p className="mt-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{section.lessons.length} bài học</p>
                  </div>
                  {isCollapsed ? <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-zinc-500 dark:text-zinc-400" /> : <ChevronDown className="h-4 w-4 shrink-0 mt-0.5 text-zinc-500 dark:text-zinc-400" />}
                </Button>

                {!isCollapsed && (
                  <div className="pb-2">
                    {section.lessons.map((lesson, lessonIndex) => {
                      const lessonId = lesson._id || `${sectionKey}-${lessonIndex}`;
                      const isActive = lessonId === activeLessonId;
                      const progress = progressByLessonId[lessonId];
                      const isCompleted = progress?.status === 'COMPLETED';
                      const access = accessByLessonId[lessonId];
                      const isLocked = Boolean(access?.locked);

                      // [BẢO MẬT GIAO DIỆN - BƯỚC 1]
                      // Xác định nhãn trạng thái dựa trên các cờ: Khóa, Đã hoàn thành hoặc Đang học
                      const statusLabel = isLocked
                        ? 'Đang khóa'
                        : isCompleted
                          ? 'Đã hoàn thành'
                          : isActive
                            ? 'Đang học'
                            : 'Sẵn sàng học';

                      // Xác định mô tả chi tiết: Hiển thị lý do khóa, phần trăm đã xem hoặc trạng thái quiz
                      const detailLabel = isLocked
                        ? normalizeLockedReason(access?.reason)
                        : isCompleted
                          ? 'Bạn đã hoàn thành bài học này.'
                          : lesson.type === 'VIDEO'
                            ? progress?.watchPercent
                              ? `${progress.watchPercent}% đã xem · ${formatDuration(lesson.duration)}`
                              : formatDuration(lesson.duration)
                            : 'Bài kiểm tra sẵn sàng bắt đầu.';
                      return (
                        // [BẢO MẬT GIAO DIỆN - BƯỚC 1]
                        // Nếu bài học bị khóa (isLocked === true), thuộc tính 'disabled' được kích hoạt
                        // để chặn người dùng click gọi hàm onSelectLesson. Class CSS cũng đổi sang 'cursor-not-allowed opacity-60'.
                        <Button
                          key={lessonId}
                          type="button"
                          onClick={() => onSelectLesson(lesson)}
                          disabled={isLocked}
                          variant="ghost"
                          className={`h-auto w-full justify-start items-start gap-3 rounded-none px-4 py-3 text-left transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary border-l-2 border-primary'
                              : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
                          } ${isLocked ? 'cursor-not-allowed opacity-60 hover:bg-transparent dark:hover:bg-transparent' : ''}`}
                        >
                          {/* Hiển thị icon tương ứng với trạng thái bảo mật/tiến độ của bài học */}
                          {isLocked ? (
                            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          ) : lesson.type === 'VIDEO' ? (
                            <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          )}

                          <div className="min-w-0 flex-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className={`text-sm font-medium leading-snug break-words line-clamp-2 cursor-pointer ${
                                  isActive ? 'font-semibold text-primary' : 'text-zinc-900 dark:text-zinc-100'
                                }`}>
                                  {lesson.title}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="end" collisionPadding={16} className="max-w-[300px] break-words">
                                <p className="font-normal text-xs leading-relaxed">{lesson.title}</p>
                              </TooltipContent>
                            </Tooltip>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 transition-colors ${
                                isLocked
                                  ? 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                  : isCompleted
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : isActive
                                      ? 'bg-primary/15 text-primary'
                                      : 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                              }`}>
                                {statusLabel}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 min-w-0">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span className="truncate">{detailLabel}</span>
                              </span>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
