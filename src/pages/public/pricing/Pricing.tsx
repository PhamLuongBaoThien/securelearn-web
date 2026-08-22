// Trang/giao diện: Triển khai trang giới thiệu các gói thuê bao (route: /pricing).
// ========================
// Pricing Page
// Mục đích:
// - hiển thị gói thuê bao thật từ backend
// - cho user chọn cổng thanh toán và tạo checkout thuê bao
// ========================
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/app/hooks';
import { CourseCard } from '@/components/ui/CourseCard';
import { getSubscriptionCatalog } from '@/services/courseApi';
import {
  createSubscriptionCheckout,
  getMySubscription,
  getSubscriptionPlans,
  type PaymentMethod,
} from '@/services/paymentApi';

import momoLogo from '@/assets/Logo-MoMo.webp';
import vnpayLogo from '@/assets/vnpay-logo.jpg';

const paymentMethodLabel: Record<PaymentMethod, string> = {
  VNPAY: 'VNPay',
  MOMO: 'Ví MoMo',
};

const planDurationLabel = (days: number) => {
  if (days === 30) return 'Dùng trong 30 ngày';
  if (days === 365) return 'Dùng trong 365 ngày';
  return `${days} ngày sử dụng`;
};

export const Pricing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authResolved, isAuthenticated } = useAppSelector((state) => state.auth);
  const [method, setMethod] = useState<PaymentMethod>('VNPAY');
  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => (await getSubscriptionPlans()).data || [],
  });
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: async () => (await getMySubscription()).data,
    enabled: isAuthenticated,
  });
  const catalogQuery = useQuery({
    queryKey: ['courses', 'subscription-catalog', 'preview'],
    queryFn: async () => (await getSubscriptionCatalog()).data || [],
  });
  const checkout = useMutation({
    mutationFn: async (planId: string) => {
      const response = await createSubscriptionCheckout({ planId, paymentMethod: method, provider: method });
      if (!response.data?.paymentUrl) throw new Error(response.message || 'Không thể tạo thanh toán.');
      return response.data.paymentUrl;
    },
    onSuccess: (url) => { window.location.href = url; },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể tạo thanh toán.'),
  });

  const handlePlanCheckout = (planId: string) => {
    if (!isAuthenticated) {
      navigate('/auth/login', {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        },
      });
      return;
    }
    checkout.mutate(planId);
  };

  if (!authResolved) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;

  const current = subscriptionQuery.data?.current;
  const scheduledTerms = subscriptionQuery.data?.scheduled || [];
  const renewedUntil = scheduledTerms.reduce<string | null>((latest, term) => {
    if (!latest || new Date(term.endsAt).getTime() > new Date(latest).getTime()) return term.endsAt;
    return latest;
  }, null);

  return (
    <div className="relative -mt-[88px] min-h-screen bg-background text-foreground antialiased">
      {/* ── Hero Banner Gọn Gàng ── */}
      <section className="relative pt-[104px] pb-6 lg:pt-[116px] lg:pb-8 px-4 md:px-6 overflow-hidden bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-background">
        {/* Họa tiết chấm trang trí nhẹ ở background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 max-w-[1340px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Gói Hội viên SecureLearn
            </p>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-foreground tracking-tight mt-1">
              Gói học theo thuê bao
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1 max-w-xl">
              Thanh toán trước, dùng theo thời hạn gói. Mua thêm khi gói cũ còn hạn sẽ được tự động cộng nối tiếp thời gian sử dụng.
            </p>
          </div>

          {/* Selector Cổng thanh toán đóng khung tinh tế */}
          <div className="shrink-0">
            <div className="rounded-2xl border border-border/80 bg-card/70 dark:bg-muted/40 p-2.5 md:p-3 shadow-xs backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Phương thức thanh toán
              </p>
              <Tabs value={method} onValueChange={(val) => setMethod(val as PaymentMethod)}>
                <TabsList className="h-12 p-1 bg-muted/80 rounded-xl border border-border/50 gap-1.5 w-full sm:w-auto">
                  <TabsTrigger
                    value="VNPAY"
                    className="h-10 px-4 text-xs md:text-sm font-bold rounded-lg gap-2.5 transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border/80 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-border/40 shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                      <img src={vnpayLogo} alt="VNPay" className="w-full h-full object-contain" />
                    </div>
                    <span>VNPay</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="MOMO"
                    className="h-10 px-4 text-xs md:text-sm font-bold rounded-lg gap-2.5 transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border/80 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-border/40 shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                      <img src={momoLogo} alt="MoMo" className="w-full h-full object-contain" />
                    </div>
                    <span>Ví MoMo</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Banner trạng thái gói nếu user đã mua */}
        {current && (
          <div className="relative z-10 max-w-[1340px] mx-auto mt-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">Gói đang hoạt động: {current.planName}</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Kết thúc: <strong className="text-foreground">{new Date(current.endsAt).toLocaleDateString('vi-VN')}</strong></span>
                {renewedUntil && (
                  <span>Gia hạn đến: <strong className="text-emerald-600 dark:text-emerald-400">{new Date(renewedUntil).toLocaleDateString('vi-VN')}</strong></span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Đường gạch chia nhẹ ở dưới hero banner */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      </section>

      {/* ── Main Content: 2 Gói Thuê Bao hiển thị ngay màn hình đầu ── */}
      <main className="max-w-[1340px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid gap-5 md:grid-cols-2 max-w-4xl mx-auto">
          {(plansQuery.data || []).map((plan) => (
            <section key={plan._id} className="relative rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md flex flex-col justify-between">
              <div>
                <div>
                  <h2 className="text-lg font-bold text-card-foreground">{plan.name}</h2>
                  <p className="text-[11px] font-medium text-muted-foreground">{planDurationLabel(plan.durationDays)}</p>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-extrabold text-foreground">{plan.price.toLocaleString('vi-VN')}</span>
                  <span className="text-sm font-bold text-muted-foreground">₫</span>
                </div>
                
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{plan.description || 'Dành cho người học muốn mở khóa toàn bộ các khóa học đang nằm trong gói.'}</p>
                
                <ul className="my-4 space-y-2 border-t border-border/60 pt-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-foreground">
                      <div className="mt-0.5 p-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button size="default" className="w-full font-semibold rounded-xl mt-2 h-10 text-xs md:text-sm" onClick={() => handlePlanCheckout(plan._id)} disabled={checkout.isPending}>
                {checkout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {isAuthenticated ? `Thanh toán qua ${paymentMethodLabel[method]}` : 'Đăng nhập để thanh toán'}
              </Button>
            </section>
          ))}
        </div>

        {/* Khóa học trong gói */}
        <section className="mt-12 border-t border-border pt-8">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground">Một số khóa học có trong gói</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tất cả các gói đều mở cùng danh sách khóa học. Bạn có thể xem trước các khóa học nổi bật dưới đây.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs h-9 px-4 font-medium shrink-0"
              onClick={() => navigate('/subscription-catalog')}
            >
              Xem tất cả khóa học
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {(catalogQuery.data || []).slice(0, 4).map((course) => (
              <CourseCard key={course._id} course={course} mode="subscription" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
