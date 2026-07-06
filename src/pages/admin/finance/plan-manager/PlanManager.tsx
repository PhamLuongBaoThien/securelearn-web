import { useState } from 'react';
import { CalendarDays, Check, Loader2, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SubscriptionPlan } from '@/services/paymentApi';
import { useAdminSubscriptionPlans, useSaveAdminSubscriptionPlan } from '@/hooks/useAdminFinance';

const money = (value: unknown) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const planTypeLabel: Record<string, string> = { MONTHLY: 'Gói tháng', YEARLY: 'Gói năm' };

export const PlanManager = () => {
  const [drafts, setDrafts] = useState<Record<string, SubscriptionPlan>>({});
  const plansQuery = useAdminSubscriptionPlans();
  const saveMutation = useSaveAdminSubscriptionPlan();
  const plans = plansQuery.data || [];
  const draftFor = (plan: SubscriptionPlan) => drafts[plan._id] || plan;
  const patch = (plan: SubscriptionPlan, values: Partial<SubscriptionPlan>) =>
    setDrafts((current) => ({ ...current, [plan._id]: { ...draftFor(plan), ...values } }));

  return <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Gói thuê bao</h1>
      <p className="mt-1 text-sm text-zinc-500">Quản lý nội dung, giá và trạng thái bán. Kỳ thuê bao và đối soát nằm tại Giao dịch → Thuê bao.</p>
    </div>
    {plansQuery.isLoading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> :
      <div className="grid gap-5 lg:grid-cols-2">{plans.map((plan) => {
        const draft = draftFor(plan);
        return <section key={plan._id} className="border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary"><CalendarDays className="h-5 w-5" /></div><div><p className="text-xs font-semibold text-zinc-500">{planTypeLabel[draft.type] || draft.type}</p><p className="font-bold">{draft.durationDays} ngày sử dụng</p><p className="text-xs text-zinc-500">Thời hạn cố định, chỉ đọc</p></div></div>
            <Button variant="ghost" size="icon" title={draft.isActive ? 'Tạm dừng bán' : 'Mở bán'} onClick={() => patch(plan, { isActive: !draft.isActive })}>{draft.isActive ? <ToggleRight className="h-6 w-6 text-emerald-600" /> : <ToggleLeft className="h-6 w-6" />}</Button>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium">Tên gói<Input className="mt-1" value={draft.name} onChange={(e) => patch(plan, { name: e.target.value })} /></label>
            <label className="block text-sm font-medium">Giá bán<Input className="mt-1" type="number" min={1000} value={draft.price} onChange={(e) => patch(plan, { price: Number(e.target.value) })} /><span className="mt-1 block text-xs text-zinc-500">{money(draft.price)}</span></label>
            <label className="block text-sm font-medium">Mô tả<Input className="mt-1" value={draft.description} onChange={(e) => patch(plan, { description: e.target.value })} /></label>
            <label className="block text-sm font-medium">Quyền lợi, mỗi dòng một mục<textarea className="mt-1 min-h-28 w-full border border-zinc-200 bg-transparent p-3 text-sm outline-none focus:border-primary dark:border-zinc-700" value={draft.features.join('\n')} onChange={(e) => patch(plan, { features: e.target.value.split('\n').filter(Boolean) })} /></label>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800"><span className={`text-sm font-medium ${draft.isActive ? 'text-emerald-600' : 'text-zinc-500'}`}>{draft.isActive ? 'Đang bán' : 'Tạm dừng'}</span><Button onClick={() => saveMutation.mutate(draft)} disabled={saveMutation.isPending}>{saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Lưu gói</Button></div>
        </section>;
      })}</div>}
    <div className="flex items-start gap-3 border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Giá và tỷ lệ chia được chốt tại lúc thanh toán; chỉnh sửa gói không làm thay đổi giao dịch cũ.</div>
  </div>;
};