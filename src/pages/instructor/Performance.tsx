// ========================
// Instructor Performance: Hiệu suất & Thống kê
// Hiển thị doanh thu, tăng trưởng học viên, đánh giá qua biểu đồ.
// ========================
import React from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Star,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useGetMyCourses } from '@/hooks/useInstructorCourses';

// Mock data cho biểu đồ (sẽ thay bằng API analytics sau)
const revenueData = [
  { name: 'T1', revenue: 2400000 },
  { name: 'T2', revenue: 1350000 },
  { name: 'T3', revenue: 4200000 },
  { name: 'T4', revenue: 3780000 },
  { name: 'T5', revenue: 5890000 },
  { name: 'T6', revenue: 4390000 },
  { name: 'T7', revenue: 6490000 },
  { name: 'T8', revenue: 5200000 },
  { name: 'T9', revenue: 7100000 },
  { name: 'T10', revenue: 6300000 },
  { name: 'T11', revenue: 8200000 },
  { name: 'T12', revenue: 9500000 },
];

const enrollmentData = [
  { name: 'T1', students: 24 },
  { name: 'T2', students: 35 },
  { name: 'T3', students: 42 },
  { name: 'T4', students: 28 },
  { name: 'T5', students: 68 },
  { name: 'T6', students: 55 },
  { name: 'T7', students: 73 },
  { name: 'T8', students: 62 },
  { name: 'T9', students: 81 },
  { name: 'T10', students: 70 },
  { name: 'T11', students: 92 },
  { name: 'T12', students: 105 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export const InstructorPerformance: React.FC = () => {
  const { data: courses = [], isLoading } = useGetMyCourses();

  // Tính toán thống kê từ dữ liệu khóa học thật
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED').length;
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  const totalLessons = courses.reduce((sum, c) => sum + (c.totalLessons || 0), 0);

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
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Hiệu suất</h1>
        <p className="text-muted-foreground mt-2">Theo dõi tăng trưởng và hiệu quả giảng dạy của bạn.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<DollarSign className="w-6 h-6" />} 
          iconBg="bg-green-500/10 text-green-600 dark:text-green-400"
          label="Tổng doanh thu" 
          value={formatCurrency(revenueData.reduce((s, d) => s + d.revenue, 0))} 
          subLabel="+18.2% so với năm trước" 
          subColor="text-green-600 dark:text-green-400"
        />
        <StatCard 
          icon={<Users className="w-6 h-6" />} 
          iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          label="Tổng học viên" 
          value={totalStudents.toLocaleString('vi-VN')} 
          subLabel={`${enrollmentData[enrollmentData.length - 1].students} học viên mới tháng này`}
          subColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard 
          icon={<BookOpen className="w-6 h-6" />} 
          iconBg="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          label="Khóa học" 
          value={`${publishedCourses} / ${totalCourses}`} 
          subLabel={`${totalLessons} bài giảng tổng cộng`}
          subColor="text-zinc-500"
        />
        <StatCard 
          icon={<Star className="w-6 h-6" />} 
          iconBg="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
          label="Điểm đánh giá" 
          value="4.8" 
          subLabel="Dựa trên 342 đánh giá"
          subColor="text-zinc-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Doanh thu theo tháng</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrollment Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Học viên mới theo tháng</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  formatter={(value: number) => [`${value} học viên`, 'Đăng ký mới']}
                />
                <Area type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStudents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Course Performance Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Hiệu suất từng khóa học</h3>
        {courses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Chưa có khóa học nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">Khóa học</th>
                  <th className="text-center py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">Trạng thái</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">Học viên</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">Bài giảng</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">Giá</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors">
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white max-w-[300px] truncate">{course.title}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${
                        course.status === 'PUBLISHED'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {course.status === 'PUBLISHED' ? 'Xuất bản' : 'Nháp'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">{course.enrollmentCount || 0}</td>
                    <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">{course.totalLessons || 0}</td>
                    <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">{formatCurrency(course.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== Reusable Stat Card =====
function StatCard({ icon, iconBg, label, value, subLabel, subColor }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subLabel: string;
  subColor: string;
}) {
  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <h3 className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">{value}</h3>
        </div>
        <div className={`h-12 w-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${subColor}`}>
        <TrendingUp className="w-4 h-4" />
        <span>{subLabel}</span>
      </div>
    </div>
  );
}
