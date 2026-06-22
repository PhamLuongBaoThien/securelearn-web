// ========================
// Admin Dashboard: Bảng điều khiển
// Hiển thị dữ liệu thật từ API: users, courses, revenue
// Đồng bộ giao diện cao cấp và sử dụng biểu đồ shadcn UI
// ========================
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  DollarSign,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { getUsers, getCoursesForReview, getRevenueStats, getRevenueSplitConfig } from '@/services/adminApi';
import { setSidebarOpen } from '@/features/dashboard/uiSlice';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const cardClass = 'rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

const monthlyChartConfig = {
  revenue: {
    label: 'Tổng thu',
    color: 'var(--chart-1)',
  },
  adminRevenue: {
    label: 'Quản trị viên',
    color: 'var(--chart-2)',
  },
  instructorRevenue: {
    label: 'Giảng viên',
    color: 'var(--chart-3)',
  },
  subscriptionRevenue: {
    label: 'Thuê bao',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

const providerChartConfig = {
  revenue: {
    label: 'Doanh thu',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, icon }) => (
  <div className={`${cardClass} p-5`}>
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{value}</p>
        {sub && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
      </div>
      <div className="shrink-0 self-center text-zinc-300 dark:text-zinc-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.adminAuth);

  // Fetch users stats
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'users'],
    queryFn: async () => {
      const res = await getUsers({ limit: 1 });
      return res.data;
    },
  });

  // Fetch courses pending review
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'courses-review'],
    queryFn: async () => {
      const res = await getCoursesForReview({ limit: 5 });
      return res.data;
    },
  });

  // Fetch revenue stats
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'revenue'],
    queryFn: async () => {
      const res = await getRevenueStats();
      return res.data;
    },
  });

  // Fetch split config
  const { data: splitConfig } = useQuery({
    queryKey: ['admin', 'dashboard', 'split-config'],
    queryFn: async () => {
      const res = await getRevenueSplitConfig();
      return res.data;
    },
  });

  const isLoading = usersLoading || coursesLoading || revenueLoading;

  // Data
  const totalUsers = usersData?.total ?? 0;
  const pendingCourses = coursesData?.courses ?? [];
  const pendingCount = coursesData?.total ?? 0;
  const revenue = revenueData;
  const totalRevenue = revenue?.totalRevenue ?? 0;
  const totalAdminRevenue = revenue?.totalAdminRevenue ?? 0;
  const totalInstructorRevenue = revenue?.totalInstructorRevenue ?? 0;
  const courseRevenue = revenue?.courseRevenue ?? 0;
  const subscriptionRevenue = revenue?.subscriptionRevenue ?? 0;
  const subscriptionTransactions = revenue?.subscriptionTransactions ?? 0;
  const thisMonthRevenue = revenue?.thisMonthRevenue ?? 0;
  const thisMonthAdminRevenue = revenue?.thisMonthAdminRevenue ?? 0;
  const thisMonthSubscriptionRevenue = revenue?.thisMonthSubscriptionRevenue ?? 0;
  const activeSubscriptions = revenue?.activeSubscriptions ?? 0;
  const successfulTransactions = revenue?.successfulTransactions ?? 0;
  const monthlyData = revenue?.monthlyData ?? [];
  const providerBreakdown = revenue?.providerBreakdown ?? [];
  const adminPercent = splitConfig?.adminPercent ?? revenue?.adminPercent ?? 0;
  const instructorPercent = splitConfig?.instructorPercent ?? revenue?.instructorPercent ?? 0;

  // Chart data
  const chartData = monthlyData.map((m) => ({
    name: m.month,
    revenue: m.revenue,
    adminRevenue: m.adminRevenue,
    instructorRevenue: m.instructorRevenue,
    subscriptionRevenue: m.subscriptionRevenue ?? 0,
    transactions: m.transactions,
  }));

  // Provider chart data
  const providerChartData = providerBreakdown.map((p) => ({
    name: p.provider,
    revenue: p.revenue,
    transactions: p.transactions,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-1">Tổng quan hệ thống</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Chào mừng {user?.fullName || 'Quản trị viên'}! Đây là thống kê mới nhất về nền tảng SecureLearn.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Tổng doanh thu"
          value={formatCurrency(totalRevenue)}
          sub={`Khóa học ${formatCurrency(courseRevenue)} · Thuê bao ${formatCurrency(subscriptionRevenue)}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          label="Giao dịch thành công"
          value={successfulTransactions.toLocaleString('vi-VN')}
          sub={`Tỷ lệ: QTV ${adminPercent}% / GV ${instructorPercent}%`}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <KpiCard
          label="Tổng người dùng"
          value={totalUsers.toLocaleString('vi-VN')}
          sub="Tài khoản học viên & giảng viên đăng ký"
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          label="Chờ duyệt"
          value={`${pendingCount} khóa học`}
          sub={pendingCount > 0 ? 'Cần kiểm duyệt ngay' : 'Không có khóa nào chờ'}
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      {/* Row 2: Revenue split summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Doanh thu khóa học', val: courseRevenue, icon: <BookOpen className="w-4 h-4 text-emerald-500" /> },
          {
            label: 'Doanh thu thuê bao',
            val: subscriptionRevenue,
            sub: `${subscriptionTransactions.toLocaleString('vi-VN')} giao dịch · ${activeSubscriptions.toLocaleString('vi-VN')} đang hoạt động · Tháng này ${formatCurrency(thisMonthSubscriptionRevenue)}`,
            icon: <CreditCard className="w-4 h-4 text-violet-500" />,
          },
          { label: 'Doanh thu QTV', val: totalAdminRevenue, icon: <DollarSign className="w-4 h-4 text-emerald-500" /> },
          { label: 'Doanh thu Giảng viên', val: totalInstructorRevenue, icon: <DollarSign className="w-4 h-4 text-blue-500" /> },
          {
            label: 'Doanh thu tháng này',
            val: thisMonthRevenue,
            sub: `QTV: ${formatCurrency(thisMonthAdminRevenue)}`,
            icon: <DollarSign className="w-4 h-4 text-amber-500" />,
          },
        ].map((item, idx) => (
          <div key={idx} className={`${cardClass} p-4 flex items-start justify-between gap-3`}>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                {formatCurrency(item.val)}
              </p>
              {item.sub && <p className="text-[10px] text-zinc-400 mt-1 truncate">{item.sub}</p>}
            </div>
            <div className="shrink-0 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mt-0.5">
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Pending courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className={`${cardClass} p-5 lg:col-span-2`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Doanh thu theo tháng</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Tổng doanh thu toàn nền tảng và phân chia thực nhận</p>
            </div>
            <Link to="/admin/finance/transactions" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80">
              Chi tiết <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {chartData.length > 0 ? (
            <ChartContainer config={monthlyChartConfig} className="h-64 w-full">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={8} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={3}
                  fill="url(#totalRevenueGrad)"
                  name="Tổng thu"
                />
                <Line
                  type="monotone"
                  dataKey="adminRevenue"
                  stroke="var(--color-adminRevenue)"
                  strokeWidth={1.75}
                  strokeOpacity={0.95}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Quản trị viên"
                />
                <Line
                  type="monotone"
                  dataKey="instructorRevenue"
                  stroke="var(--color-instructorRevenue)"
                  strokeWidth={1.75}
                  strokeOpacity={0.95}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Giảng viên"
                />                <Line
                  type="monotone"
                  dataKey="subscriptionRevenue"
                  stroke="var(--color-subscriptionRevenue)"
                  strokeWidth={1.75}
                  strokeOpacity={0.95}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Thuê bao"
                />
              </ComposedChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              <DollarSign className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu doanh thu.</p>
            </div>
          )}
        </div>

        {/* Pending courses */}
        <div className={`${cardClass} p-5 flex flex-col`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Khóa chờ duyệt</h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          {pendingCourses.length > 0 ? (
            <div className="flex-1 space-y-3">
              {pendingCourses.slice(0, 5).map((course) => (
                <div key={course._id} className="flex items-start gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate">{course.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {course.instructor?.fullName} · {course.totalLessons} bài học
                    </p>
                    {course.submittedAt && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(course.submittedAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-zinc-400">
              <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Không có khóa nào chờ duyệt.</p>
            </div>
          )}
          <Link
            to="/admin/courses/review"
            className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Provider breakdown */}
      {providerChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${cardClass} p-5`}>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Doanh thu theo cổng thanh toán</h3>
            <ChartContainer config={providerChartConfig} className="h-56 w-full">
              <BarChart data={providerChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel={false}
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className={`${cardClass} p-5`}>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Chi tiết cổng thanh toán</h3>
            <div className="space-y-3">
              {providerBreakdown.map((p) => (
                <div key={p.provider} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">{p.provider}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{p.transactions} giao dịch</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(p.revenue)}</p>
                    <p className="text-xs text-zinc-400">QTV: {formatCurrency(p.adminRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/finance/transactions"
          onClick={() => dispatch(setSidebarOpen(true))}
          className={`${cardClass} p-5 hover:shadow-md hover:border-primary/30 transition-all group`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Quản lý giao dịch</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Xem chi tiết & cấu hình chia doanh thu</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/users/list"
          onClick={() => dispatch(setSidebarOpen(true))}
          className={`${cardClass} p-5 hover:shadow-md hover:border-primary/30 transition-all group`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Quản lý người dùng</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{totalUsers.toLocaleString('vi-VN')} người dùng đăng ký</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/courses/review"
          onClick={() => dispatch(setSidebarOpen(true))}
          className={`${cardClass} p-5 hover:shadow-md hover:border-primary/30 transition-all group`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Kiểm duyệt khóa học</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{pendingCount} khóa chờ duyệt</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};





