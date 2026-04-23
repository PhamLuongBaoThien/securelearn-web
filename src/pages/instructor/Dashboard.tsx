// ========================
// Instructor Dashboard: Tổng quan (Nâng cấp)
// Thêm completion rate, phân loại activity feed, thông báo badge.
// ========================
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  Loader2,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  MessageSquare,
  CreditCard,
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
import { useAppSelector } from '@/app/hooks';
import { useGetMyCourses } from '@/hooks/useInstructorCourses';

// Mock Chart Data (sẽ thay bằng analytics API sau)
const chartData = [
  { name: 'T1', revenue: 4000000, students: 24 },
  { name: 'T2', revenue: 3000000, students: 13 },
  { name: 'T3', revenue: 5200000, students: 42 },
  { name: 'T4', revenue: 2780000, students: 39 },
  { name: 'T5', revenue: 6890000, students: 48 },
  { name: 'T6', revenue: 4390000, students: 38 },
  { name: 'T7', revenue: 7490000, students: 53 },
];

const recentActivities = [
  { id: 1, type: 'payment', message: 'Nguyễn Văn A đã thanh toán khóa học React Masterclass', time: '2 phút trước', unread: true },
  { id: 2, type: 'enrollment', message: 'Trần Thị B vừa ghi danh vào DevOps Fundamentals', time: '1 giờ trước', unread: true },
  { id: 3, type: 'review', message: 'Học viên để lại đánh giá 5★ cho React Masterclass', time: '3 giờ trước', unread: false },
  { id: 4, type: 'question', message: 'Có câu hỏi mới trong mục Tương tác lớp học', time: '1 ngày trước', unread: false },
  { id: 5, type: 'enrollment', message: 'Lê Minh C đã ghi danh vào React Masterclass 2024', time: '2 ngày trước', unread: false },
];

const activityConfig: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
  payment: {
    color: 'bg-green-500',
    bg: 'bg-green-500/10',
    icon: <CreditCard className="w-4 h-4 text-green-600" />,
  },
  enrollment: {
    color: 'bg-blue-500',
    bg: 'bg-blue-500/10',
    icon: <UserPlus className="w-4 h-4 text-blue-600" />,
  },
  review: {
    color: 'bg-yellow-500',
    bg: 'bg-yellow-500/10',
    icon: <Star className="w-4 h-4 text-yellow-600" />,
  },
  question: {
    color: 'bg-purple-500',
    bg: 'bg-purple-500/10',
    icon: <MessageSquare className="w-4 h-4 text-purple-600" />,
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export const InstructorDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: courses = [], isLoading } = useGetMyCourses();

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED').length;
  const draftCourses = courses.filter((c) => c.status === 'DRAFT').length;
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  const totalRevenueMock = chartData.reduce((s, d) => s + d.revenue, 0);
  const thisMonthRevenue = chartData[chartData.length - 1].revenue;

  const unreadCount = recentActivities.filter((a) => a.unread).length;

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
          <p className="text-muted-foreground mt-2">Dưới đây là tổng quan về các khóa học của bạn hôm nay.</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium border border-primary/20 animate-pulse">
            <span className="w-2 h-2 bg-primary rounded-full" />
            {unreadCount} thông báo mới
          </div>
        )}
      </div>

      {/* Stats Grid — 4 cards hàng 1 + 2 cards hàng 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Tổng doanh thu */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">{formatCurrency(totalRevenueMock)}</h3>
            </div>
            <div className="h-12 w-12 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+12.5% so với tháng trước</span>
          </div>
        </div>

        {/* Tháng này */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tháng này</p>
              <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">{formatCurrency(thisMonthRevenue)}</h3>
            </div>
            <div className="h-12 w-12 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+8.3% so với T6</span>
          </div>
        </div>

        {/* Học viên */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Học viên</p>
              <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">{totalStudents.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Từ {publishedCourses} khóa đã xuất bản</span>
          </div>
        </div>

        {/* Tỷ lệ hoàn thành */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Hoàn thành TB</p>
              <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">73%</h3>
            </div>
            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '73%' }} />
          </div>
          <p className="mt-1 text-xs text-zinc-400">Progress Service (mock)</p>
        </div>
      </div>

      {/* Row 2: Stats nhỏ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng khóa học', value: totalCourses, color: 'text-purple-600 dark:text-purple-400', icon: <BookOpen className="w-5 h-5" /> },
          { label: 'Đã xuất bản', value: publishedCourses, color: 'text-green-600 dark:text-green-400', icon: <CheckCircle2 className="w-5 h-5" /> },
          { label: 'Bản nháp', value: draftCourses, color: 'text-yellow-600 dark:text-yellow-400', icon: <Clock className="w-5 h-5" /> },
          { label: 'Đánh giá TB', value: '4.8★', color: 'text-yellow-500', icon: <Star className="w-5 h-5" /> },
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

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Biểu đồ Doanh thu & Học viên</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis yAxisId="left" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Doanh thu" />
                <Line yAxisId="right" type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Học viên" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const cfg = activityConfig[activity.type];
              return (
                <div key={activity.id} className={`flex gap-3 p-3 rounded-xl transition-colors ${activity.unread ? 'bg-primary/5 border border-primary/10' : ''}`}>
                  <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 dark:text-zinc-200 line-clamp-2">{activity.message}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span>{activity.time}</span>
                      {activity.unread && <span className="w-1.5 h-1.5 bg-primary rounded-full ml-1" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            to="/instructor/communication"
            className="flex items-center justify-center gap-2 w-full mt-5 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
