import React, { useState } from 'react';
import { Pencil, Check, X, ToggleLeft, ToggleRight, Save, Users, Infinity, Calendar, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { IPricingPlan, PlanType } from '@/types/admin.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MOCK_PLANS: IPricingPlan[] = [
  { _id: 'p1', type: 'MONTHLY', name: 'Gói Tháng', price: 199000, durationDays: 30, features: ['Truy cập toàn bộ khóa học', 'Xem video chất lượng HD', 'Tải tài liệu PDF', 'Hỗ trợ email'], isActive: true, subscriberCount: 324, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
  { _id: 'p2', type: 'YEARLY', name: 'Gói Năm', price: 1499000, durationDays: 365, features: ['Toàn bộ tính năng Gói Tháng', 'Tiết kiệm 37% so với gói tháng', 'Ưu tiên hỗ trợ 24/7', 'Chứng chỉ hoàn thành khóa học', 'Truy cập khóa học mới nhất'], isActive: true, subscriberCount: 189, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
  { _id: 'p3', type: 'LIFETIME', name: 'Trọn Đời', price: 4999000, durationDays: undefined, features: ['Toàn bộ tính năng Gói Năm', 'Truy cập vĩnh viễn', 'Mua một lần — không phí ẩn', 'Hỗ trợ ưu tiên Platinum', 'Beta tester cho tính năng mới'], isActive: true, subscriberCount: 76, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
];

const planIcons: Record<PlanType, React.ReactNode> = {
  MONTHLY: <Calendar className="w-5 h-5" />,
  YEARLY: <Zap className="w-5 h-5" />,
  LIFETIME: <Star className="w-5 h-5" />,
};

const planColors: Record<PlanType, { banner: string; badge: string; iconCls: string }> = {
  MONTHLY: { banner: 'from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-900', badge: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400', iconCls: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600' },
  YEARLY: { banner: 'from-violet-500/10 to-violet-600/5 border-violet-200 dark:border-violet-900', badge: 'bg-violet-100 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400', iconCls: 'bg-violet-100 dark:bg-violet-400/10 text-violet-600' },
  LIFETIME: { banner: 'from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-900', badge: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400', iconCls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600' },
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

export const PlanManager: React.FC = () => {
  const [plans, setPlans] = useState<IPricingPlan[]>(MOCK_PLANS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  const handleStartEdit = (plan: IPricingPlan) => {
    setEditingId(plan._id);
    setEditPrice(plan.price.toString());
  };

  const handleSavePrice = (id: string) => {
    const price = parseInt(editPrice.replace(/\D/g, ''));
    if (isNaN(price) || price < 1000) { toast.error('Giá không hợp lệ (tối thiểu 1,000₫).'); return; }
    setPlans((p) => p.map((pl) => pl._id === id ? { ...pl, price } : pl));
    setEditingId(null);
    toast.success('Đã cập nhật giá gói cước.');
  };

  const handleToggle = (id: string) => {
    setPlans((p) => p.map((pl) => pl._id === id ? { ...pl, isActive: !pl.isActive } : pl));
    const plan = plans.find((p) => p._id === id);
    toast.success(`Đã ${plan?.isActive ? 'tạm dừng' : 'kích hoạt'} gói ${plan?.name}.`);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Quản lý Gói cước</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Thiết lập giá và điều kiện cho các mô hình mua đứt và thuê bao định kỳ.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm text-zinc-500">Tổng: <strong className="text-zinc-900 dark:text-white">{plans.reduce((s, p) => s + p.subscriberCount, 0)}</strong> người đăng ký</span>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const pc = planColors[plan.type];
          const isEditing = editingId === plan._id;
          return (
            <div key={plan._id} className={`bg-gradient-to-br ${pc.banner} border-2 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${!plan.isActive ? 'opacity-60' : ''}`}>
              {/* Top */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pc.iconCls}`}>{planIcons[plan.type]}</div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pc.badge}`}>{plan.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.isActive ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                        {plan.isActive ? 'Đang bán' : 'Tạm dừng'}
                      </span>
                    </div>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleToggle(plan._id)} title={plan.isActive ? 'Tạm dừng' : 'Kích hoạt'} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                  {plan.isActive ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6" />}
                </Button>
              </div>

              {/* Price */}
              <div className="mb-4">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-zinc-900 dark:text-zinc-100"
                      autoFocus
                    />
                    <Button type="button" size="icon" onClick={() => handleSavePrice(plan._id)} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"><Check className="w-4 h-4" /></Button>
                    <Button type="button" variant="secondary" size="icon" onClick={() => setEditingId(null)} className="p-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2 group">
                    <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{fmt(plan.price)}</span>
                    <span className="text-zinc-500 text-sm">{plan.type === 'LIFETIME' ? '/ mãi mãi' : plan.type === 'MONTHLY' ? '/ tháng' : '/ năm'}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleStartEdit(plan)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-all ml-auto">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-zinc-400 mt-1">
                  {plan.durationDays ? `${plan.durationDays} ngày` : <span className="flex items-center gap-1"><Infinity className="w-3 h-3" />Vĩnh viễn</span>}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Users className="w-4 h-4" />
                  <span><strong className="text-zinc-900 dark:text-zinc-200">{plan.subscriberCount}</strong> người đăng ký</span>
                </div>
                <div className="text-xs text-zinc-400">
                  Revenue: <strong className="text-zinc-600 dark:text-zinc-300">{fmt(plan.price * plan.subscriberCount)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save All */}
      <div className="flex justify-end">
        <Button id="btn-save-plans" onClick={() => toast.success('Đã đồng bộ cấu hình gói cước.')} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Save className="w-4 h-4" /> Đồng bộ cài đặt
        </Button>
      </div>
    </div>
  );
};
