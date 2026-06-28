import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Star, Clock, BookOpen, Check, GraduationCap, Heart, BadgePercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoverCard } from '@/components/animations/HoverCard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { enrollWithSubscription, type ICourse } from '@/services/courseApi';
import { useAppSelector } from '@/app/hooks';
import { useCartActions } from '@/hooks/useCart';
import { useWishlistActions } from '@/hooks/useWishlist';
import { enrolledKeys, useEnrolledCourses } from '@/hooks/useEnrolledCourses';
import { useMySubscription } from '@/hooks/useMySubscription';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getBestCourseCouponPreview, type BestCouponResponse } from '@/services/paymentApi';
import { getPublicInstructorProfile } from '@/services/authApi';

// ── Helpers ───────────────────────────────────────────────────────────────────
const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

// ── Component ─────────────────────────────────────────────────────────────────
type CourseCardProps = {
  course: ICourse;
  mode?: 'default' | 'subscription';
  couponPreview?: BestCouponResponse | null;
  disableCouponPreviewFetch?: boolean;
  isEnrolledOverride?: boolean;
};

export const CourseCard = ({ course, mode = 'default', couponPreview, disableCouponPreviewFetch = false, isEnrolledOverride }: CourseCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const user = useAppSelector((state) => state.auth.user);
  const isInCart = cartItems.some((item) => item._id === course._id);
  const isInWishlist = wishlist.some((item) => item._id === course._id);
  const { addItem, isAdding } = useCartActions();
  const { toggleItem: toggleWishlistItem, isAdding: isSavingWishlist, isRemoving: isRemovingWishlist } = useWishlistActions();
  const hasLearningPoints = Array.isArray(course.whatYouWillLearn) && course.whatYouWillLearn.length > 0;
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

  // Kiểm tra đã ghi danh chưa — dùng lại cache từ useEnrolledCourses (không gây thêm request)
  const isAuthenticated = Boolean(user);
  const { data: enrolledCourses = [] } = useEnrolledCourses();
  const resolvedIsEnrolled = isAuthenticated && enrolledCourses.some((e) => e.courseId === course._id);
  const isEnrolled = isEnrolledOverride ?? resolvedIsEnrolled;
  const isOwnCourse = isAuthenticated && user && user.role === 'INSTRUCTOR' && course.instructorId === user._id;
  const instructorProfileQuery = useQuery({
    queryKey: ['public-instructor-profile', course.instructorId],
    queryFn: async () => {
      const response = await getPublicInstructorProfile(course.instructorId);
      return response.data ?? null;
    },
    enabled: Boolean(course.instructorId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const { data: subscription } = useMySubscription();
  const hasActiveSubscription = Boolean(subscription?.current);
  const canUseSubscription = mode === 'subscription' && course.subscriptionStatus === 'APPROVED';
  const couponPreviewQuery = useQuery({
    queryKey: ['course-coupon-preview', user?._id ?? 'guest', course._id, course.price],
    enabled: !disableCouponPreviewFetch && couponPreview === undefined && mode === 'default' && !isEnrolled && !isOwnCourse && course.price > 0,
    queryFn: async () => {
      const response = await getBestCourseCouponPreview(course.price);
      if (!response.data) throw new Error(response.message || 'Không thể tải coupon cho khóa học.');
      return response.data;
    },
    staleTime: 60_000,
  });
  const resolvedCouponPreview = couponPreview !== undefined ? couponPreview : couponPreviewQuery.data;
  const bestCoupon = resolvedCouponPreview?.coupon ?? null;
  const couponDiscount = bestCoupon?.discountAmount ?? bestCoupon?.discountPreview ?? 0;
  const couponFinalPrice = bestCoupon?.finalAmount ?? Math.max(course.price - couponDiscount, 0);
  const hasCouponPreview = couponDiscount > 0 && couponFinalPrice < course.price;
  const subscriptionEnrollMutation = useMutation({
    mutationFn: async () => {
      const response = await enrollWithSubscription(course._id);
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể mở khóa học bằng thuê bao.');
      }
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: enrolledKeys.all });
      toast.success('Đã mở khóa học bằng gói thuê bao.');
      navigate('/student/dashboard');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể mở khóa học bằng thuê bao.');
    },
  });

  const cardContent = (
    <HoverCard className="group flex flex-col h-full cursor-pointer bg-zinc-50 dark:bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail — bọc trong Link */}
      <div className="relative w-full aspect-video overflow-hidden bg-secondary shrink-0">
        <Link to={`/course/${course.slug}`} className="block h-full w-full">
          {/* Badge thông thường (Bestseller, ...) — chỉ hiện khi chưa enrolled */}
          {!isEnrolled && course.badge && (
            <div className="absolute top-2 left-2 bg-[#eceb98] text-yellow-900 text-xs font-bold px-2 py-1 rounded-sm z-10 shadow-sm">
              {course.badge}
            </div>
          )}

          {/* Badge "Đã sở hữu" — overlay thumbnail, không chiếm chiều cao card */}
          {isEnrolled && (
            <div className="absolute top-0 left-0 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600/90 to-emerald-500/80 backdrop-blur-sm z-20">
              <GraduationCap className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="text-white text-xs font-semibold tracking-wide">Đã sở hữu</span>
            </div>
          )}

          {/* Badge "Khóa học của bạn" — overlay thumbnail */}
          {isOwnCourse && (
            <div className="absolute top-0 left-0 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600/90 to-blue-500/80 backdrop-blur-sm z-20">
              <GraduationCap className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="text-white text-xs font-semibold tracking-wide">Khóa học của bạn</span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
              <BookOpen className="w-10 h-10 text-zinc-500" />
            </div>
          )}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={isInWishlist ? 'Bỏ khỏi danh sách mong muốn' : 'Lưu vào danh sách mong muốn'}
          className={cn(
            "absolute right-2 top-2 z-30 h-9 w-9 text-white transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:bg-transparent hover:text-white active:bg-transparent",
            isInWishlist
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlistItem(wishlistItem, isInWishlist);
          }}
          disabled={isSavingWishlist || isRemovingWishlist}
        >
          <Heart
            className={cn(
              "h-5 w-5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] transition-colors",
              isInWishlist ? 'fill-rose-500 text-rose-500' : 'text-white'
            )}
          />
        </Button>
      </div>

      {/* Info area */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title */}
        <Link to={`/course/${course.slug}`}>
          <h3 className="font-bold text-base leading-snug line-clamp-2 mb-0.5 text-foreground">
            {course.title}
          </h3>
        </Link>

        {/* Instructor */}
        {instructorProfileQuery.data?.publicSlug ? <Link to={'/users/' + instructorProfileQuery.data.publicSlug} className="mb-1.5 line-clamp-1 text-sm text-muted-foreground hover:text-primary hover:underline" onClick={(event) => event.stopPropagation()}>{course.instructorName}</Link> : <p className="mb-1.5 line-clamp-1 text-sm text-muted-foreground">{course.instructorName}</p>}

        {/* Rating (chỉ hiển thị khi có data) */}
        {course.rating != null && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-amber-600 font-bold text-sm leading-none">{course.rating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i <= Math.round(course.rating!)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-muted-foreground fill-none'
                  }`}
                />
              ))}
            </div>
            {course.reviews != null && course.reviews > 0 && (
              <span className="text-xs text-muted-foreground">({course.reviews.toLocaleString()})</span>
            )}
          </div>
        )}

        {/* Stats: level + duration + lessons */}
        {(course.level || course.totalDuration || course.totalLessons) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-2 text-xs text-muted-foreground">
            {course.level && (
              <span>{LEVEL_LABEL[course.level] ?? course.level}</span>
            )}
            {course.level && (course.totalDuration || course.totalLessons) && (
              <span className="text-border">•</span>
            )}
            {course.totalDuration != null && course.totalDuration > 0 && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {formatDuration(course.totalDuration)}
              </span>
            )}
            {course.totalLessons != null && course.totalLessons > 0 && (
              <span className="flex items-center gap-0.5">
                <BookOpen className="w-3 h-3" />
                {course.totalLessons} bài học
              </span>
            )}
          </div>
        )}

        {/* Price row — ẩn khi đã enrolled để không hiển thị giá gây nhầm lẫn */}
        <div className="flex flex-col justify-start min-h-[3.5rem] mb-3 mt-auto">
          {isOwnCourse ? (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Bạn là giảng viên khóa học này
            </span>
          ) : isEnrolled ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Tiếp tục học khoá học
            </span>
          ) : canUseSubscription ? (
            <span className="text-xs text-primary font-medium">
              {hasActiveSubscription ? 'Dùng gói hiện tại để mở khóa học này' : 'Khóa học này nằm trong catalog thuê bao'}
            </span>
          ) : hasCouponPreview ? (
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-bold text-base text-foreground">{couponFinalPrice.toLocaleString('vi-VN')} ₫</span>
                <span className="text-xs text-muted-foreground line-through">{course.price.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                <BadgePercent className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-[10px]">{bestCoupon?.code} giảm {couponDiscount.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base text-foreground">
                {course.price === 0 ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')} ₫`}
              </span>
              {course.originalPrice != null && (
                <span className="text-xs text-muted-foreground line-through">
                  {course.originalPrice.toLocaleString('vi-VN')} ₫
                </span>
              )}
            </div>
          )}
        </div>

        {/* CTA Button — luôn 1 nút duy nhất, cùng height cho mọi card */}
        <div className="opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 ease-out">
          {isOwnCourse ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-sm font-bold border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-500/60 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/student/courses/${course._id}/learn`);
              }}
            >
              Xem nội dung khóa học
            </Button>
          ) : isEnrolled ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-sm font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/60 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                navigate('/student/dashboard');
              }}
            >
              Vào học ngay
            </Button>
          ) : canUseSubscription ? (
            <Button
              variant={hasActiveSubscription ? 'default' : 'outline'}
              size="sm"
              className="w-full rounded-sm font-bold"
              onClick={(e) => {
                e.preventDefault();
                if (!isAuthenticated) {
                  navigate('/auth/login', { state: { from: location.pathname } });
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
                ? (subscriptionEnrollMutation.isPending ? 'Đang mở khóa...' : 'Học bằng thuê bao')
                : 'Mua gói'}
            </Button>
          ) : (
            <Button
              variant="udemy_outline"
              size="sm"
              className="w-full rounded-sm font-bold"
              onClick={(e) => {
                e.preventDefault();
                if (isInCart) return;
                addItem({
                ...wishlistItem,
              });
              }}
              disabled={isInCart || isAdding}
            >
              {isInCart ? 'Đã có trong giỏ' : isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </Button>
          )}
        </div>
      </div>
    </HoverCard>
  );

  if (!hasLearningPoints) {
    return cardContent;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {cardContent}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={15}
        className="w-80 p-5 shadow-xl pointer-events-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hidden md:block"
      >
        <h4 className="font-bold text-sm mb-3 text-zinc-900 dark:text-zinc-50">
          Những gì bạn sẽ học được:
        </h4>
        <ul className="space-y-2.5">
          {course.whatYouWillLearn?.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};









