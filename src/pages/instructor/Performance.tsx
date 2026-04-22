// ========================
// Instructor Learning Analytics: Phân tích Tiến độ & Heartbeat
// Completion rate chart, heartbeat heatmap, drop-off analysis.
// ========================
import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  TrendingUp,
  Activity,
  Clock,
  Loader2,
  Flame,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useGetMyCourses } from '@/hooks/useInstructorCourses';

// ===== Mock Data =====
const completionData = [
  { name: 'React Masterclass', completion: 78, students: 142 },
  { name: 'DevOps Fund.', completion: 61, students: 87 },
  { name: 'Python Advanced', completion: 84, students: 203 },
  { name: 'Node.js APIs', completion: 52, students: 65 },
  { name: 'Docker & K8s', completion: 70, students: 98 },
];

// Heatmap: 7 ngày x 8 khung giờ (0-7, 8-11, 12-14, 15-17, 18-20, 20-22, 22-24)
const HOURS = ['00-08', '08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-24'];
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const heatmapData: number[][] = [
  [2, 8, 12, 10, 25, 30, 28, 15],
  [3, 10, 14, 12, 28, 35, 32, 18],
  [2, 9, 11, 8, 22, 28, 24, 12],
  [4, 12, 16, 14, 30, 40, 38, 20],
  [3, 10, 13, 9, 26, 33, 30, 16],
  [1, 5, 8, 7, 18, 20, 22, 25],
  [1, 4, 6, 5, 12, 15, 18, 22],
];

const dropoffLessons = [
  { lesson: 'Bài 7: Redux Middleware', course: 'React Masterclass', dropRate: 42, avgWatch: '8:30', enrolled: 142 },
  { lesson: 'Bài 12: Docker Compose', course: 'DevOps Fund.', dropRate: 38, avgWatch: '11:20', enrolled: 87 },
  { lesson: 'Bài 3: Async/Await nâng cao', course: 'Node.js APIs', dropRate: 35, avgWatch: '5:45', enrolled: 65 },
  { lesson: 'Bài 19: K8s Networking', course: 'Docker & K8s', dropRate: 31, avgWatch: '14:10', enrolled: 98 },
];

const engagementData = [
  { lesson: 'Bài 1: Giới thiệu', avgTime: 22, replays: 8, quiz: 95 },
  { lesson: 'Bài 2: Components', avgTime: 34, replays: 15, quiz: 88 },
  { lesson: 'Bài 3: State & Props', avgTime: 41, replays: 22, quiz: 76 },
  { lesson: 'Bài 4: Hooks', avgTime: 38, replays: 18, quiz: 82 },
  { lesson: 'Bài 5: Context API', avgTime: 29, replays: 12, quiz: 79 },
];

const getHeatColor = (value: number, max: number) => {
  const intensity = value / max;
  if (intensity < 0.2) return 'bg-zinc-100 dark:bg-zinc-800';
  if (intensity < 0.4) return 'bg-blue-100 dark:bg-blue-900/30';
  if (intensity < 0.6) return 'bg-blue-300 dark:bg-blue-700/50';
  if (intensity < 0.8) return 'bg-blue-500/70 dark:bg-blue-500/60';
  return 'bg-blue-600 dark:bg-blue-400';
};

const maxHeat = Math.max(...heatmapData.flat());

