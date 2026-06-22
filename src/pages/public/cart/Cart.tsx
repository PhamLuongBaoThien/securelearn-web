// ========================
// Cart Page
// Mục đích:
// - hiển thị giỏ hàng mua khóa học và tổng tiền hiện tại
// - cho learner xem coupon khả dụng, tự áp mã tốt nhất hoặc nhập mã thủ công trước checkout
// - lưu snapshot coupon tạm vào sessionStorage; backend vẫn validate lại khi checkout
// ========================
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingCart, ArrowRight, ShieldCheck, BookOpen, CreditCard, CheckCircle2, ChevronRight, Star, Clock, BadgePercent, Sparkles } from 'lucide-react';
import { useCartActions } from '@/hooks/useCart';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getAvailableCourseCoupons, getBestCourseCoupon, validateCourseCoupon, type Coupon, type CouponValidation } from '@/services/paymentApi';

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

const money = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;
const COUPON_STORAGE_KEY = 'sl_course_coupon';

type StoredCoupon = CouponValidation & { source?: 'AUTO' | 'MANUAL' };

const STEPS = [
  { label: 'Giỏ hàng', icon: ShoppingCart },
  { label: 'Thanh toán', icon: CreditCard },
  { label: 'Hoàn tất', icon: CheckCircle2 },
];

const buildCouponValidation = (coupon: Coupon, subtotal: number, source: 'AUTO' | 'MANUAL'): StoredCoupon => ({
  coupon,
  subtotal,
  discountAmount: coupon.discountAmount ?? coupon.discountPreview ?? 0,
  finalAmount: coupon.finalAmount ?? Math.max(subtotal - (coupon.discountAmount ?? coupon.discountPreview ?? 0), 0),
  source,
});

