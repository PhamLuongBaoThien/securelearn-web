// ========================
// Admin Plan Manager
// Mục đích:
// - thay mock plan cũ bằng dữ liệu subscription plan, term và settlement thật
// - cho Admin chỉnh giá, tạm dừng bán, refund manual và chốt settlement thuê bao
// ========================
import { useState } from 'react';
import { CalendarDays, Check, Loader2, RotateCcw, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  type SubscriptionPlan,
} from '@/services/paymentApi';
import {
  useAdminSubscriptionPlans,
  useAdminSubscriptionTerms,
  useAdminSubscriptionSettlements,
  useSaveAdminSubscriptionPlan,
  useCalculateSubscriptionSettlement,
  useUpdateSubscriptionSettlement,
  useRefundAdminSubscriptionTerm,
} from '@/hooks/useAdminFinance';

const money = (value: number) => value.toLocaleString('vi-VN') + ' ₫';

export const PlanManager = () => {
  const [drafts, setDrafts] = useState<Record<string, SubscriptionPlan>>({});
  const plansQuery = useAdminSubscriptionPlans();
  const termsQuery = useAdminSubscriptionTerms();
  // Màn này thay mock cũ bằng dữ liệu thật cho cả plan, term gần đây và settlement thuê bao.
  const settlementsQuery = useAdminSubscriptionSettlements();
  const saveMutation = useSaveAdminSubscriptionPlan();
  const calculateSettlementMutation = useCalculateSubscriptionSettlement();
  const updateSettlementMutation = useUpdateSubscriptionSettlement();
  const refundMutation = useRefundAdminSubscriptionTerm();

  const plans = plansQuery.data || [];
  const draftFor = (plan: SubscriptionPlan) => drafts[plan._id] || plan;
  const patch = (plan: SubscriptionPlan, values: Partial<SubscriptionPlan>) =>
    setDrafts((current) => ({ ...current, [plan._id]: { ...draftFor(plan), ...values } }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Gói thuê bao</h1>
        <p className="mt-1 text-sm text-zinc-500">Chỉ hỗ trợ kỳ trả trước 30 ngày và 365 ngày. Gói đã có giao dịch chỉ được tạm dừng bán.</p>
      </div>

      {plansQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => {
            const draft = draftFor(plan);
            return (
              <section key={plan._id} className="border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-500">{draft.type}</p>
                      <p className="font-bold text-zinc-900 dark:text-white">{draft.durationDays} ngày</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={draft.isActive ? 'Tạm dừng bán' : 'Mở bán'}
                    onClick={() => patch(plan, { isActive: !draft.isActive })}
                  >
                    {draft.isActive ? <ToggleRight className="h-6 w-6 text-emerald-600" /> : <ToggleLeft className="h-6 w-6" />}
                  </Button>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Tên gói
                    <Input className="mt-1" value={draft.name} onChange={(event) => patch(plan, { name: event.target.value })} />
                  </label>
                  <label className="block text-sm font-medium">
                    Giá bán
                    <Input className="mt-1" type="number" min={1000} value={draft.price} onChange={(event) => patch(plan, { price: Number(event.target.value) })} />
                    <span className="mt-1 block text-xs text-zinc-500">{money(draft.price || 0)}</span>
                  </label>
                  <label className="block text-sm font-medium">
                    Mô tả
                    <Input className="mt-1" value={draft.description} onChange={(event) => patch(plan, { description: event.target.value })} />
                  </label>
                  <label className="block text-sm font-medium">
                    Quyền lợi, mỗi dòng một mục
                    <textarea
                      className="mt-1 min-h-28 w-full border border-zinc-200 bg-transparent p-3 text-sm outline-none focus:border-primary dark:border-zinc-700"
                      value={draft.features.join('\n')}
                      onChange={(event) => patch(plan, { features: event.target.value.split('\n') })}
                    />
                  </label>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <span className={`text-sm font-medium ${draft.isActive ? 'text-emerald-600' : 'text-zinc-500'}`}>
                    {draft.isActive ? 'Đang bán' : 'Tạm dừng'}
                  </span>
                  <Button onClick={() => saveMutation.mutate(draft)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu gói
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-3 border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        Giá, thời hạn và tỷ lệ chia được snapshot tại lúc thanh toán. Việc sửa gói không thay đổi giao dịch hoặc kỳ thuê bao cũ.
      </div>

      <section className="border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Kỳ thuê bao gần đây</h2>
          <span className="text-sm text-zinc-500">{termsQuery.data?.length || 0} kỳ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-zinc-500"><th className="py-2">User</th><th>Mã giao dịch</th><th>Gói</th><th>Thời hạn</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {(termsQuery.data || []).slice(0, 30).map((term) => (
                <tr key={term._id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-3">{term.userId}</td>
                  <td>{term.transactionCode}</td>
                  <td>{term.planName}</td>
                  <td>{new Date(term.startsAt).toLocaleDateString('vi-VN')} - {new Date(term.endsAt).toLocaleDateString('vi-VN')}</td>
                  <td className="font-medium">{term.status}</td>
                  <td className="text-right">
                    {!['REFUNDED', 'EXPIRED'].includes(term.status) && (
                      <Button variant="ghost" size="sm" onClick={() => refundMutation.mutate(term._id)}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Hoàn tiền
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Settlement thuê bao</h2>
            <p className="text-sm text-zinc-500">Pool không có usage được chuyển sang kỳ sau. Khóa settlement sau tối thiểu 7 ngày.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const now = new Date();
              now.setMonth(now.getMonth() - 1);
              calculateSettlementMutation.mutate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
            }}
          >
            Tính tháng trước
          </Button>
        </div>
        <div className="space-y-3">
          {(settlementsQuery.data || []).map((item) => (
            <div key={item._id} className="grid gap-3 border-t border-zinc-100 py-3 text-sm md:grid-cols-[100px_1fr_1fr_1fr_auto] dark:border-zinc-800">
              <strong>{item.period}</strong>
              <span>Tổng ghi nhận: {money(item.recognizedGross)}</span>
              <span>Pool: {money(item.instructorPool + item.carriedIn)}</span>
              <span>{item.status} · {Math.floor(item.totalQualifiedSeconds / 60).toLocaleString('vi-VN')} phút</span>
              <div>
                {item.status === 'CALCULATED' && <Button size="sm" onClick={() => updateSettlementMutation.mutate({ period: item.period, status: 'LOCKED' })}>Khóa</Button>}
                {item.status === 'LOCKED' && <Button size="sm" onClick={() => updateSettlementMutation.mutate({ period: item.period, status: 'AVAILABLE' })}>Cho phép nhận</Button>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
