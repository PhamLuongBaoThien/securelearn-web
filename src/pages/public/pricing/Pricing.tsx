// ========================
// Pricing Page
// Mục đích:
// - hiển thị gói thuê bao thật từ backend
// - cho user chọn cổng thanh toán và tạo checkout thuê bao
// ========================
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarDays, Check, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAppSelector } from '@/app/hooks';
import { CourseCard } from '@/components/ui/CourseCard';
import { getSubscriptionCatalog } from '@/services/courseApi';
import {
  createSubscriptionCheckout,
  getMySubscription,
  getSubscriptionPlans,
  type PaymentMethod,
} from '@/services/paymentApi';

const paymentMethodLabel: Record<PaymentMethod, string> = {
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
};

const planDurationLabel = (days: number) => {
  if (days === 30) return 'Dùng trong 30 ngày';
  if (days === 365) return 'Dùng trong 365 ngày';
  return `${days} ngày sử dụng`;
};

export const Pricing = () => {
  const location = useLocation();
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
    checkout.mutate(planId);
  };

  if (!authResolved) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: location }} replace />;

  const current = subscriptionQuery.data?.current;
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gói học theo thuê bao</h1>
        <p className="mt-2 text-zinc-500">Thanh toán trước, dùng theo thời hạn của gói. Nếu mua thêm khi gói cũ còn hạn, thời gian mới sẽ được cộng nối tiếp.</p>
        {current && (
          <p className="mt-3 border-l-4 border-emerald-500 pl-3 text-sm">
            Bạn đang dùng <strong>{current.planName}</strong>, có hiệu lực đến ngày {new Date(current.endsAt).toLocaleDateString('vi-VN')}.
          </p>
        )}
      </div>

      <div className="mb-6 flex max-w-md border border-zinc-200 p-1 dark:border-zinc-800 gap-1 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-lg">
        {(['VNPAY', 'MOMO'] as PaymentMethod[]).map((item) => (
          <Button
            key={item}
            variant={method === item ? 'default' : 'ghost'}
            className="h-10 flex-1 text-sm font-semibold rounded-md transition-all cursor-pointer"
            onClick={() => setMethod(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {(plansQuery.data || []).map((plan) => (
          <section key={plan._id} className="border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="text-sm text-zinc-500">{planDurationLabel(plan.durationDays)}</p>
              </div>
            </div>
            <p className="mt-5 text-3xl font-extrabold">{plan.price.toLocaleString('vi-VN')} ₫</p>
            <p className="mt-2 text-sm text-zinc-500">{plan.description || 'Dành cho người học muốn mở khóa toàn bộ các khóa học đang nằm trong gói.'}</p>
            <ul className="my-6 space-y-2">
              {plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-emerald-600" />{feature}</li>)}
            </ul>
            <Button className="w-full" onClick={() => handlePlanCheckout(plan._id)} disabled={checkout.isPending}>
              {checkout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Thanh toán qua {paymentMethodLabel[method]}
            </Button>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Một số khóa học có trong gói</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Các gói đều mở cùng một danh sách khóa học. Điểm khác nhau nằm ở thời gian sử dụng của từng gói.
            </p>
          </div>
          <Link to="/subscription-catalog" className={buttonVariants({ variant: 'outline' })}>
            Xem tất cả khóa học
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {(catalogQuery.data || []).slice(0, 4).map((course) => (
            <CourseCard key={course._id} course={course} mode="subscription" />
          ))}
        </div>
      </section>
    </main>
  );
};
