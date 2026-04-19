import React from 'react';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAppSelector } from '@/app/hooks';

// Mock Data
const data = [
  { name: 'T1', revenue: 4000, students: 240 },
  { name: 'T2', revenue: 3000, students: 139 },
  { name: 'T3', revenue: 2000, students: 980 },
  { name: 'T4', revenue: 2780, students: 390 },
  { name: 'T5', revenue: 1890, students: 480 },
  { name: 'T6', revenue: 2390, students: 380 },
  { name: 'T7', revenue: 3490, students: 430 },
];

const recentActivities = [
  { id: 1, type: 'enrollment', message: 'Nguyen Van A đã đăng ký khóa Khởi đầu lập trình web', time: '2 giờ trước' },
  { id: 2, type: 'review', message: 'Tran B đã để lại đánh giá 5 sao cho khóa Python cơ bản', time: '5 giờ trước' },
  { id: 3, type: 'question', message: 'Le C đã hỏi một câu trong phần Mảng (Arrays)', time: '1 ngày trước' },
];

export const InstructorDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Chào mừng trở lại, {user?.fullName || 'Giảng viên'}!
        </h1>
        <p className="text-muted-foreground mt-2">Dưới đây là tình hình các khóa học của bạn trong tháng qua.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tổng doanh thu</p>
              <h3 className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">₫12.5M</h3>
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
              <h3 className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">1,248</h3>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+42 học viên mới</span>
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
              <h3 className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">4</h3>
            </div>
            <div className="h-12 w-12 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            <span>2 khóa đang Draft</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Biểu đồ doanh thu & Học viên</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Doanh thu" />
                <Line yAxisId="right" type="monotone" dataKey="students" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Học viên" />
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
          <button className="w-full mt-6 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Xem tất cả hoạt động
          </button>
        </div>
      </div>
    </div>
  );
};