export const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const { removeItem, isRemoving } = useCartActions();
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
  const [couponCode, setCouponCode] = useState(() => {
    try {
      const saved = sessionStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as StoredCoupon).coupon.code : '';
    } catch {
      return '';
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<StoredCoupon | null>(() => {
    try {
      const saved = sessionStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as StoredCoupon) : null;
    } catch {
      return null;
    }
  });

  const discountAmount = appliedCoupon?.subtotal === totalPrice ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(totalPrice - discountAmount, 0);
  const cartSignature = cartItems.map((item) => item._id).sort().join('|');
  const userId = user?._id ?? 'guest';
  const canLoadCoupons = isAuthenticated && cartItems.length > 0;

  const availableCouponsQuery = useQuery({
    queryKey: ['course-coupons', 'available', userId, cartSignature, totalPrice],
    enabled: canLoadCoupons,
    queryFn: async () => {
      const response = await getAvailableCourseCoupons();
      if (!response.data) throw new Error(response.message || 'Không thể tải coupon khả dụng.');
      return response.data;
    },
    staleTime: 30_000,
  });

  const bestCouponQuery = useQuery({
    queryKey: ['course-coupons', 'best', userId, cartSignature, totalPrice],
    enabled: canLoadCoupons && appliedCoupon?.source !== 'MANUAL',
    queryFn: async () => {
      const response = await getBestCourseCoupon();
      if (!response.data) throw new Error(response.message || 'Không thể chọn coupon tốt nhất.');
      return response.data;
    },
    staleTime: 30_000,
  });

  const storeCoupon = (coupon: StoredCoupon) => {
    setAppliedCoupon(coupon);
    setCouponCode(coupon.coupon.code);
    sessionStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    sessionStorage.removeItem(COUPON_STORAGE_KEY);
  };

  useEffect(() => {
    if (!appliedCoupon) return;
    if (!isAuthenticated || appliedCoupon.subtotal !== totalPrice || (appliedCoupon.source === 'AUTO' && userId === 'guest')) {
      const timer = setTimeout(() => {
        clearCoupon();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [appliedCoupon, isAuthenticated, cartSignature, totalPrice]);

  useEffect(() => {
    if (!bestCouponQuery.isSuccess || appliedCoupon?.source === 'MANUAL') return;

    const bestCoupon = bestCouponQuery.data?.coupon;
    if (!bestCoupon) {
      if (appliedCoupon?.source === 'AUTO') {
        const timer = setTimeout(() => {
          clearCoupon();
        }, 0);
        return () => clearTimeout(timer);
      }
      return;
    }

    const nextCoupon = buildCouponValidation(bestCoupon, bestCouponQuery.data.subtotal, 'AUTO');
    if (nextCoupon.discountAmount <= 0) {
      if (appliedCoupon?.source === 'AUTO') {
        const timer = setTimeout(() => {
          clearCoupon();
        }, 0);
        return () => clearTimeout(timer);
      }
      return;
    }
    if (appliedCoupon?.coupon.code === nextCoupon.coupon.code && appliedCoupon.subtotal === nextCoupon.subtotal) return;
    
    const timer = setTimeout(() => {
      storeCoupon(nextCoupon);
    }, 0);
    return () => clearTimeout(timer);
  }, [
    bestCouponQuery.isSuccess,
    bestCouponQuery.data?.coupon,
    bestCouponQuery.data?.subtotal,
    appliedCoupon?.coupon.code,
    appliedCoupon?.source,
    appliedCoupon?.subtotal,
  ]);

  const couponMutation = useMutation({
    mutationFn: validateCourseCoupon,
    onSuccess: (response) => {
      if (!response.data) throw new Error(response.message || 'Không thể áp dụng coupon.');
      storeCoupon({ ...response.data, source: 'MANUAL' });
      toast.success('Đã áp dụng coupon.');
    },
    onError: (error) => {
      clearCoupon();
      toast.error(error instanceof Error ? error.message : 'Mã coupon không hợp lệ.');
    },
  });

  const applyAvailableCoupon = (coupon: Coupon) => {
    storeCoupon(buildCouponValidation(coupon, availableCouponsQuery.data?.subtotal ?? totalPrice, 'MANUAL'));
    toast.success(`Đã áp dụng mã ${coupon.code}.`);
  };

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Bạn cần đăng nhập để thực hiện thanh toán khóa học.', {
        description: 'Đang chuyển hướng bạn đến trang đăng nhập...',
        duration: 3000,
      });
      window.setTimeout(() => {
        navigate('/auth/login', { state: { from: '/checkout' } });
      }, 1500);
      return;
    }
    if (appliedCoupon && appliedCoupon.subtotal !== totalPrice) {
      sessionStorage.removeItem(COUPON_STORAGE_KEY);
    }
    navigate('/checkout');
  };

  const availableCoupons = availableCouponsQuery.data?.coupons ?? [];

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-10 min-h-[60vh]">
      <nav className="flex items-center gap-2 mb-10 animate-fade-in">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === 0;

          return (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />}
              <div className={`checkout-step ${isActive ? 'active' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isActive ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold font-serif">Giỏ hàng</h1>
      </div>

      {cartItems.length === 0 ? (
        /* ── Empty State ── */
        <div className="border border-border py-16 px-6 text-center rounded-2xl bg-card animate-fade-in">
          <div className="inline-block mb-6">
            <svg width="180" height="150" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
              {/* Decorative circles */}
              <circle cx="25" cy="35" r="5" className="fill-blue-400/50 dark:fill-blue-500/30" />
              <circle cx="155" cy="95" r="6" className="fill-rose-400/50 dark:fill-rose-500/30" />
              <circle cx="15" cy="110" r="4" className="fill-amber-400/50 dark:fill-amber-500/30" />
              <circle cx="90" cy="15" r="3" className="fill-emerald-400/50 dark:fill-emerald-500/30" />

              {/* Cart body */}
              <path d="M30 45 L45 45 L55 105 L125 105 L135 55 L50 55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 dark:text-indigo-400" />
              {/* Cart handle */}
              <path d="M20 45 L30 45" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-indigo-500 dark:text-indigo-400" />
              
              {/* Wheel left */}
              <circle cx="70" cy="118" r="8" stroke="currentColor" strokeWidth="3.5" className="text-zinc-700 dark:text-zinc-400" fill="currentColor" />
              {/* Wheel right */}
              <circle cx="112" cy="118" r="8" stroke="currentColor" strokeWidth="3.5" className="text-zinc-700 dark:text-zinc-400" fill="currentColor" />
              
              {/* Dashed lines inside cart */}
              <line x1="65" y1="70" x2="105" y2="70" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" className="text-indigo-200 dark:text-indigo-900/60" />
              <line x1="62" y1="82" x2="110" y2="82" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" className="text-indigo-200 dark:text-indigo-900/60" />
              <line x1="59" y1="94" x2="115" y2="94" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" className="text-indigo-200 dark:text-indigo-900/60" />
              
              {/* Magnifying glass */}
              <circle cx="125" cy="35" r="16" stroke="currentColor" strokeWidth="3" className="text-amber-500 dark:text-amber-400" fill="none" />
              <line x1="136" y1="46" x2="146" y2="56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-amber-500 dark:text-amber-400" />
              
              {/* Question mark inside magnifier */}
              <text x="120" y="41" fontSize="16" fontWeight="extrabold" fill="currentColor" className="text-amber-600 dark:text-amber-500">?</text>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Giỏ hàng đang trống</h2>
          <p className="text-muted-foreground mb-8 text-base max-w-md mx-auto">
            Hãy khám phá những khóa học chất lượng và thêm vào giỏ hàng để bắt đầu hành trình học tập.
          </p>
          <Button
            variant="udemy_dark"
            onClick={() => navigate('/courses')}
            className="font-bold h-12 px-8 rounded-lg text-base gap-2"
          >
            Khám phá khóa học
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              {cartItems.length} khóa học trong giỏ hàng
            </p>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item._id} className="cart-item flex gap-4 p-4 border border-border rounded-xl bg-card hover:shadow-md transition-all duration-200 group">
                  <Link to={`/course/${item.slug}`} className="shrink-0">
                    <img
                      src={item.thumbnail || 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=150&q=80'}
                      alt={item.title}
                      className="w-28 h-[4.5rem] object-cover rounded-lg border border-border group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col min-w-0 pt-0.5">
                    <Link to={`/course/${item.slug}`} className="font-bold text-base hover:text-primary transition-colors line-clamp-1 leading-snug">
                      {item.title}
                    </Link>
                    <span className="text-sm text-muted-foreground mt-0.5">{item.instructorName || 'Hệ thống'}</span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 text-xs text-muted-foreground">
                      {item.rating != null && item.rating > 0 && (
                        <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-500 font-bold mr-0.5">
                          <span>{item.rating.toFixed(1)}</span>
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        </div>
                      )}
                      {item.level && <span>{LEVEL_LABEL[item.level] ?? item.level}</span>}
                      {item.totalLessons != null && item.totalLessons > 0 && <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" />{item.totalLessons} bài học</span>}
                      {item.totalDuration != null && item.totalDuration > 0 && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{formatDuration(item.totalDuration)}</span>}
                    </div>
                    <div className="mt-auto pt-3">
                      <Button variant="ghost" size="sm" disabled={isRemoving} onClick={() => removeItem(item._id)} className="text-xs font-semibold text-destructive hover:text-destructive/90 hover:bg-destructive/5 flex items-center gap-1 transition-colors disabled:opacity-50 h-8 px-2.5 rounded-lg -ml-2">
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </Button>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-start pt-0.5">
                    <span className="font-extrabold text-lg">{money(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="coupons" className="w-full lg:w-[340px] shrink-0 scroll-mt-24">
            <div className="bg-card border border-border rounded-2xl sticky top-24 overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Tổng cộng</h3>
                <div className="mb-5 space-y-3">
                  <div className="flex gap-2">
                    <Input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Mã coupon" className="h-10" />
                    <Button type="button" variant="outline" disabled={couponMutation.isPending || !couponCode.trim() || !isAuthenticated} onClick={() => couponMutation.mutate(couponCode.trim())}>
                      Áp dụng
                    </Button>
                  </div>
                  {!isAuthenticated && <p className="text-xs text-muted-foreground">Đăng nhập để xem và áp dụng coupon khả dụng.</p>}
                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <span className="flex items-center gap-2 font-semibold">
                        {appliedCoupon.source === 'AUTO' ? <Sparkles className="h-4 w-4" /> : <BadgePercent className="h-4 w-4" />}
                        {appliedCoupon.coupon.code}
                        {appliedCoupon.source === 'AUTO' && <span className="text-xs font-medium">Tự chọn tốt nhất</span>}
                      </span>
                      <button type="button" className="font-semibold" onClick={clearCoupon}>Bỏ</button>
                    </div>
                  )}

                  {availableCoupons.length > 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-3 dark:border-zinc-700">
                      <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                        <BadgePercent className="h-4 w-4" /> Coupon khả dụng
                      </div>
                      <div className="space-y-2">
                        {availableCoupons.slice(0, 4).map((coupon) => (
                          <button
                            type="button"
                            key={coupon._id}
                            onClick={() => applyAvailableCoupon(coupon)}
                            className="flex w-full items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-left text-sm hover:border-primary/40 hover:bg-primary/5 dark:border-zinc-800"
                          >
                            <span>
                              <span className="block font-bold">{coupon.code}</span>
                              <span className="block text-xs text-muted-foreground">Giảm {money(coupon.discountPreview ?? coupon.discountAmount ?? 0)}</span>
                            </span>
                            <span className="text-xs font-semibold text-primary">Dùng</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground"><span>Tạm tính</span><span>{money(totalPrice)}</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Giảm giá</span><span>-{money(discountAmount)}</span></div>}
                  <div className="text-4xl font-extrabold tracking-tight">
                    {finalPrice.toLocaleString('vi-VN')}
                    <span className="text-2xl ml-1">₫</span>
                  </div>
                </div>

                <Button variant="udemy_dark" onClick={handleCheckoutClick} className="w-full h-13 font-bold text-base rounded-xl cursor-pointer gap-2">
                  Thanh toán
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="border-t border-border px-6 py-4 flex items-center gap-3 bg-muted/30">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">Thông tin thanh toán của bạn được bảo mật tuyệt đối và xử lý an toàn.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



