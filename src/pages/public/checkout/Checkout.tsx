// Trang/giao diện: Triển khai trang xác nhận và khởi tạo thanh toán (route: /checkout).
// ========================
// Checkout Page
// Mục đích:
// - cho learner chọn cổng thanh toán và tạo checkout session
// - đọc coupon đã áp ở Cart để hiển thị discount và gửi couponCode lên payment-service
// ========================
import { useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, ShoppingCart, CreditCard, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/app/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createCourseCheckout, getBestCourseCouponPreview, type CouponValidation, type PaymentMethod, type PaymentProvider } from '@/services/paymentApi';
import { getBuyNowItem } from '@/services/cartApi';
import { toast } from 'sonner';

import momoLogo from '@/assets/Logo-MoMo.webp';
import vnpayLogo from '@/assets/vnpay-logo.jpg';

const COUPON_STORAGE_KEY = 'sl_course_coupon';

const providerForMethod = (method: PaymentMethod): PaymentProvider =>
  method === 'MOMO' ? 'MOMO' : 'VNPAY';

const STEPS = [
  { label: 'Giỏ hàng', icon: ShoppingCart },
  { label: 'Thanh toán', icon: CreditCard },
  { label: 'Hoàn tất', icon: CheckCircle2 },
];

export const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VNPAY');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const checkoutLockRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isBuyNow = searchParams.get('mode') === 'buy-now';
  const courseId = searchParams.get('courseId')?.trim() || '';

  const buyNowQuery = useQuery({
    queryKey: ['buy-now-item', courseId],
    enabled: authResolved && isAuthenticated && isBuyNow && Boolean(courseId),
    queryFn: async () => {
      const response = await getBuyNowItem(courseId);
      if (response.code === 'COURSE_ALREADY_OWNED') {
        return { item: null, alreadyOwned: true, slug: response.data?.slug || '' };
      }
      if (response.status === 'ERR' || !response.data?.item) {
        throw new Error(response.message || 'Khóa học không thể mua ngay.');
      }
      return { item: response.data.item, alreadyOwned: false };
    },
    retry: false,
  });


  const checkoutItems = useMemo(
    () => isBuyNow ? (buyNowQuery.data?.item ? [buyNowQuery.data.item] : []) : cartItems,
    [isBuyNow, buyNowQuery.data?.item, cartItems],
  );
  const totalPrice = useMemo(() => checkoutItems.reduce((sum, item) => sum + item.price, 0), [checkoutItems]);

  const storedCartCoupon = useMemo<CouponValidation | null>(() => {
    if (isBuyNow) return null;
    try {
      const saved = sessionStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CouponValidation) : null;
    } catch {
      return null;
    }
  }, [isBuyNow]);

  const buyNowCouponQuery = useQuery({
    queryKey: ['buy-now-best-coupon', courseId, totalPrice],
    enabled: isBuyNow && totalPrice > 0,
    queryFn: async () => {
      const response = await getBestCourseCouponPreview(totalPrice);
      if (response.status === 'ERR') throw new Error(response.message || 'Không thể tải coupon.');
      return response.data ?? { subtotal: totalPrice, coupon: null };
    },
  });
  const appliedCoupon = useMemo<CouponValidation | null>(() => {
    if (!isBuyNow) return storedCartCoupon;
    const preview = buyNowCouponQuery.data;
    const coupon = preview?.coupon;
    if (!coupon) return null;
    const discountAmount = coupon.discountAmount ?? coupon.discountPreview ?? 0;
    return {
      coupon,
      subtotal: preview.subtotal,
      discountAmount,
      finalAmount: coupon.finalAmount ?? Math.max(preview.subtotal - discountAmount, 0),
    };
  }, [isBuyNow, storedCartCoupon, buyNowCouponQuery.data]);
  const discountAmount = appliedCoupon?.subtotal === totalPrice ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(totalPrice - discountAmount, 0);

  const checkoutMutation = useMutation({
    // Tạo giao dịch mua đứt từ FE.
    // Backend sẽ đọc cart hiện tại, tạo PaymentTransaction PENDING và trả paymentUrl để redirect sang cổng thanh toán.
    mutationFn: async () => {
      const response = await createCourseCheckout({
        paymentMethod,
        provider: providerForMethod(paymentMethod),
        couponCode: discountAmount > 0 ? appliedCoupon?.coupon.code : undefined,
        checkoutMode: isBuyNow ? 'BUY_NOW' : 'CART',
        courseId: isBuyNow ? courseId : undefined,
      });

      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tạo phiên thanh toán.');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // FE không tự mở quyền học ở bước này.
      // Sau khi có paymentUrl, browser được chuyển sang cổng thanh toán; quyền học chỉ được mở sau callback confirm thành công.
      if (!data?.paymentUrl) {
        checkoutLockRef.current = false;
        toast.error('Không tìm thấy đường dẫn thanh toán.');
        return;
      }

      // Giữ nút bị khóa trong khoảng trống giữa lúc API hoàn tất và browser thực sự rời trang.
      // Ref chặn đồng bộ cả các click liên tiếp trước khi React kịp render lại.
      setIsRedirecting(true);
      window.location.href = data.paymentUrl;
    },
    onError: (error) => {
      checkoutLockRef.current = false;
      toast.error(error instanceof Error ? error.message : 'Không thể thanh toán lúc này.');
    },
  });

  const handleCheckout = () => {
    if (checkoutLockRef.current) return;

    checkoutLockRef.current = true;
    checkoutMutation.mutate();
  };

  const isCheckoutLocked = checkoutMutation.isPending || isRedirecting;

  if (!authResolved) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (isBuyNow && buyNowQuery.data?.alreadyOwned && buyNowQuery.data.slug) {
    return <Navigate to={'/course/' + encodeURIComponent(buyNowQuery.data.slug)} replace />;
  }

  if (isBuyNow && (!courseId || buyNowQuery.isError)) {
    const message = !courseId
      ? 'Thiếu khóa học cần mua ngay.'
      : (buyNowQuery.error instanceof Error ? buyNowQuery.error.message : 'Khóa học không thể mua ngay.');
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="text-2xl font-bold">Không thể tiếp tục mua ngay</h1>
        <p className="text-muted-foreground">{message}</p>
        <Button onClick={() => navigate('/courses')}>Quay lại danh sách khóa học</Button>
      </div>
    );
  }

  if (isBuyNow && buyNowQuery.isPending) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative -mt-[88px] min-h-screen bg-background text-foreground antialiased">
      {/* ── Hero Banner (Đồng bộ phong cách trang Catalog / Pricing / Cart) ── */}
      <section className="relative pt-[104px] pb-6 lg:pt-[116px] lg:pb-8 px-4 md:px-6 overflow-hidden bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-background">
        {/* Họa tiết chấm trang trí nhẹ ở background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 max-w-[1340px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-foreground tracking-tight">
              Hoàn tất đơn hàng
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1 max-w-xl">
              Lựa chọn phương thức thanh toán phù hợp để kích hoạt ngay các khóa học của bạn.
            </p>
          </div>

          {/* Stepper trong Hero Banner */}
          <nav className="shrink-0">
            <div className="flex items-center gap-1.5 p-1.5 bg-card/70 backdrop-blur-md border border-border/80 rounded-2xl shadow-xs">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === 1;
                const isCompleted = i < 1;

                return (
                  <div key={step.label} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{step.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Đường gạch chia nhẹ ở dưới hero banner */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      </section>

      {/* ── Main Content của Checkout ── */}
      <main className="max-w-[1340px] mx-auto px-4 md:px-6 py-6 md:py-10">

      {checkoutItems.length === 0 ? (
        <div className="border border-border py-16 px-6 text-center rounded-2xl bg-card animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống</h2>
          <p className="text-muted-foreground mb-8 text-base max-w-md mx-auto">
            Vui lòng thêm khóa học vào giỏ hàng trước khi thanh toán.
          </p>
          <Button variant="udemy_dark" onClick={() => navigate('/courses')} className="font-bold h-12 px-8 rounded-lg text-base">
            Khám phá khóa học
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── Left Column ── */}
          <div className="flex-1 space-y-6 animate-fade-in-up">
            {/* Payment Methods */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Phương thức thanh toán
              </h2>

              <div className="space-y-3">
                {/* VNPay */}
                <label
                  className={`payment-method-card ${paymentMethod === 'VNPAY' ? 'selected' : 'border-border'}`}
                  onClick={() => setPaymentMethod('VNPAY')}
                >
                  <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} className="sr-only" />
                  <div className="check-indicator">
                    {paymentMethod === 'VNPAY' && <Check className="w-3 h-3 text-white dark:text-zinc-900" />}
                  </div>
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0 bg-white flex items-center justify-center">
                    <img src={vnpayLogo} alt="VNPay" className="w-full h-full object-contain p-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold block text-sm">VNPay</span>
                    <span className="text-xs text-muted-foreground leading-tight block mt-0.5">
                      Thẻ ATM nội địa, Visa/Mastercard hoặc quét mã QR
                    </span>
                  </div>
                </label>

                {/* MoMo */}
                <label
                  className={`payment-method-card ${paymentMethod === 'MOMO' ? 'selected' : 'border-border'}`}
                  onClick={() => setPaymentMethod('MOMO')}
                >
                  <input type="radio" name="payment" value="MOMO" checked={paymentMethod === 'MOMO'} onChange={() => setPaymentMethod('MOMO')} className="sr-only" />
                  <div className="check-indicator">
                    {paymentMethod === 'MOMO' && <Check className="w-3 h-3 text-white dark:text-zinc-900" />}
                  </div>
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0 bg-white flex items-center justify-center">
                    <img src={momoLogo} alt="MoMo" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold block text-sm">Ví MoMo</span>
                    <span className="text-xs text-muted-foreground leading-tight block mt-0.5">
                      Thanh toán qua ví MoMo hoặc liên kết ngân hàng
                    </span>
                  </div>
                </label>
              </div>
            </section>

            {/* CTA Button */}
            <Button
              variant="udemy_dark"
              className="w-full text-base h-13 rounded-xl font-bold flex items-center justify-center gap-2.5"
              onClick={handleCheckout}
              disabled={isCheckoutLocked}
            >
              {isCheckoutLocked ? (
                <>
                  {isRedirecting ? 'Đang chuyển đến cổng thanh toán...' : 'Đang tạo giao dịch...'}
                  <Loader2 className="h-5 w-5 animate-spin" />
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  Xác nhận thanh toán
                </>
              )}
            </Button>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
              Bằng việc hoàn tất mua hàng, bạn đồng ý cho phép SecureLearn xử lý thanh toán và ghi danh khóa học tự động.
            </p>
          </div>

          {/* ── Right Column — Order Summary ── */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-card border border-border rounded-2xl sticky top-24 overflow-hidden animate-fade-in">
              <div className="p-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-5">
                  Đơn hàng ({checkoutItems.length} khóa học)
                </h2>

                {/* Item list */}
                <div className="space-y-4 mb-6">
                  {checkoutItems.map((item) => (
                    <div key={item._id} className="flex gap-3">
                      <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-border bg-muted">
                        <img
                          src={item.thumbnail || 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=150&q=80'}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{item.title}</h3>
                        <span className="font-bold text-sm mt-1 block">{item.price.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tạm tính</span>
                    <span>{totalPrice.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Coupon {appliedCoupon?.coupon.code}</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="font-semibold text-sm text-muted-foreground">Tổng thanh toán</span>
                    <span className="font-extrabold text-2xl tracking-tight">
                      {finalPrice.toLocaleString('vi-VN')}
                      <span className="text-lg ml-0.5">₫</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust footer */}
              <div className="bg-muted/30 border-t border-border px-6 py-4 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Giao dịch an toàn và bảo mật. Thông tin của bạn được bảo vệ tuyệt đối.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};
