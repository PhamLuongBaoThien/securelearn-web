// File: CoursePurchaseCard.tsx
// Sidebar mua hàng nằm bên phải trang Course Detail.
// Tính năng:
//   - Sticky: bám theo viewport khi cuộn xuống, ẩn thumbnail khi đang sticky
//   - Kiểm tra enrollment: nếu đã mua → nút "Vào học ngay", chưa mua → nút mua hàng
//   - Kiểm tra giỏ hàng: nếu đã thêm → nút "Xem giỏ hàng", chưa thêm → "Thêm vào giỏ"
//   - Dispatch action addToCart vào Redux store khi người dùng mua
// Được ghép với CourseIncludes để hiển thị thông tin "Khóa học bao gồm".

import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addToCart } from '@/features/courses/cartSlice';
import type { ICourse } from '@/services/courseApi';
import { CourseIncludes } from './CourseIncludes';

interface Props {
  course: ICourse;     // Dữ liệu khóa học cần hiển thị
  isEnrolled: boolean; // Người dùng đã ghi danh khóa này chưa (kiểm tra từ useEnrolledCourses)
}

export function CoursePurchaseCard({ course, isEnrolled }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Kiểm tra khóa học này đã có trong giỏ hàng Redux chưa
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const isInCart = cartItems.some((item) => item.id === course.slug);

  // Ref cho wrapper ngoài (dùng để đặt z-index và chiều rộng cột)
  const sidebarRef = useRef<HTMLDivElement>(null);
  // Ref cho phần tử sentinel — phần tử vô hình dùng để phát hiện sidebar đang sticky
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Trạng thái sticky: true khi sentinel đã bị cuộn ra khỏi viewport
  const [isSticky, setIsSticky] = useState(false);

  // IntersectionObserver theo dõi sentinel để biết sidebar có đang sticky không.
  // Khi sentinel rời khỏi viewport (cuộn xuống qua) → isSticky = true → ẩn thumbnail.
  // Khi sentinel quay lại viewport (cuộn ngược lên) → isSticky = false → hiện thumbnail.
  // rootMargin: '-88px' là chiều cao của navbar để tính đúng điểm sticky.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-88px 0px 0px 0px' }
    );
    observer.observe(sentinel);

    // Cleanup: ngắt observer khi component unmount
    return () => observer.disconnect();
  }, []);

  // Thêm khóa học vào giỏ hàng Redux
  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: course.slug,          // Dùng slug làm id để Cart link đến /course/:slug đúng
        title: course.title,
        price: course.price,
        thumbnail: course.thumbnail,
        instructor: course.instructorName,
      })
    );
  };

  // Thêm vào giỏ rồi chuyển luôn sang trang giỏ hàng
  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  return (
    <div className="w-full lg:w-1/3 lg:-mt-72 z-20" ref={sidebarRef}>
      {/* Sentinel: phần tử vô hình dùng để phát hiện thời điểm sidebar bắt đầu sticky */}
      <div ref={sentinelRef} className="h-0 w-full" />

      {/* Container sticky — bám theo viewport khi cuộn */}
      <div className="lg:sticky lg:top-[88px]">
        <div className="bg-card w-full shadow-2xl border border-border">

          {/* Thumbnail — ẩn dần (max-h về 0) khi sidebar đang sticky trên desktop */}
          <div
            className={`relative aspect-video bg-black overflow-hidden transition-all duration-300 ease-in-out ${
              isSticky
                ? 'lg:max-h-0 lg:opacity-0 max-h-[300px] opacity-100'
                : 'max-h-[300px] opacity-100'
            }`}
          >
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              // Placeholder khi chưa có thumbnail
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Chưa có ảnh</span>
              </div>
            )}
          </div>

          <div className="p-6">
            {isEnrolled ? (
              // Trường hợp đã ghi danh: hiện thông báo và nút vào học
              <div className="mb-6">
                <div className="mb-3 text-sm text-emerald-600 font-semibold">
                  ✓ Bạn đã sở hữu khóa học này
                </div>
                <Button
                  className="w-full py-6 font-bold text-lg rounded-none"
                  onClick={() => navigate('/my-learning')}
                >
                  Vào học ngay
                </Button>
              </div>
            ) : (
              // Trường hợp chưa mua: hiện giá và nút mua hàng
              <div className="mb-6">
                {/* Hiển thị giá */}
                <div className="mb-4">
                  <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    <span className="text-3xl font-extrabold">
                      {course.price === 0
                        ? 'Miễn phí'
                        : `${course.price.toLocaleString('vi-VN')} ₫`}
                    </span>
                  </div>
                </div>

                {/* Nút hành động: thêm giỏ hoặc xem giỏ nếu đã thêm */}
                <div className="space-y-3">
                  {isInCart ? (
                    <Button
                      variant="outline"
                      className="w-full py-6 font-bold border-foreground rounded-none"
                      onClick={() => navigate('/cart')}
                    >
                      Xem giỏ hàng
                    </Button>
                  ) : (
                    <Button
                      variant="udemy_dark"
                      className="w-full py-6 font-bold text-lg rounded-none"
                      onClick={handleAddToCart}
                    >
                      Thêm vào giỏ hàng
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full py-6 font-bold border-foreground rounded-none"
                    onClick={handleBuyNow}
                  >
                    Mua ngay
                  </Button>
                </div>
              </div>
            )}

            {/* Danh sách những gì khóa học bao gồm */}
            <CourseIncludes
              totalDuration={course.totalDuration}
              totalLessons={course.totalLessons}
            />

            {/* Liên kết phụ: chia sẻ, tặng, coupon */}
            <div className="flex justify-between mt-6 pt-6 border-t font-semibold text-sm underline underline-offset-4 cursor-pointer">
              <span className="hover:text-primary">Chia sẻ</span>
              <span className="hover:text-primary">Tặng bạn bè</span>
              <span className="hover:text-primary">Dùng Coupon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
