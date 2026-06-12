// ========================
// Admin Dashboard: Bảng điều khiển
// Hiển thị dữ liệu thật từ API: users, courses, revenue
// ========================
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, DollarSign, Loader2,
  CheckCircle2, Clock, AlertCircle, ArrowRight,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { getUsers, getCoursesForReview, getRevenueStats, getRevenueSplitConfig } from '@/services/adminApi';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

type StatCardProps = {
  title: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
};

const StatCard = ({ title, value, sub, icon: Icon, iconColor, iconBg }: StatCardProps) => (
  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white tracking-tight">{value}</h3>
        {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
      </div>
      <div className={`h-12 w-12 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
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
  const thisMonthRevenue = revenue?.thisMonthRevenue ?? 0;
  const thisMonthAdminRevenue = revenue?.thisMonthAdminRevenue ?? 0;
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
    <div className="w-full space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Tổng quan hệ thống</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Chào mừng {user?.fullName || 'Quản trị viên'}! Đây là thống kê mới nhất về nền tảng SecureLearn.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(totalRevenue)}
          sub={`Quản trị viên: ${formatCurrency(totalAdminRevenue)}`}
          icon={DollarSign}
          iconColor="text-green-600 dark:text-green-400"
          iconBg="bg-green-500/10"
        />
        <StatCard
          title="Giao dịch thành công"
          value={successfulTransactions.toLocaleString('vi-VN')}
          sub={`Tỷ lệ: QTV ${adminPercent}% / GV ${instructorPercent}%`}
          icon={CreditCard}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
        <StatCard
          title="Tổng người dùng"
          value={totalUsers.toLocaleString('vi-VN')}
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          title="Chờ duyệt"
          value={`${pendingCount} khóa học`}
          sub={pendingCount > 0 ? 'Cần kiểm duyệt' : 'Không có khóa nào'}
          icon={AlertCircle}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-500/10"
        />
      </div>

      {/* Row 2: Revenue split summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex items-center gap-3">
          <div className="text-emerald-600 dark:text-emerald-400 shrink-0"><DollarSign className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-zinc-500">Doanh thu QTV</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatCurrency(totalAdminRevenue)}</p>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex items-center gap-3">
          <div className="text-blue-600 dark:text-blue-400 shrink-0"><DollarSign className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-zinc-500">Doanh thu Giảng viên</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatCurrency(totalInstructorRevenue)}</p>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex items-center gap-3">
          <div className="text-violet-600 dark:text-violet-400 shrink-0"><DollarSign className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-zinc-500">Doanh thu tháng này</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatCurrency(thisMonthRevenue)}</p>
            <p className="text-xs text-zinc-400 mt-0.5">QTV: {formatCurrency(thisMonthAdminRevenue)}</p>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex items-center gap-3">
          <div className="text-amber-600 dark:text-amber-400 shrink-0"><CreditCard className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-zinc-500">Thuê bao hoạt động</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{activeSubscriptions.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Chart + Pending courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Doanh thu theo tháng</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Tổng doanh thu nền tảng</p>
          {chartData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value, name) => [formatCurrency(Number(value ?? 0)), String(name)]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Tổng thu" />
                  <Line type="monotone" dataKey="adminRevenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Quản trị viên" />
                  <Line type="monotone" dataKey="instructorRevenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Giảng viên" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <DollarSign className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu doanh thu.</p>
            </div>
          )}
        </div>

        {/* Pending courses */}
        <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col">
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
                <div key={course._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">{course.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {course.instructor?.fullName} · {course.totalLessons} bài
                    </p>
                    {course.submittedAt && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
                        <Clock className="w-3 h-3" />
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
            className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Provider breakdown */}
      {providerChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Doanh thu theo cổng thanh toán</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Doanh thu']}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Chi tiết cổng thanh toán</h3>
            <div className="space-y-4">
              {providerBreakdown.map((p) => (
                <div key={p.provider} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{p.provider}</p>
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
          className="p-5 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/30 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Quản lý giao dịch</p>
              <p className="text-xs text-zinc-400">Xem chi tiết & cấu hình chia doanh thu</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/users/list"
          className="p-5 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/30 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Quản lý người dùng</p>
              <p className="text-xs text-zinc-400">{totalUsers} người dùng đăng ký</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/courses/review"
          className="p-5 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/30 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Kiểm duyệt khóa học</p>
              <p className="text-xs text-zinc-400">{pendingCount} khóa chờ duyệt</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};
