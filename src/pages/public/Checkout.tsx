import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, ShoppingCart, CreditCard, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/app/hooks';
import { useMutation } from '@tanstack/react-query';
import { createCourseCheckout, type PaymentMethod, type PaymentProvider } from '@/services/paymentApi';
import { toast } from 'sonner';

import momoLogo from '@/assets/Logo-MoMo.webp';
import vnpayLogo from '@/assets/vnpay-logo.jpg';

const providerForMethod = (method: PaymentMethod): PaymentProvider =>
  method === 'MOMO' ? 'MOMO' : 'VNPAY';

const STEPS = [
  { label: 'Giỏ hàng', icon: ShoppingCart },
  { label: 'Thanh toán', icon: CreditCard },
  { label: 'Hoàn tất', icon: CheckCircle2 },
];

export const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VNPAY');
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.cartItems);

  const totalPrice = useMemo(() => cartItems.reduce((sum, item) => sum + item.price, 0), [cartItems]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await createCourseCheckout({
        paymentMethod,
        provider: providerForMethod(paymentMethod),
      });

      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tạo phiên thanh toán.');
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (!data?.paymentUrl) {
        toast.error('Không tìm thấy đường dẫn thanh toán.');
        return;
      }
      window.location.href = data.paymentUrl;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể thanh toán lúc này.');
    },
  });

  const handleCheckout = () => {
    checkoutMutation.mutate();
  };

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

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-10 min-h-[60vh]">
      {/* ── Progress Stepper ── */}
      <nav className="flex items-center gap-2 mb-10 animate-fade-in">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === 1;
          const isCompleted = i < 1;

          return (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />}
              <div className={`checkout-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                  ${isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : isCompleted
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                  }
                `}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </div>
          );
        })}
      </nav>

      <h1 className="text-3xl font-bold font-serif mb-8 animate-fade-in-up">Thanh toán</h1>

      {cartItems.length === 0 ? (
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
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? (
                <>
                  Đang tạo giao dịch...
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
                  Đơn hàng ({cartItems.length} khóa học)
                </h2>

                {/* Item list */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
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

                {/* Divider + Total */}
                <div className="border-t border-border pt-4 flex justify-between items-baseline">
                  <span className="font-semibold text-sm text-muted-foreground">Tổng thanh toán</span>
                  <span className="font-extrabold text-2xl tracking-tight">
                    {totalPrice.toLocaleString('vi-VN')}
                    <span className="text-lg ml-0.5">₫</span>
                  </span>
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
    </div>
  );
};