export const InstructorPerformance: React.FC = () => {
  const { data: courses = [], isLoading } = useGetMyCourses();
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'dropoff' | 'engagement'>('overview');

  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  const totalLessons = courses.reduce((sum, c) => sum + (c.totalLessons || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const TABS = [
    { key: 'overview', label: 'Tổng quan', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'heatmap', label: 'Heartbeat', icon: <Activity className="w-4 h-4" /> },
    { key: 'dropoff', label: 'Bỏ dở', icon: <AlertTriangle className="w-4 h-4" /> },
    { key: 'engagement', label: 'Tương tác', icon: <Flame className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Phân tích Tiến độ & Heartbeat
        </h1>
        <p className="text-muted-foreground mt-2">
          Theo dõi hành vi học tập thời gian thực — ai đang học, bài nào bị bỏ dở, giờ nào sôi động nhất.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: 'Tổng học viên',
            value: totalStudents.toLocaleString('vi-VN'),
            sub: '105 mới tháng này',
            icon: <Users className="w-6 h-6" />,
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            subColor: 'text-blue-600',
          },
          {
            label: 'Hoàn thành TB',
            value: '73%',
            sub: '+5% so với tháng trước',
            icon: <CheckCircle2 className="w-6 h-6" />,
            color: 'bg-green-500/10 text-green-600 dark:text-green-400',
            subColor: 'text-green-600',
          },
          {
            label: 'Tổng bài giảng',
            value: totalLessons.toLocaleString('vi-VN'),
            sub: `${courses.length} khóa học`,
            icon: <BookOpen className="w-6 h-6" />,
            color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            subColor: 'text-zinc-400',
          },
          {
            label: 'Heartbeat hôm nay',
            value: '247',
            sub: 'Phiên học đang diễn ra',
            icon: <Activity className="w-6 h-6" />,
            color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
            subColor: 'text-orange-600',
          },
        ].map((s) => (
          <div key={s.label} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{s.label}</p>
                <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">{s.value}</h3>
              </div>
              <div className={`h-12 w-12 ${s.color} rounded-xl flex items-center justify-center`}>{s.icon}</div>
            </div>
            <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${s.subColor}`}>
              <TrendingUp className="w-4 h-4" />
              <span>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Overview — Completion Rate BarChart */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Tỷ lệ hoàn thành theo khóa học</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={11} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [`${value}%`, 'Hoàn thành']}
                  />
                  <Bar dataKey="completion" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-white">Hiệu suất từng khóa học</h3>
            <div className="space-y-4">
              {completionData.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-900 dark:text-white">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400">{item.students} HV</span>
                      <span className={`font-bold ${item.completion >= 75 ? 'text-green-600' : item.completion >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {item.completion}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${item.completion >= 75 ? 'bg-green-500' : item.completion >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${item.completion}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Heartbeat Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Heartbeat Heatmap — Tuần này</h3>
              <p className="text-sm text-muted-foreground mt-1">Số phiên học viên đang hoạt động theo giờ và ngày.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Ít</span>
              {['bg-zinc-100', 'bg-blue-100', 'bg-blue-300', 'bg-blue-500/70', 'bg-blue-600'].map((c) => (
                <div key={c} className={`w-5 h-5 rounded ${c} dark:opacity-80`} />
              ))}
              <span>Nhiều</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header hours */}
              <div className="flex gap-2 mb-2 pl-10">
                {HOURS.map((h) => (
                  <div key={h} className="flex-1 text-center text-xs text-zinc-400 font-medium">{h}</div>
                ))}
              </div>
              {/* Rows */}
              {DAYS.map((day, dIdx) => (
                <div key={day} className="flex items-center gap-2 mb-2">
                  <div className="w-8 text-xs font-medium text-zinc-500 text-center">{day}</div>
                  {heatmapData[dIdx].map((val, hIdx) => (
                    <div
                      key={hIdx}
                      className={`flex-1 h-9 rounded-lg ${getHeatColor(val, maxHeat)} transition-all cursor-default hover:scale-105`}
                      title={`${day} ${HOURS[hIdx]}: ${val} phiên`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Giờ cao điểm', value: 'T5 16-18h', sub: '40 phiên đồng thời', icon: <Flame className="w-4 h-4 text-orange-500" /> },
              { label: 'Ngày sôi động', value: 'Thứ Năm', sub: 'TB 28 phiên/giờ', icon: <Activity className="w-4 h-4 text-blue-500" /> },
              { label: 'Tổng phiên/tuần', value: '1,247', sub: '+18% tuần trước', icon: <TrendingUp className="w-4 h-4 text-green-500" /> },
            ].map((s) => (
              <div key={s.label} className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">{s.value}</p>
                  <p className="text-xs text-zinc-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Drop-off */}
      {activeTab === 'dropoff' && (
        <div className="space-y-5">
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Các bài giảng có <span className="font-semibold">tỷ lệ bỏ dở cao</span> cần được xem xét và cải thiện nội dung hoặc rút ngắn thời lượng.
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-950">
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-medium text-zinc-500">Bài giảng</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-500 hidden md:table-cell">Khóa học</th>
                    <th className="text-center py-3 px-4 font-medium text-zinc-500">Tỷ lệ bỏ dở</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-500 hidden lg:table-cell">Xem TB</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-500 hidden lg:table-cell">Học viên</th>
                  </tr>
                </thead>
                <tbody>
                  {dropoffLessons.map((lesson, idx) => (
                    <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors">
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">{lesson.lesson}</td>
                      <td className="py-3 px-4 text-zinc-500 hidden md:table-cell">{lesson.course}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 hidden sm:block">
                            <div className={`h-2 rounded-full ${lesson.dropRate >= 40 ? 'bg-red-500' : lesson.dropRate >= 30 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${lesson.dropRate}%` }} />
                          </div>
                          <span className={`font-bold text-sm ${lesson.dropRate >= 40 ? 'text-red-500' : lesson.dropRate >= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {lesson.dropRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-500 hidden lg:table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {lesson.avgWatch}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-500 hidden lg:table-cell">{lesson.enrolled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Lesson Engagement */}
      {activeTab === 'engagement' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white">Thời gian xem trung bình (phút)</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="lesson" stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [`${value} phút`, 'Xem TB']}
                  />
                  <Area type="monotone" dataKey="avgTime" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTime)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-950">
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-medium text-zinc-500">Bài giảng</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-500">Xem TB (phút)</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-500">Replay</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-500">Điểm Quiz</th>
                  </tr>
                </thead>
                <tbody>
                  {engagementData.map((item, idx) => (
                    <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors">
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">{item.lesson}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">{item.avgTime}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">{item.replays}x</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold ${item.quiz >= 85 ? 'text-green-600' : item.quiz >= 70 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {item.quiz}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
