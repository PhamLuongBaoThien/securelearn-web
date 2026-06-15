import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, HelpCircle, PlayCircle } from 'lucide-react';
import type { ILesson, ISection } from '@/services/courseApi';

const formatDuration = (seconds = 0) => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} phút`;
};

interface CurriculumSidebarProps {
  sections: ISection[];
  activeLessonId: string;
  onSelectLesson: (lesson: ILesson) => void;
}

export function CurriculumSidebar({
  sections,
  activeLessonId,
  onSelectLesson,
}: CurriculumSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);

  return (
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
            <section key={sectionKey} className="border-b border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setCollapsed((current) => ({ ...current, [sectionKey]: !isCollapsed }))}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{section.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{section.lessons.length} bài</p>
                </div>
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {!isCollapsed && (
                <div className="pb-2">
                  {section.lessons.map((lesson, lessonIndex) => {
                    const lessonId = lesson._id || `${sectionKey}-${lessonIndex}`;
                    const isActive = lessonId === activeLessonId;
                    return (
                      <button
                        key={lessonId}
                        type="button"
                        onClick={() => onSelectLesson(lesson)}
                        className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {lesson.type === 'VIDEO'
                          ? <PlayCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          : <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{lesson.title}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                            <Clock className="h-3 w-3" />
                            {lesson.type === 'VIDEO' ? formatDuration(lesson.duration) : 'Bài kiểm tra'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
