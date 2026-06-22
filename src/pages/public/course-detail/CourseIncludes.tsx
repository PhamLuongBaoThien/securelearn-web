// File: CourseIncludes.tsx
// Hiển thị danh sách những gì được bao gồm trong khóa học ở main content.

import {
  PlayCircle,
  BookOpen,
  HelpCircle,
  Download,
  Infinity,
  Smartphone,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Chuyển đổi tổng số giây thành chuỗi giờ/phút dễ đọc.
// Ví dụ: 3900 giây → "1 giờ 5 phút"
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours} giờ ${minutes} phút`;
  if (hours > 0) return `${hours} giờ`;
  return `${minutes} phút`;
}

interface Props {
  totalDuration: number;  // Tổng thời lượng video tính bằng giây
  totalLessons: number;   // Tổng số bài học trong khóa học, gồm cả video và quiz
  totalQuizzes?: number;  // Tổng số bài kiểm tra
  totalDocuments?: number; // Tổng số tài liệu tải xuống
}

interface IncludeItem {
  text: string;
  icon: LucideIcon;
}

export function CourseIncludes({ totalDuration, totalLessons, totalQuizzes = 0, totalDocuments = 0 }: Props) {
  const videoLessonCount = Math.max(totalLessons - totalQuizzes, 0);
  const items: IncludeItem[] = ([
    {
      text: `${formatDuration(totalDuration)} video theo yêu cầu`,
      icon: PlayCircle,
    },
    {
      text: totalQuizzes > 0 ? `${videoLessonCount} bài giảng video` : `${totalLessons} bài học`,
      icon: BookOpen,
    },
    totalQuizzes > 0 ? {
      text: `${totalQuizzes} bài kiểm tra`,
      icon: HelpCircle,
    } : null,
    totalDocuments > 0 ? {
      text: `${totalDocuments} tài liệu có thể tải xuống`,
      icon: Download,
    } : null,
    {
      text: 'Truy cập trọn đời khi mua đứt',
      icon: Infinity,
    },
    {
      text: 'Truy cập trên mobile và TV',
      icon: Smartphone,
    },
    {
      text: 'Chứng nhận hoàn thành',
      icon: Trophy,
    },
  ].filter((item): item is IncludeItem => item !== null));

  return (
    <section className="rounded-lg border border-border bg-card p-6 lg:p-7 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tổng quan quyền lợi
        </p>
        <h2 className="text-2xl font-bold font-serif">Khóa học bao gồm</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ text, icon: Icon }) => (
          <div
            key={text}
            className="flex items-center gap-3 rounded-md bg-secondary/40 px-4 py-3 text-sm font-medium text-foreground/90 transition-all hover:bg-secondary/60 hover:translate-x-0.5"
          >
            <Icon className="w-4 h-4 shrink-0 text-primary" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}


