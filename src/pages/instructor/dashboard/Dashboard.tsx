// ========================
// Instructor Dashboard: Tổng quan
// Hiển thị dữ liệu thật từ courses API + revenue API
// ========================
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  DollarSign,
  Star,
  Clock,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Percent,
  MessageSquare,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { useGetMyCourses } from '@/hooks/useInstructorCourses';
import { getInstructorRevenueStats } from '@/services/paymentApi';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export const InstructorDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: courses = [], isLoading: coursesLoading } = useGetMyCourses();

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['instructor', 'finance', 'revenue'],
    queryFn: async () => {
      const response = await getInstructorRevenueStats();
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải dữ liệu doanh thu.');
      }
      return response.data;
    },
  });

  const isLoading = coursesLoading || revenueLoading;

  // Course stats — dữ liệu thật
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED').length;
  const draftCourses = courses.filter((c) => c.status === 'DRAFT').length;
  const pendingCourses = courses.filter((c) => c.status === 'PENDING').length;
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);

  // Revenue stats — dữ liệu thật
  const totalInstructorRevenue = revenue?.totalInstructorRevenue ?? 0;
  const totalGrossRevenue = revenue?.totalGrossRevenue ?? 0;
  const totalTransactions = revenue?.totalTransactions ?? 0;
  const instructorPercent = revenue?.instructorPercent ?? 0;
  const adminPercent = revenue?.adminPercent ?? 0;
  const monthlyData = revenue?.monthlyData ?? [];
  const topCourses = revenue?.courseBreakdown ?? [];

  // Chart data from real monthly data
  const chartData = monthlyData.map((m) => ({
    name: m.month,
    revenue: m.instructorRevenue,
    transactions: m.transactions,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Chào mừng trở lại, {user?.fullName || 'Giảng viên'}!
          </h1>
          <p className="text-muted-foreground mt-2">Dưới đây là tổng quan về các khóa học và doanh thu của bạn.</p>
        </div>
      </div>

      {/* Stats Grid — 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Doanh thu thực nhận */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Doanh thu thực nhận</p>
              <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">{formatCurrency(totalInstructorRevenue)}</h3>
            </div>
            <div className="h-12 w-12 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Tổng thu: {formatCurrency(totalGrossRevenue)}
          </p>
        </div>

        {/* Giao dịch thành công */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Giao dịch thành công</p>
              <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">{totalTransactions.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="h-12 w-12 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Tỷ lệ chia: Giảng viên {instructorPercent}% / QTV {adminPercent}%
          </p>
        </div>

        {/* Tổng học viên */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tổng học viên</p>
              <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">{totalStudents.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Từ {publishedCourses} khóa đã xuất bản
          </p>
        </div>

        {/* Đánh giá */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Đánh giá</p>
              <h3 className="text-2xl font-bold mt-1 text-zinc-300 dark:text-zinc-600">—</h3>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Sắp ra mắt
          </p>
        </div>
      </div>

      {/* Row 2: Khóa học stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng khóa học', value: totalCourses, color: 'text-purple-600 dark:text-purple-400', icon: <BookOpen className="w-5 h-5" /> },
          { label: 'Đã xuất bản', value: publishedCourses, color: 'text-green-600 dark:text-green-400', icon: <CheckCircle2 className="w-5 h-5" /> },
          { label: 'Bản nháp', value: draftCourses, color: 'text-yellow-600 dark:text-yellow-400', icon: <Clock className="w-5 h-5" /> },
          { label: 'Chờ duyệt', value: pendingCourses, color: 'text-orange-600 dark:text-orange-400', icon: <AlertCircle className="w-5 h-5" /> },
        ].map((s) => (
          <div key={s.label} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex items-center gap-3">
            <div className={`${s.color} shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Top courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Doanh thu theo tháng</h3>
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
                    formatter={(value, name) => [
                      name === 'Doanh thu' ? formatCurrency(Number(value ?? 0)) : `${value} giao dịch`,
                      String(name),
                    ]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Doanh thu" />
                  <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Giao dịch" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <DollarSign className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu doanh thu.</p>
            </div>
          )}
        </div>

        {/* Top courses */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Top khóa học</h3>
            <Link to="/instructor/performance" className="text-xs text-primary hover:text-primary/80 transition-colors">
              Xem chi tiết
            </Link>
          </div>
          {topCourses.length > 0 ? (
            <div className="space-y-4">
              {topCourses.slice(0, 5).map((c, index) => (
                <div key={c.courseId} className="flex gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">{c.courseTitle}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      <span>{c.transactions} giao dịch</span>
                      <span className="text-emerald-500 font-semibold">{formatCurrency(c.instructorRevenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <BookOpen className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Chưa có giao dịch nào.</p>
            </div>
          )}
          {topCourses.length > 0 && (
            <Link
              to="/instructor/performance"
              className="flex items-center justify-center gap-2 w-full mt-5 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Xem phân tích đầy đủ <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/instructor/performance"
          className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/30 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Phân tích doanh thu</p>
              <p className="text-xs text-zinc-400">Chi tiết theo khóa, cổng TT</p>
            </div>
          </div>
        </Link>
        <Link
          to="/instructor/courses"
          className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/30 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Quản lý khóa học</p>
              <p className="text-xs text-zinc-400">{totalCourses} khóa · {publishedCourses} đã xuất bản</p>
            </div>
          </div>
        </Link>
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Đánh giá học viên</p>
              <p className="text-xs text-zinc-400">Sắp ra mắt</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
