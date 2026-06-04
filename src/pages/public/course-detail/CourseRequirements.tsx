// File: CourseRequirements.tsx
// Hiển thị hai phần:
//   1. Danh sách yêu cầu đầu vào của khóa học (requirements[])
//   2. Mô tả chi tiết về khóa học (description — HTML từ rich text editor)
// Mỗi phần chỉ render khi có dữ liệu.
// Lưu ý: description được render bằng dangerouslySetInnerHTML vì backend trả về HTML
// (được nhập từ rich text editor). Dữ liệu đã được validate ở phía instructor nên
// không cần sanitize thêm ở đây.

interface Props {
  requirements: string[];  // Danh sách điều kiện tiên quyết của khóa học
  description?: string;    // Mô tả chi tiết dạng HTML (có thể không có)
}

export function CourseRequirements({ requirements, description }: Props) {
  return (
    <div className="space-y-10">
      {/* Yêu cầu đầu vào — chỉ hiện khi có ít nhất 1 item */}
      {requirements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold font-serif mb-4">Yêu cầu khóa học</h2>
          <ul className="list-disc pl-5 space-y-2">
            {requirements.map((req, i) => (
              <li key={i} className="text-sm md:text-base leading-relaxed">
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mô tả chi tiết dạng HTML — chỉ hiện khi có */}
      {description && (
        <div>
          <h2 className="text-2xl font-bold font-serif mb-4">Mô tả chi tiết</h2>
          <div
            className="prose dark:prose-invert max-w-none text-sm md:text-base"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}
    </div>
  );
}
