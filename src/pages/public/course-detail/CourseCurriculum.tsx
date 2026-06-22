// File: CourseCurriculum.tsx
// Hiển thị toàn bộ nội dung chương trình học của khóa học dưới dạng accordion.
// Mỗi section (chương) là một hàng có thể bấm để mở/đóng,
// bên trong hiển thị danh sách các bài học.
// Mặc định: chỉ mở section đầu tiên, các section còn lại đóng.
// Nếu có nhiều hơn 5 section thì ẩn bớt, có nút "Hiển thị thêm" để xem tất cả.

import { useState } from 'react';
import { ChevronDown, PlayCircle, ClipboardList, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ISection, ILesson } from '@/services/courseApi';

// Số section hiển thị ban đầu trước khi người dùng bấm "Hiển thị thêm"
const INITIAL_VISIBLE_SECTIONS = 5;

// Chuyển giây thành chuỗi mm:ss để hiển thị thời lượng từng bài học.
// Ví dụ: 185 giây → "3:05"
// Trả về chuỗi rỗng nếu không có dữ liệu.
function formatLessonDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Tính tổng thời lượng của một section dựa trên thời lượng các lesson.
// Trả về chuỗi "X giờ Y phút" hoặc "Y phút", hoặc rỗng nếu không có dữ liệu.
function formatSectionDuration(lessons: ILesson[]): string {
  const totalSeconds = lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0);
  if (totalSeconds === 0) return '';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h} giờ ${m} phút`;
  return `${m} phút`;
}

interface LessonRowProps {
  lesson: ILesson; // Dữ liệu một bài học
}

// Hiển thị một hàng bài học trong danh sách của section.
// Icon khác nhau tùy loại bài (VIDEO dùng PlayCircle, QUIZ dùng ClipboardList).
// Bài có isFreePreview = true hiển thị badge "Xem trước".
// Bài chưa mở khóa hiển thị icon ổ khóa.
function LessonRow({ lesson }: LessonRowProps) {
  const isVideo = lesson.type === 'VIDEO';
  const duration = formatLessonDuration(lesson.duration);

  return (
    <div className="flex items-center justify-between py-2.5 px-4 text-sm">
      <span className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon loại bài học */}
        {isVideo ? (
          <PlayCircle className="w-4 h-4 shrink-0 text-muted-foreground" />
        ) : (
          <ClipboardList className="w-4 h-4 shrink-0 text-muted-foreground" />
        )}

        {/* Tên bài học */}
        <span className="truncate text-foreground">{lesson.title}</span>

        {/* Badge xem trước nếu bài có isFreePreview = true */}
        {lesson.isFreePreview && (
          <span className="ml-1 shrink-0 text-xs text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded">
            Xem trước
          </span>
        )}

        {/* Icon khóa cho các bài không được xem trước */}
        {!lesson.isFreePreview && (
          <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50 ml-auto" />
        )}
      </span>

      {/* Thời lượng bài học — chỉ hiện nếu có */}
      {duration && (
        <span className="text-muted-foreground ml-3 shrink-0 text-xs">{duration}</span>
      )}
    </div>
  );
}

interface SectionAccordionProps {
  section: ISection;    // Dữ liệu một chương học (section)
  defaultOpen: boolean; // Trạng thái mở/đóng ban đầu
}

// Accordion của một chương học. Click vào header để mở/đóng danh sách bài học.
// Hiển thị tiêu đề section, số bài học và tổng thời lượng.
function SectionAccordion({ section, defaultOpen }: SectionAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionDuration = formatSectionDuration(section.lessons);

  return (
    <div className="border-b border-border last:border-0">
      {/* Header section — click để toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-secondary/40 hover:bg-secondary/60 transition-colors text-left"
      >
        <span className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mũi tên xoay khi mở/đóng */}
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform text-muted-foreground ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
          <span className="font-semibold text-sm truncate">
            {section.title}
          </span>
        </span>

        {/* Số bài + thời lượng — ẩn trên mobile nhỏ */}
        <span className="text-xs font-normal text-muted-foreground ml-4 shrink-0 hidden sm:block">
          {section.lessons.length} bài học
          {sectionDuration && ` • ${sectionDuration}`}
        </span>
      </button>

      {/* Danh sách bài học — chỉ render khi isOpen = true */}
      {isOpen && (
        <div className="bg-background">
          {section.lessons.map((lesson, i) => (
            <LessonRow key={lesson._id ?? i} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  sections: ISection[];  // Danh sách các chương học
  totalDuration: number; // Tổng thời lượng toàn khóa học (giây)
  totalLessons: number;  // Tổng số bài học toàn khóa học
}

// Component chính — hiển thị tiêu đề, tổng quan, danh sách section và nút "Hiển thị thêm".
export function CourseCurriculum({ sections, totalDuration, totalLessons }: Props) {
  // Trạng thái để ẩn/hiện tất cả section (mặc định chỉ hiện INITIAL_VISIBLE_SECTIONS section)
  const [showAll, setShowAll] = useState(false);

  if (sections.length === 0) return null;

  // Tổng thời lượng hiển thị ở dòng tóm tắt phía trên
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMinutes = Math.floor((totalDuration % 3600) / 60);
  const durationLabel =
    totalHours > 0
      ? `${totalHours} giờ ${totalMinutes} phút`
      : `${totalMinutes} phút`;

  // Section sẽ render: tất cả hoặc chỉ N section đầu tiên
  const visibleSections = showAll
    ? sections
    : sections.slice(0, INITIAL_VISIBLE_SECTIONS);

  return (
    <div>
      <h2 className="text-2xl font-bold font-serif mb-2">Nội dung khóa học</h2>

      {/* Dòng tóm tắt tổng quan */}
      <p className="text-sm text-muted-foreground mb-5">
        {sections.length} phần • {totalLessons} bài học • Tổng thời lượng {durationLabel}
      </p>

      {/* Danh sách accordion */}
      <div className="border border-border">
        {visibleSections.map((section, idx) => (
          <SectionAccordion
            key={section._id ?? idx}
            section={section}
            defaultOpen={idx === 0} // Mặc định chỉ mở section đầu tiên
          />
        ))}
      </div>

      {/* Nút hiện/ẩn section thừa — chỉ hiện khi tổng số section > INITIAL_VISIBLE_SECTIONS */}
      {sections.length > INITIAL_VISIBLE_SECTIONS && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            className="rounded-none border-foreground font-semibold"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? 'Thu gọn'
              : `Hiển thị thêm ${sections.length - INITIAL_VISIBLE_SECTIONS} phần`}
          </Button>
        </div>
      )}
    </div>
  );
}

