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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/app/hooks';
import { useCartActions } from '@/hooks/useCart';
import { useWishlistActions } from '@/hooks/useWishlist';
import { enrollWithSubscription, type ICourse } from '@/services/courseApi';
import { getBestCourseCouponPreview } from '@/services/paymentApi';
import { enrolledKeys } from '@/hooks/useEnrolledCourses';
import { useMySubscription } from '@/hooks/useMySubscription';
import { BadgePercent, CheckCircle2, CreditCard, Heart, GraduationCap, Share2 } from 'lucide-react';

interface Props {
  course: ICourse;     // Dữ liệu khóa học cần hiển thị
  isEnrolled: boolean; // Người dùng đã ghi danh khóa này chưa (kiểm tra từ useEnrolledCourses)
  reportButton?: React.ReactNode;
}

export function CoursePurchaseCard({ course, isEnrolled, reportButton }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addItem, isAdding } = useCartActions();
  const { toggleItem: toggleWishlistItem, isAdding: isSavingWishlist, isRemoving: isRemovingWishlist } = useWishlistActions();
  const user = useAppSelector((state) => state.auth.user);
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép liên kết khóa học vào clipboard!');
  };
  const isOwnCourse = !!user && user.role === 'INSTRUCTOR' && course.instructorId === user._id;
  const { data: subscription } = useMySubscription();
  const hasActiveSubscription = Boolean(subscription?.current);
  const isSubscriptionCourse = course.subscriptionStatus === 'APPROVED';
  const couponPreviewQuery = useQuery({
    queryKey: ['course-coupon-preview', user?._id ?? 'guest', course._id, course.price],
    enabled: !isEnrolled && !isOwnCourse && course.price > 0,
    queryFn: async () => {
      const response = await getBestCourseCouponPreview(course.price);
      if (!response.data) throw new Error(response.message || 'Không thể tải coupon cho khóa học.');
      return response.data;
    },
    staleTime: 60_000,
  });
  const bestCoupon = couponPreviewQuery.data?.coupon ?? null;
  const couponDiscount = bestCoupon?.discountAmount ?? bestCoupon?.discountPreview ?? 0;
  const couponFinalPrice = bestCoupon?.finalAmount ?? Math.max(course.price - couponDiscount, 0);
  const hasCouponPreview = couponDiscount > 0 && couponFinalPrice < course.price;

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
            {isOwnCourse ? (
              // Trường hợp là giảng viên sở hữu khóa học
              <div>
                <div className="mb-6 flex flex-col items-center text-center p-6 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400 mb-3">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-950 dark:text-blue-200 mb-1">
                    Khóa học của bạn
                  </h3>
                  <p className="text-xs text-blue-800/80 dark:text-blue-400/80 max-w-[240px]">
                    Bạn là giảng viên giảng dạy khóa học này. Bạn có quyền xem toàn bộ nội dung học liệu và bài học.
                  </p>
                </div>
                <Button
                  className="w-full py-6 font-bold text-base rounded-lg bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                  onClick={() => navigate(`/student/courses/${course._id}/learn`)}
                >
                  Xem nội dung khóa học
                </Button>
              </div>
            ) : isEnrolled ? (
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
                  {hasCouponPreview ? (
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-3xl font-extrabold tracking-tight">{couponFinalPrice.toLocaleString('vi-VN')} ₫</span>
                        <span className="text-base font-semibold text-muted-foreground line-through">{course.price.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <BadgePercent className="h-4 w-4 shrink-0" />
                        <span className="truncate">Tự áp mã {bestCoupon?.code}, giảm {couponDiscount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {course.price === 0
                          ? 'Miễn phí'
                          : `${course.price.toLocaleString('vi-VN')} ₫`}
                      </span>
                    </div>
                  )}
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

            <div className="mt-5 pt-4 border-t border-border flex flex-col gap-3">
              <Button
                type="button"
                variant="ghost"
                className="w-full py-5 font-bold rounded-lg hover:bg-muted text-sm cursor-pointer flex items-center justify-center"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4 text-muted-foreground" />
                Chia sẻ
              </Button>

              {reportButton && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <span>Bạn thấy nội dung không phù hợp?</span>
                  {reportButton}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






