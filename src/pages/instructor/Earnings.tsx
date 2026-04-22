// ========================
// Instructor Earnings: Tài chính & Thu nhập
// Revenue chart, transaction history, Lifetime vs Subscription.
// ========================
import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

// ===== Mock Data =====
const REVENUE_DATA = [
  { name: 'T1', lifetime: 3200000, subscription: 1500000 },
  { name: 'T2', lifetime: 2800000, subscription: 1800000 },
  { name: 'T3', lifetime: 5100000, subscription: 2200000 },
  { name: 'T4', lifetime: 4200000, subscription: 2600000 },
  { name: 'T5', lifetime: 6800000, subscription: 3100000 },
  { name: 'T6', lifetime: 5500000, subscription: 3400000 },
  { name: 'T7', lifetime: 7200000, subscription: 3800000 },
  { name: 'T8', lifetime: 6100000, subscription: 4200000 },
  { name: 'T9', lifetime: 8300000, subscription: 4600000 },
  { name: 'T10', lifetime: 7400000, subscription: 5100000 },
  { name: 'T11', lifetime: 9200000, subscription: 5600000 },
  { name: 'T12', lifetime: 10500000, subscription: 6200000 },
];

const PIE_DATA = [
  { name: 'Lifetime (Mua đứt)', value: 68, color: '#6366f1' },
  { name: 'Subscription (Thuê bao)', value: 32, color: '#10b981' },
];

