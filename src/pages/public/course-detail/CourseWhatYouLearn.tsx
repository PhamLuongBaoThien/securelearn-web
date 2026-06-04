// File: CourseWhatYouLearn.tsx
// Hiển thị danh sách những gì học viên sẽ học được sau khi hoàn thành khóa học.
// Dữ liệu lấy từ trường whatYouWillLearn[] của ICourse.
// Nếu danh sách rỗng thì không render gì cả (return null).

import { Check } from 'lucide-react';

interface Props {
  items: string[]; // Danh sách nội dung sẽ học, mỗi phần tử là một chuỗi mô tả
}

export function CourseWhatYouLearn({ items }: Props) {
  // Không render nếu không có dữ liệu
  if (items.length === 0) return null;

  return (
    <div className="border border-border p-6 lg:p-8 bg-card shadow-sm">
      <h2 className="text-2xl font-bold font-serif mb-6">Bạn sẽ học được gì</h2>

      {/* Grid 2 cột trên màn hình md trở lên, 1 cột trên mobile */}
      <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 items-start">
            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span className="text-sm leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
