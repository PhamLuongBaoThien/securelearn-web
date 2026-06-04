// File: CourseHeroBanner.tsx
// Banner phần trên của trang Course Detail — nền tối (zinc-900).
// Hiển thị: breadcrumb danh mục, tiêu đề khóa học, mô tả ngắn,
// cấp độ, rating mock (4.8 — chờ backend hỗ trợ), số học viên,
// tên giảng viên và ngày cập nhật cuối.
// Component này nằm sát header nên có padding-top lớn để không bị header che.

import { Star, ShieldCheck, Users, ChevronRight } from 'lucide-react';
import type { ICourse } from '@/services/courseApi';

// Map từ giá trị enum level sang nhãn tiếng Việt hiển thị trên UI
const LEVEL_LABEL: Record<ICourse['level'], string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

// Số sao mock — sẽ thay bằng dữ liệu thật khi backend có trường averageRating
const MOCK_RATING = 4.8;

interface Props {
  course: ICourse; // Toàn bộ dữ liệu khóa học lấy từ API
}

export function CourseHeroBanner({ course }: Props) {
  // Định dạng ngày cập nhật cuối theo locale Việt Nam (mm/yyyy)
  const updatedDate = new Date(course.updatedAt).toLocaleDateString('vi-VN', {
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-zinc-900 text-zinc-50 pt-[120px] pb-8 lg:pt-[136px] lg:pb-12 px-6">
      <div className="max-w-[1340px] mx-auto flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 pr-0 lg:pr-10 space-y-4">

          {/* Breadcrumb: Khóa học > Danh mục > Tên khóa học */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-zinc-400">Khóa học</span>
            {course.category && (
              <>
                <ChevronRight className="w-3 h-3 text-zinc-600" />
                <span className="text-zinc-400">{course.category.name}</span>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-200 font-medium truncate max-w-[200px]">
              {course.title}
            </span>
          </div>

          {/* Tiêu đề chính của trang (h1) */}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight font-serif">
            {course.title}
          </h1>

          {/* Mô tả ngắn — chỉ hiện nếu có */}
          {course.shortDescription && (
            <p className="text-lg text-zinc-300 leading-relaxed max-w-3xl">
              {course.shortDescription}
            </p>
          )}

          {/* Hàng thông tin: cấp độ, rating, số học viên */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm pt-1">
            {/* Badge cấp độ */}
            <div className="bg-[#eceb98] text-yellow-900 px-2.5 py-1 text-xs font-bold rounded-sm">
              {LEVEL_LABEL[course.level]}
            </div>

            {/* Rating mock 4.8 — thay bằng dữ liệu thật khi backend hỗ trợ */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#f4c150] font-bold">{MOCK_RATING}</span>
              <div className="flex" aria-label={`${MOCK_RATING} sao`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#f4c150] text-[#f4c150]" />
                ))}
              </div>
            </div>

            {/* Số học viên thật từ API */}
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Users className="w-4 h-4" />
              <span>{course.enrollmentCount.toLocaleString('vi-VN')} học viên</span>
            </div>
          </div>

          {/* Tên giảng viên */}
          <p className="text-sm">
            Được tạo bởi{' '}
            <span className="text-[#c0c4fc] underline cursor-pointer">
              {course.instructorName}
            </span>
          </p>

          {/* Ngày cập nhật và ngôn ngữ */}
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Cập nhật lần cuối {updatedDate}
            </span>
            <span>• Tiếng Việt</span>
          </div>

        </div>
      </div>
    </div>
  );
}
