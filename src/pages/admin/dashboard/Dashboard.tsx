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
  LockKeyhole,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { getUsers, getCoursesForReview, getRevenueStats, getRevenueSplitConfig } from '@/services/adminApi';
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
    label: 'Người giảng dạy',
    color: 'var(--chart-3)',
  },
  subscriptionRevenue: {
    label: 'Thuê bao',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

const buildRecentMonthlyChartData = (
  monthlyData: Array<{
    month: string;
    revenue: number;
    adminRevenue: number;
    instructorRevenue: number;
    subscriptionRevenue?: number;
    transactions: number;
  }>,
) => {
  const dataByMonth = new Map(monthlyData.map((item) => [item.month, item]));
  const currentMonth = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (11 - index), 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const item = dataByMonth.get(`${year}-${month}`);

    return {
      name: `T${month}/${year}`,
      revenue: item?.revenue ?? 0,
      adminRevenue: item?.adminRevenue ?? 0,
      instructorRevenue: item?.instructorRevenue ?? 0,
      subscriptionRevenue: item?.subscriptionRevenue ?? 0,
      transactions: item?.transactions ?? 0,
    };
  });
};

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
  const { user } = useAppSelector((state) => state.adminAuth);
  const isSuperAdmin = user?.adminRole === 'SUPER_ADMIN';
  const canViewFinance = isSuperAdmin || user?.permissions?.includes('finance:read') === true;
  const canViewUsers = isSuperAdmin || user?.permissions?.includes('user:read') === true;
  const canReviewCourses = isSuperAdmin || user?.permissions?.includes('course:approve') === true;

  // Fetch users stats
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'users'],
    queryFn: async () => {
      const res = await getUsers({ limit: 1 });
      return res.data;
    },
    enabled: canViewUsers,
  });

  // Fetch courses pending review
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'courses-review'],
    queryFn: async () => {
      const res = await getCoursesForReview({ limit: 5 });
      return res.data;
    },
    enabled: canReviewCourses,
  });

  // Fetch revenue stats
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'revenue'],
    queryFn: async () => {
      const res = await getRevenueStats();
      return res.data;
    },
    enabled: canViewFinance,
  });

  // Fetch split config
  const { data: splitConfig } = useQuery({
    queryKey: ['admin', 'dashboard', 'split-config'],
    queryFn: async () => {
      const res = await getRevenueSplitConfig();
      return res.data;
    },
    enabled: canViewFinance,
  });

  const isLoading = (canViewUsers && usersLoading)
    || (canReviewCourses && coursesLoading)
    || (canViewFinance && revenueLoading);

  // Data
  const totalUsers = usersData?.total ?? 0;
  const pendingCourses = coursesData?.courses ?? [];
  const pendingCount = coursesData?.total ?? 0;
  const revenue = canViewFinance ? revenueData : undefined;
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
  const adminPercent = splitConfig?.adminPercent ?? revenue?.adminPercent ?? 0;
  const instructorPercent = splitConfig?.instructorPercent ?? revenue?.instructorPercent ?? 0;

  // Chart data
  const chartData = buildRecentMonthlyChartData(monthlyData);

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
          value={canViewFinance ? formatCurrency(totalRevenue) : '—'}
          sub={canViewFinance
            ? `Khóa học ${formatCurrency(courseRevenue)} · Thuê bao ${formatCurrency(subscriptionRevenue)}`
            : 'Bạn không có quyền xem dữ liệu tài chính'}
          icon={canViewFinance ? <DollarSign className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
        />
        <KpiCard
          label="Giao dịch thành công"
          value={canViewFinance ? successfulTransactions.toLocaleString('vi-VN') : '—'}
          sub={canViewFinance
            ? `Tỷ lệ: QTV ${adminPercent}% / GV ${instructorPercent}%`
            : 'Bạn không có quyền xem dữ liệu tài chính'}
          icon={canViewFinance ? <CreditCard className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
        />
        <KpiCard
          label="Tổng người dùng"
          value={canViewUsers ? totalUsers.toLocaleString('vi-VN') : '—'}
          sub={canViewUsers
            ? 'Tài khoản học viên và người giảng dạy đã đăng ký'
            : 'Bạn không có quyền xem dữ liệu người dùng'}
          icon={canViewUsers ? <Users className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
        />
        <KpiCard
          label="Chờ duyệt"
          value={canReviewCourses ? `${pendingCount} khóa học` : '—'}
          sub={canReviewCourses
            ? pendingCount > 0 ? 'Cần kiểm duyệt ngay' : 'Không có khóa nào chờ'
            : 'Bạn không có quyền duyệt khóa học'}
          icon={canReviewCourses ? <AlertCircle className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
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
          { label: 'Thu nhập từ giảng dạy', val: totalInstructorRevenue, icon: <DollarSign className="w-4 h-4 text-blue-500" /> },
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
                {canViewFinance ? formatCurrency(item.val) : '—'}
              </p>
              {canViewFinance
                ? item.sub && <p className="text-[10px] text-zinc-400 mt-1 truncate">{item.sub}</p>
                : <p className="text-[10px] text-zinc-400 mt-1 truncate">Bạn không có quyền xem dữ liệu tài chính</p>}
            </div>
            <div className="shrink-0 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mt-0.5">
              {canViewFinance ? item.icon : <LockKeyhole className="h-4 w-4" />}
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Tổng doanh thu toàn nền tảng và phân chia thực nhận trong 12 tháng gần nhất.</p>
            </div>
            {canViewFinance ? (
              <Link to="/admin/finance/transactions" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80">
                Chi tiết <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <LockKeyhole className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            )}
          </div>
          {!canViewFinance ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 px-4 text-center dark:border-zinc-800">
              <LockKeyhole className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Không có quyền xem dữ liệu tài chính</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Liên hệ Super Admin nếu bạn cần quyền truy cập.</p>
            </div>
          ) : monthlyData.length > 0 ? (
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
                      labelFormatter={(label) => `Tháng ${String(label).replace(/^T/, '')}`}
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
                  name="Người giảng dạy"
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
            {!canReviewCourses ? (
              <LockKeyhole className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            ) : pendingCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          {!canReviewCourses ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center dark:border-zinc-800">
              <LockKeyhole className="mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Không có quyền duyệt khóa học</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Liên hệ Super Admin nếu bạn cần quyền truy cập.</p>
            </div>
          ) : pendingCourses.length > 0 ? (
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
          {canReviewCourses && (
            <Link
              to="/admin/courses/review"
              className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

    </div>
  );
};
