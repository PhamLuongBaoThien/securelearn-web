// File: CoursePurchaseCard.tsx
// Sidebar mua hàng nằm bên phải trang Course Detail.
// Tính năng:
//   - Sticky: bám theo viewport khi cuộn xuống, ẩn thumbnail khi đang sticky
//   - Kiểm tra enrollment: nếu đã mua → nút "Vào học ngay", chưa mua → nút mua hàng
//   - Kiểm tra giỏ hàng: nếu đã thêm → nút "Xem giỏ hàng", chưa thêm → "Thêm vào giỏ"
//   - Dispatch action addToCart vào Redux store khi người dùng mua
// Phần "Khóa học bao gồm" nằm ở main content để học viên đọc trước curriculum.

import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/app/hooks';
import { useCartActions } from '@/hooks/useCart';
import { useWishlistActions } from '@/hooks/useWishlist';
import { enrollWithSubscription, type ICourse } from '@/services/courseApi';
import { enrolledKeys } from '@/hooks/useEnrolledCourses';
import { useMySubscription } from '@/hooks/useMySubscription';
import { CheckCircle2, CreditCard, Heart } from 'lucide-react';

interface Props {
  course: ICourse;     // Dữ liệu khóa học cần hiển thị
  isEnrolled: boolean; // Người dùng đã ghi danh khóa này chưa (kiểm tra từ useEnrolledCourses)
}

export function CoursePurchaseCard({ course, isEnrolled }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addItem, isAdding } = useCartActions();
  const { toggleItem: toggleWishlistItem, isAdding: isSavingWishlist, isRemoving: isRemovingWishlist } = useWishlistActions();
  const user = useAppSelector((state) => state.auth.user);
  const { data: subscription } = useMySubscription();
  const hasActiveSubscription = Boolean(subscription?.current);
  const isSubscriptionCourse = course.subscriptionStatus === 'APPROVED';

  // Kiểm tra khóa học này đã có trong giỏ hàng Redux chưa
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const isInCart = cartItems.some((item) => item._id === course._id);
  const isInWishlist = wishlist.some((item) => item._id === course._id);
  const wishlistItem = {
    _id: course._id,
    slug: course.slug,
    title: course.title,
    price: course.price,
    thumbnail: course.thumbnail,
    instructorName: course.instructorName,
    level: course.level,
    totalLessons: course.totalLessons,
    totalDuration: course.totalDuration,
    rating: course.rating,
  };
  const subscriptionEnrollMutation = useMutation({
    mutationFn: async () => {
      const response = await enrollWithSubscription(course._id);
      if (response.status === 'ERR') throw new Error(response.message || 'Không thể mở khóa học bằng thuê bao.');
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: enrolledKeys.all });
      toast.success('Bạn đã có thể vào học bằng gói thuê bao.');
      navigate('/student/dashboard');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể mở khóa học bằng thuê bao.'),
  });

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
    addItem({
      ...wishlistItem,
    });
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
        <div className="bg-card w-full shadow-xl border border-border rounded-lg overflow-hidden">

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

          <div className="p-5 lg:p-6">
            {isEnrolled ? (
              // Trường hợp đã ghi danh: hiện thông báo và nút vào học
              <div>
                <div className="mb-4 flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="font-semibold">Bạn đã sở hữu khóa học này</span>
                </div>
                <Button
                  className="w-full py-6 font-bold text-base rounded-lg"
                  onClick={() => navigate('/student/dashboard')}
                >
                  Vào học ngay
                </Button>
              </div>
            ) : (
              // Trường hợp chưa mua: hiện giá và nút mua hàng
              <div>
                {/* Hiển thị giá */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Mua riêng khóa học
                  </p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {course.price === 0
                        ? 'Miễn phí'
                        : `${course.price.toLocaleString('vi-VN')} ₫`}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sở hữu khóa học này với quyền truy cập trọn đời.
                  </p>
                </div>

                {/* Nút hành động: thêm giỏ hoặc xem giỏ nếu đã thêm */}
                <div className="space-y-3">
                  {isInCart ? (
                    <Button
                      variant="outline"
                      className="w-full py-6 font-bold rounded-lg"
                      onClick={() => navigate('/cart')}
                    >
                      Xem giỏ hàng
                    </Button>
                  ) : (
                    <Button
                      className="w-full py-6 font-bold text-base rounded-lg"
                      onClick={handleAddToCart}
                      disabled={isAdding}
                    >
                      {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full py-6 font-bold rounded-lg"
                    onClick={handleBuyNow}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Mua ngay
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full py-6 font-bold rounded-lg border border-transparent hover:border-border"
                    onClick={() => toggleWishlistItem(wishlistItem, isInWishlist)}
                    disabled={isSavingWishlist || isRemovingWishlist}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isInWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                    {isInWishlist ? 'Đã lưu' : 'Lưu vào danh sách mong muốn'}
                  </Button>

                  {isSubscriptionCourse && (
                    <>
                      <div className="flex items-center gap-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <span className="h-px flex-1 bg-border" />
                        <span>hoặc</span>
                        <span className="h-px flex-1 bg-border" />
                      </div>

                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div className="mb-3">
                          <p className="font-bold">Học bằng gói thuê bao</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Mở khóa khóa học này cùng catalog thuê bao nếu gói của bạn còn hiệu lực.
                          </p>
                        </div>
                        <Button
                          variant={hasActiveSubscription ? 'default' : 'outline'}
                          className="w-full py-6 font-bold rounded-lg"
                          onClick={() => {
                            if (!user) {
                              navigate('/auth/login', { state: { from: `/course/${course.slug}` } });
                              return;
                            }
                            if (!hasActiveSubscription) {
                              navigate('/pricing');
                              return;
                            }
                            subscriptionEnrollMutation.mutate();
                          }}
                          disabled={subscriptionEnrollMutation.isPending}
                        >
                          {hasActiveSubscription
                            ? (subscriptionEnrollMutation.isPending ? 'Đang mở quyền học...' : 'Dùng gói để vào học')
                            : 'Xem các gói học'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Liên kết phụ: chia sẻ, tặng, coupon */}
            <div className="flex flex-wrap justify-between gap-3 mt-6 pt-5 border-t text-sm font-semibold text-muted-foreground">
              <span className="hover:text-primary cursor-pointer">Chia sẻ</span>
              <span className="hover:text-primary cursor-pointer">Tặng bạn bè</span>
              <span className="hover:text-primary cursor-pointer">Dùng Coupon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