const MOCK_TRANSACTIONS = [
  {
    id: 'txn001',
    student: 'Nguyễn Văn A',
    course: 'React Masterclass 2024',
    type: 'LIFETIME',
    amount: 499000,
    gateway: 'VNPay',
    status: 'SUCCESS',
    date: '2026-04-21 14:23',
  },
  {
    id: 'txn002',
    student: 'Trần Thị B',
    course: 'React Masterclass 2024',
    type: 'SUBSCRIPTION',
    amount: 149000,
    gateway: 'Momo',
    status: 'SUCCESS',
    date: '2026-04-21 11:05',
  },
  {
    id: 'txn003',
    student: 'Lê Minh C',
    course: 'DevOps Fundamentals',
    type: 'LIFETIME',
    amount: 699000,
    gateway: 'VNPay',
    status: 'PENDING',
    date: '2026-04-21 09:47',
  },
  {
    id: 'txn004',
    student: 'Phạm Duy D',
    course: 'React Masterclass 2024',
    type: 'SUBSCRIPTION',
    amount: 149000,
    gateway: 'Momo',
    status: 'FAILED',
    date: '2026-04-20 22:13',
  },
  {
    id: 'txn005',
    student: 'Hoàng Thị E',
    course: 'DevOps Fundamentals',
    type: 'LIFETIME',
    amount: 699000,
    gateway: 'VNPay',
    status: 'SUCCESS',
    date: '2026-04-20 18:30',
  },
  {
    id: 'txn006',
    student: 'Vũ Quốc F',
    course: 'React Masterclass 2024',
    type: 'SUBSCRIPTION',
    amount: 149000,
    gateway: 'Momo',
    status: 'SUCCESS',
    date: '2026-04-20 15:12',
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const totalRevenue = REVENUE_DATA.reduce((s, d) => s + d.lifetime + d.subscription, 0);
const thisMonthRevenue = REVENUE_DATA[11].lifetime + REVENUE_DATA[11].subscription;
const lastMonthRevenue = REVENUE_DATA[10].lifetime + REVENUE_DATA[10].subscription;
const growth = (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1);

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SUCCESS: { label: 'Thành công', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  FAILED: { label: 'Thất bại', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export const InstructorEarnings: React.FC = () => {
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('12m');

  const periodMap = { '3m': 3, '6m': 6, '12m': 12 };
  const slicedData = REVENUE_DATA.slice(-periodMap[period]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Tài chính & Thu nhập</h1>
        <p className="text-muted-foreground mt-2">Theo dõi doanh thu và lịch sử giao dịch từ các khóa học của bạn.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: 'Tổng doanh thu',
            value: formatCurrency(totalRevenue),
            sub: 'Toàn thời gian',
            color: 'bg-green-500/10 text-green-600 dark:text-green-400',
            icon: <DollarSign className="w-6 h-6" />,
            trend: null,
          },
          {
            label: 'Tháng này',
            value: formatCurrency(thisMonthRevenue),
            sub: `${Number(growth) >= 0 ? '+' : ''}${growth}% so với tháng trước`,
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            icon: <TrendingUp className="w-6 h-6" />,
            trend: Number(growth) >= 0 ? 'up' : 'down',
          },
          {
            label: 'Chờ thanh toán',
            value: formatCurrency(149000),
            sub: '1 giao dịch đang chờ',
            color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
            icon: <Wallet className="w-6 h-6" />,
            trend: null,
          },
          {
            label: 'Tổng học viên trả tiền',
            value: MOCK_TRANSACTIONS.filter(t => t.status === 'SUCCESS').length.toString(),
            sub: 'Khóa học này tháng',
            color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            icon: <Users className="w-6 h-6" />,
            trend: null,
          },
        ].map((card) => (
          <div key={card.label} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{card.label}</p>
                <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">{card.value}</h3>
              </div>
              <div className={`h-12 w-12 ${card.color} rounded-xl flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <div className={`mt-3 flex items-center gap-1 text-sm font-medium ${
              card.trend === 'up' ? 'text-green-600' : card.trend === 'down' ? 'text-red-500' : 'text-zinc-400'
            }`}>
              {card.trend === 'up' && <TrendingUp className="w-4 h-4" />}
              {card.trend === 'down' && <TrendingDown className="w-4 h-4" />}
              <span>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Doanh thu theo tháng</h3>
            <div className="flex gap-2">
              {(['3m', '6m', '12m'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    period === p
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {p === '3m' ? '3 tháng' : p === '6m' ? '6 tháng' : '12 tháng'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slicedData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorLifetime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSubscription" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), name === 'lifetime' ? 'Lifetime' : 'Subscription']}
                />
                <Area type="monotone" dataKey="lifetime" name="lifetime" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorLifetime)" />
                <Area type="monotone" dataKey="subscription" name="subscription" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSubscription)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-3 h-2 bg-indigo-500 rounded-sm inline-block" />Lifetime</span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-3 h-2 bg-emerald-500 rounded-sm inline-block" />Subscription</span>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Phân bổ gói</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any) => [`${Number(value)}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-2">
            {PIE_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{item.name}</span>
                </div>
                <span className="font-bold text-zinc-900 dark:text-white text-sm">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white">Lịch sử giao dịch</h3>
          <p className="text-sm text-muted-foreground mt-1">Các giao dịch gần nhất từ học viên của bạn.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-3 px-4 font-medium text-zinc-500">Học viên</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-500 hidden md:table-cell">Khóa học</th>
                <th className="text-center py-3 px-4 font-medium text-zinc-500">Gói</th>
                <th className="text-center py-3 px-4 font-medium text-zinc-500 hidden sm:table-cell">Cổng TT</th>
                <th className="text-right py-3 px-4 font-medium text-zinc-500">Số tiền</th>
                <th className="text-center py-3 px-4 font-medium text-zinc-500">Trạng thái</th>
                <th className="text-right py-3 px-4 font-medium text-zinc-500 hidden lg:table-cell">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TRANSACTIONS.map((txn) => {
                const sc = statusConfig[txn.status];
                return (
                  <tr key={txn.id} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-600 dark:text-zinc-300 shrink-0">
                          {txn.student.charAt(0)}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-white">{txn.student}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1 max-w-[180px]">{txn.course}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={`text-xs border ${
                        txn.type === 'LIFETIME'
                          ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}>
                        {txn.type === 'LIFETIME' ? 'Lifetime' : 'Subscription'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1.5 text-zinc-500">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="text-xs">{txn.gateway}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-zinc-900 dark:text-white">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={`flex items-center justify-center gap-1 text-xs border w-fit mx-auto ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-zinc-400 hidden lg:table-cell whitespace-nowrap">
                      {txn.date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-sm text-zinc-500">
          <span>Hiển thị {MOCK_TRANSACTIONS.length} giao dịch gần nhất</span>
          <button className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors">
            Xem tất cả <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
