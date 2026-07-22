// File: CourseHeroBanner.tsx
// Banner phần trên của trang Course Detail — layout Split Hero.
// Bố cục 2 cột: trái = thông tin khóa học, phải = thumbnail lớn bo góc.
// Nền dùng gradient sáng nhẹ, tương thích dark mode.
// Component này nằm sát header nên có padding-top lớn để không bị header che.

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, ShieldCheck, Users, ChevronRight, ImageOff } from 'lucide-react';
import type { ICourse, ICourseCategoryNode, ICourseCategory } from '@/services/courseApi';
import { usePublicCourseCategories } from '@/hooks/usePublicCourseCategories';
import { getPublicInstructorProfile } from '@/services/authApi';

// Map từ giá trị enum level sang nhãn tiếng Việt hiển thị trên UI
const LEVEL_LABEL: Record<ICourse['level'], string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

interface Props {
  course: ICourse; // Toàn bộ dữ liệu khóa học lấy từ API
}

export function CourseHeroBanner({ course }: Props) {
  const { data: categoryTree = [] } = usePublicCourseCategories();

  const { data: publicProfile } = useQuery({
    queryKey: ['public-instructor-profile', course.instructorId],
    queryFn: async () => {
      const response = await getPublicInstructorProfile(course.instructorId);
      return response.data ?? null;
    },
    enabled: Boolean(course.instructorId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const categoryPath = React.useMemo(() => {
    if (!course.category?._id || categoryTree.length === 0) return [];

    const findPath = (targetId: string, nodes: ICourseCategoryNode[]): ICourseCategory[] => {
      for (const node of nodes) {
        if (node._id === targetId) {
          return [
            {
              _id: node._id,
              name: node.name,
              slug: node.slug,
              parentId: node.parentId,
            },
          ];
        }
        if (node.children?.length) {
          const path = findPath(targetId, node.children);
          if (path.length > 0) {
            return [
              {
                _id: node._id,
                name: node.name,
                slug: node.slug,
                parentId: node.parentId,
              },
              ...path,
            ];
          }
        }
      }
      return [];
    };

    return findPath(course.category._id, categoryTree);
  }, [course.category, categoryTree]);

  // Định dạng ngày cập nhật cuối theo locale Việt Nam (mm/yyyy)
  const updatedDate = new Date(course.updatedAt).toLocaleDateString('vi-VN', {
    month: '2-digit',
    year: 'numeric',
  });
  const rating = course.rating ?? 0;
  const reviewCount = course.reviews ?? 0;

  return (
    <div className="relative pt-[120px] pb-10 lg:pt-[136px] lg:pb-14 px-6 overflow-hidden bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-background">
      {/* Subtle decorative background dots */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 max-w-[1340px] mx-auto flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
        {/* Cột trái: thông tin khóa học */}
        <div className="lg:w-7/12 space-y-5">

          {/* Breadcrumb: Khóa học > Danh mục > Tên khóa học */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Link
              to="/courses"
              className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Khóa học
            </Link>
            {categoryPath.map((cat) => (
              <React.Fragment key={cat._id}>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                <Link
                  to={`/courses?category=${cat.slug}`}
                  className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  {cat.name}
                </Link>
              </React.Fragment>
            ))}
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-foreground font-medium truncate max-w-[200px]" title={course.title}>
              {course.title}
            </span>
          </div>

          {/* Tiêu đề chính của trang (h1) */}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight font-serif text-foreground">
            {course.title}
          </h1>

          {/* Mô tả ngắn — chỉ hiện nếu có */}
          {course.shortDescription && (
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {course.shortDescription}
            </p>
          )}

          {/* Hàng thông tin: cấp độ, rating, số học viên */}
          <div className="flex flex-wrap items-center gap-2.5 md:gap-4 text-sm pt-1">
            {/* Badge cấp độ */}
            <div className="bg-[#eceb98] text-yellow-900 px-2.5 py-1 text-xs font-bold rounded-sm">
              {LEVEL_LABEL[course.level]}
            </div>

            {reviewCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 font-bold">{rating.toFixed(1)}</span>
                <div className="flex" aria-label={`${rating.toFixed(1)} sao`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">({reviewCount.toLocaleString('vi-VN')} đánh giá)</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Chưa có đánh giá</span>
            )}

            {/* Số học viên thật từ API */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{course.enrollmentCount.toLocaleString('vi-VN')} học viên</span>
            </div>
          </div>

          {/* Tên giảng viên */}
          <p className="text-sm text-foreground">
            Được tạo bởi{' '}
            {publicProfile?.publicSlug ? (
              <Link
                to={`/users/${publicProfile.publicSlug}`}
                className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                {publicProfile.fullName || course.instructorName}
              </Link>
            ) : (
              <span className="text-primary font-medium">
                {course.instructorName}
              </span>
            )}
          </p>

          {/* Ngày cập nhật và ngôn ngữ */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Cập nhật lần cuối {updatedDate}
            </span>
            <span>• Tiếng Việt</span>
          </div>

        </div>

        {/* Cột phải: Thumbnail với dots trang trí 4 góc */}
        <div className="lg:w-5/12 flex-shrink-0">
          <div className="relative group">
            {/* Dots — góc trên trái */}
            <div className="absolute -top-4 -left-4 w-[51px] h-[51px] opacity-35 dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', backgroundPosition: 'left 3px top 3px' }} />
            {/* Dots — góc trên phải */}
            <div className="absolute -top-4 -right-4 w-[51px] h-[51px] opacity-35 dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', backgroundPosition: 'right 3px top 3px' }} />
            {/* Dots — góc dưới trái */}
            <div className="absolute -bottom-4 -left-4 w-[51px] h-[51px] opacity-35 dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', backgroundPosition: 'left 3px bottom 3px' }} />
            {/* Dots — góc dưới phải */}
            <div className="absolute -bottom-4 -right-4 w-[51px] h-[51px] opacity-35 dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', backgroundPosition: 'right 3px bottom 3px' }} />

            {/* Thumbnail chính */}
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="relative w-full aspect-video object-cover rounded-2xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10 transition-transform duration-300 group-hover:scale-[1.01]"
              />
            ) : (
              <div className="relative w-full aspect-video rounded-2xl bg-secondary flex items-center justify-center shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
                <ImageOff className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Đường gạch chia hero và nội dung — cả light & dark mode */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  );
}
