// File: CourseInstructor.tsx
// Hiển thị thông tin giảng viên của khóa học.
// Vì API chưa có endpoint lấy profile đầy đủ của instructor,
// nên hiện tại chỉ dùng instructorName và enrollmentCount từ ICourse.
// Avatar được tạo từ 2 chữ cái đầu của tên giảng viên.

import { GraduationCap, Users } from 'lucide-react';

interface Props {
  instructorName: string;   // Tên giảng viên lấy từ ICourse.instructorName
  enrollmentCount: number;  // Tổng số học viên của khóa học (dùng làm thống kê)
}

export function CourseInstructor({ instructorName, enrollmentCount }: Props) {
  // Tạo chữ viết tắt từ tên: lấy ký tự đầu của tối đa 2 từ rồi viết hoa.
  // Ví dụ: "Nguyễn Văn An" → "NV"
  const initials = instructorName
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div>
      <h2 className="text-2xl font-bold font-serif mb-6">Giảng viên</h2>
      <div className="flex items-start gap-5">
        {/* Avatar placeholder — hiển thị chữ viết tắt thay vì ảnh */}
        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-primary">{initials}</span>
        </div>

        {/* Thông tin giảng viên */}
        <div>
          <h3 className="text-lg font-bold text-primary hover:underline cursor-pointer">
            {instructorName}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">Giảng viên khóa học</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              Giảng viên được xác minh
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {enrollmentCount.toLocaleString('vi-VN')} học viên
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
