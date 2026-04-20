// ========================
// Instructor Dashboard: Tổng quan (Real API + Mock Charts)
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
  { id: 1, type: 'enrollment', message: 'Một học viên mới đã ghi danh vào khóa học của bạn', time: '2 giờ trước' },
  { id: 2, type: 'review', message: 'Học viên đã để lại đánh giá 5 sao', time: '5 giờ trước' },
  { id: 3, type: 'question', message: 'Có câu hỏi mới trong mục Giao tiếp', time: '1 ngày trước' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export const InstructorDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: courses = [], isLoading } = useGetMyCourses();

  // Thống kê từ dữ liệu thật
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED').length;
  const draftCourses = courses.filter((c) => c.status === 'DRAFT').length;
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Chào mừng trở lại, {user?.fullName || 'Giảng viên'}!
        </h1>
        <p className="text-muted-foreground mt-2">Dưới đây là tổng quan về các khóa học của bạn.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tổng doanh thu</p>
              <h3 className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">{formatCurrency(chartData.reduce((s, d) => s + d.revenue, 0))}</h3>
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

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Học viên</p>
              <h3 className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">{totalStudents.toLocaleString('vi-VN')}</h3>
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

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Điểm đánh giá</p>
              <h3 className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">4.8</h3>
            </div>
            <div className="h-12 w-12 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Dựa trên 342 đánh giá</span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Khóa học</p>
              <h3 className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">{totalCourses}</h3>
            </div>
            <div className="h-12 w-12 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            <span>{draftCourses > 0 ? `${draftCourses} bản nháp` : 'Tất cả đã xuất bản'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Biểu đồ doanh thu & Học viên</h3>
          <div className="h-[300px] w-full">
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
          <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Hoạt động gần đây</h3>
          <div className="space-y-6">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className="mt-1">
                  <div className={`w-2 h-2 rounded-full mt-1.5
                    ${activity.type === 'enrollment' ? 'bg-blue-500' :
                      activity.type === 'review' ? 'bg-yellow-500' : 'bg-purple-500'}`
                  }></div>
                </div>
                <div>
                  <p className="text-sm text-zinc-900 dark:text-zinc-200">{activity.message}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/instructor/communication"
            className="flex items-center justify-center gap-2 w-full mt-6 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
