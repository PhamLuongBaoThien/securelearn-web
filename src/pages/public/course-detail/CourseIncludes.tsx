// File: CourseIncludes.tsx
// Hiển thị danh sách những gì được bao gồm trong khóa học (sidebar mua hàng).
// Dữ liệu thật: tổng thời lượng video và số bài giảng lấy từ API.
// Dữ liệu tĩnh: truy cập trọn đời, mobile, chứng nhận (backend chưa hỗ trợ).

import { MonitorPlay, Infinity as InfinityIcon, Smartphone, Award } from 'lucide-react';

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
  totalLessons: number;   // Tổng số bài giảng trong khóa học
}

export function CourseIncludes({ totalDuration, totalLessons }: Props) {
  return (
    <div>
      <h4 className="font-bold text-sm mb-3">Khóa học này bao gồm:</h4>
      <div className="space-y-2.5">
        {/* Thời lượng video thật từ API */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MonitorPlay className="w-4 h-4 text-foreground shrink-0" />
          {formatDuration(totalDuration)} video theo yêu cầu
        </div>

        {/* Số bài giảng thật từ API */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MonitorPlay className="w-4 h-4 text-foreground shrink-0 opacity-0" aria-hidden />
          {totalLessons} bài giảng
        </div>

        {/* Các mục cố định — backend chưa có trường tương ứng */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <InfinityIcon className="w-4 h-4 text-foreground shrink-0" />
          Truy cập trọn đời
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Smartphone className="w-4 h-4 text-foreground shrink-0" />
          Truy cập trên mobile và TV
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Award className="w-4 h-4 text-foreground shrink-0" />
          Chứng nhận hoàn thành
        </div>
      </div>
    </div>
  );
}
