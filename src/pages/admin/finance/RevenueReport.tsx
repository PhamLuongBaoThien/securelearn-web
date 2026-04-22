import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, CheckCircle, Database, Infinity } from 'lucide-react';
import type { IRevenueStats, IActiveSubscription } from '@/types/admin.types';

const MOCK_STATS: IRevenueStats = {
  totalRevenue: 156750000,
  thisMonthRevenue: 24350000,
  successfulTransactions: 312,
  activeSubscriptions: 189,
  monthlyData: [
    { month: 'T11/2025', revenue: 18200000, transactions: 42 },
    { month: 'T12/2025', revenue: 22500000, transactions: 58 },
    { month: 'T1/2026', revenue: 19800000, transactions: 51 },
    { month: 'T2/2026', revenue: 21300000, transactions: 47 },
    { month: 'T3/2026', revenue: 28400000, transactions: 63 },
    { month: 'T4/2026', revenue: 24350000, transactions: 51 },
  ],
};

const MOCK_SUBSCRIPTIONS: IActiveSubscription[] = [
  { userId: 'u1', fullName: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', plan: 'MONTHLY', expiresAt: '2026-05-01T23:59:59Z', isActive: true, redisKey: 'sub:u1:monthly' },
  { userId: 'u6', fullName: 'Đinh Thị F', email: 'dinhthif@gmail.com', plan: 'YEARLY', expiresAt: '2027-04-01T23:59:59Z', isActive: true, redisKey: 'sub:u6:yearly' },
  { userId: 'u2', fullName: 'Trần Thị B', email: 'tranthib@gmail.com', plan: 'LIFETIME', expiresAt: null, isActive: true, redisKey: 'sub:u2:lifetime' },
];

const fmt = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' Tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' Triệu';
  return n.toLocaleString('vi-VN') + '₫';
};
const fmtFull = (n: number) => n.toLocaleString('vi-VN') + '₫';

const planBadge: Record<string, string> = {
  MONTHLY: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400',
  YEARLY: 'bg-violet-100 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400',
  LIFETIME: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400',
};

export const RevenueReport: React.FC = () => {
  const [stats] = useState<IRevenueStats>(MOCK_STATS);
  const [subscriptions] = useState<IActiveSubscription[]>(MOCK_SUBSCRIPTIONS);

  const maxRevenue = Math.max(...stats.monthlyData.map((d) => d.revenue));

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Đối soát & Báo cáo Tài chính</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Thống kê doanh thu và kiểm tra trạng thái đăng ký được lưu tại Redis.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng doanh thu', value: fmt(stats.totalRevenue), sub: 'kể từ ra mắt', icon: <DollarSign className="w-5 h-5" />, cls: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600' },
          { label: 'Tháng này', value: fmt(stats.thisMonthRevenue), sub: '+14.3% so với T3', icon: <TrendingUp className="w-5 h-5" />, cls: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600' },
          { label: 'Giao dịch thành công', value: stats.successfulTransactions.toLocaleString(), sub: 'tổng cộng', icon: <CheckCircle className="w-5 h-5" />, cls: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-400/10 text-violet-600' },
          { label: 'Đăng ký đang hoạt động', value: stats.activeSubscriptions.toLocaleString(), sub: 'từ Redis cache', icon: <Users className="w-5 h-5" />, cls: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
              <p className="text-sm text-zinc-500">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Doanh thu theo tháng</h2>
              <p className="text-sm text-zinc-500 mt-0.5">6 tháng gần nhất</p>
            </div>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-end justify-between gap-3 h-48">
            {stats.monthlyData.map((d) => {
              const height = (d.revenue / maxRevenue) * 100;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex items-end justify-center" style={{ height: '160px' }}>
                    <div
                      className="w-full rounded-t-xl bg-primary/20 group-hover:bg-primary/40 transition-all duration-300 relative overflow-hidden cursor-pointer"
                      style={{ height: `${height}%`, minHeight: '8px' }}
                      title={fmtFull(d.revenue)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-primary/20" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-medium text-zinc-500">{d.month}</p>
                    <p className="text-[10px] text-zinc-400">{d.transactions} GD</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 gap-4">
            {stats.monthlyData.slice(-3).map((d) => (
              <div key={d.month} className="text-center">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{fmt(d.revenue)}</p>
                <p className="text-xs text-zinc-400">{d.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Subscriptions from Redis */}
        <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Active Subscriptions</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-4 font-mono bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl">Redis cache key pattern: <span className="text-primary">sub:&#123;userId&#125;:&#123;plan&#125;</span></p>

          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.userId} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{sub.fullName}</p>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${planBadge[sub.plan]}`}>{sub.plan}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate">{sub.email}</p>
                <div className="flex items-center justify-between mt-2">
                  <code className="text-[10px] text-zinc-400 font-mono">{sub.redisKey}</code>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                    {sub.expiresAt
                      ? `Hết hạn: ${new Date(sub.expiresAt).toLocaleDateString('vi-VN')}`
                      : <><Infinity className="w-3 h-3" /> Vĩnh viễn</>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
