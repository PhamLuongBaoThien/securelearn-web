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
        <h1 className="text-3xl font-bold">Gói học SecureLearn</h1>
        <p className="mt-2 text-zinc-500">Trả trước, tự gia hạn. Mua thêm khi còn hạn sẽ nối tiếp sau kỳ hiện tại.</p>
        {current && (
          <p className="mt-3 border-l-4 border-emerald-500 pl-3 text-sm">
            Gói hiện tại: <strong>{current.planName}</strong>, hết hạn {new Date(current.endsAt).toLocaleDateString('vi-VN')}.
          </p>
        )}
      </div>

      <div className="mb-6 flex max-w-md border border-zinc-200 p-1 dark:border-zinc-800">
        {(['VNPAY', 'MOMO'] as PaymentMethod[]).map((item) => (
          <button key={item} className={`h-10 flex-1 text-sm font-semibold ${method === item ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : ''}`} onClick={() => setMethod(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {(plansQuery.data || []).map((plan) => (
          <section key={plan._id} className="border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="text-sm text-zinc-500">{plan.durationDays} ngày</p>
              </div>
            </div>
            <p className="mt-5 text-3xl font-extrabold">{plan.price.toLocaleString('vi-VN')} ₫</p>
            <p className="mt-2 text-sm text-zinc-500">{plan.description}</p>
            <ul className="my-6 space-y-2">
              {plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-emerald-600" />{feature}</li>)}
            </ul>
            <Button className="w-full" onClick={() => handlePlanCheckout(plan._id)} disabled={checkout.isPending}>
              {checkout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Thanh toán bằng {method}
            </Button>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Preview catalog trong gói</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Cả gói tháng và gói năm đều mở quyền vào cùng catalog này, chỉ khác thời hạn sử dụng.
            </p>
          </div>
          <Link to="/subscription-catalog" className={buttonVariants({ variant: 'outline' })}>
            Xem toàn bộ khóa học trong gói
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
