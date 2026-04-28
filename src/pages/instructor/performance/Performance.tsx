// ========================
// Instructor Performance: Hiệu suất — 5 sub-tabs
// Tổng quan | Doanh thu | Học viên | Đánh giá | Tương tác
// ========================
import React, { useState } from 'react';
import {
  LayoutDashboard, DollarSign, Users, Star, TrendingUp,
  ArrowUp, ArrowDown, BookOpen, Clock, Award,
} from 'lucide-react';

type PerfTab = 'overview' | 'revenue' | 'students' | 'reviews' | 'engagement';

const PERF_TABS: { id: PerfTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',    label: 'Tổng quan',         icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'revenue',     label: 'Doanh thu',          icon: <DollarSign className="w-4 h-4" /> },
  { id: 'students',    label: 'Học viên',           icon: <Users className="w-4 h-4" /> },
  { id: 'reviews',     label: 'Đánh giá',           icon: <Star className="w-4 h-4" /> },
  { id: 'engagement',  label: 'Mức độ tương tác',  icon: <TrendingUp className="w-4 h-4" /> },
];

// Stat card component
const StatCard: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode; trend?: 'up' | 'down'; trendVal?: string }> = ({
  label, value, sub, icon, trend, trendVal
}) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary`}>{icon}</div>
    </div>
    <div>
      <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
    {trend && trendVal && (
      <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
        {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {trendVal} so với tháng trước
      </div>
    )}
  </div>
);

// Bar chart mock
const MiniBar: React.FC<{ label: string; value: number; max: number; color?: string }> = ({ label, value, max, color = 'bg-primary' }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-zinc-500 w-20 shrink-0 truncate">{label}</span>
    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 w-10 text-right">{value.toLocaleString()}</span>
  </div>
);

// ─── Tab: Tổng quan ───
const OverviewTab = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Tổng doanh thu" value="48.2M ₫" icon={<DollarSign className="w-4 h-4" />} trend="up" trendVal="+12.3%" />
      <StatCard label="Học viên mới" value="284" sub="tháng này" icon={<Users className="w-4 h-4" />} trend="up" trendVal="+8.1%" />
      <StatCard label="Đánh giá TB" value="4.8 ★" sub="từ 1,240 đánh giá" icon={<Star className="w-4 h-4" />} />
      <StatCard label="Tỷ lệ hoàn thành" value="72%" sub="trung bình tất cả KH" icon={<Award className="w-4 h-4" />} trend="up" trendVal="+3.5%" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Doanh thu theo tháng</h3>
        <div className="space-y-3">
          {[['Tháng 1', 6200000], ['Tháng 2', 7800000], ['Tháng 3', 9100000], ['Tháng 4', 11400000], ['Tháng 5', 13700000]].map(([m, v]) => (
            <MiniBar key={m as string} label={m as string} value={v as number} max={15000000} />
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Khóa học nổi bật</h3>
        <div className="space-y-3">
          {[
            { name: 'React Nâng cao', students: 420, rating: 4.9 },
            { name: 'Node.js Microservices', students: 318, rating: 4.7 },
            { name: 'TypeScript Toàn tập', students: 275, rating: 4.8 },
          ].map((c) => (
            <div key={c.name} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><BookOpen className="w-4 h-4 text-primary" /></div>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{c.students} HV</span>
                <span className="text-amber-500 font-bold">{c.rating}★</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Tab: Doanh thu ───
const RevenueTab = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Doanh thu tháng này" value="11.4M ₫" icon={<DollarSign className="w-4 h-4" />} trend="up" trendVal="+15%" />
      <StatCard label="Doanh thu năm nay"   value="48.2M ₫" icon={<TrendingUp className="w-4 h-4" />} trend="up" trendVal="+42%" />
      <StatCard label="Chờ thanh toán"       value="2.8M ₫"  icon={<Clock className="w-4 h-4" />} />
    </div>
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
      <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Chi tiết doanh thu theo khóa học</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
            <th className="pb-3 font-medium">Khóa học</th>
            <th className="pb-3 font-medium text-right">Ghi danh</th>
            <th className="pb-3 font-medium text-right">Giá</th>
            <th className="pb-3 font-medium text-right">Doanh thu</th>
          </tr></thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {[
              { name: 'React Nâng cao', enroll: 420, price: '499.000 ₫', rev: '20.9M ₫' },
              { name: 'Node.js Microservices', enroll: 318, price: '599.000 ₫', rev: '19.0M ₫' },
              { name: 'TypeScript Toàn tập', enroll: 275, price: '299.000 ₫', rev: '8.2M ₫' },
            ].map(r => (
              <tr key={r.name}>
                <td className="py-3 font-medium text-zinc-800 dark:text-zinc-200">{r.name}</td>
                <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">{r.enroll}</td>
                <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">{r.price}</td>
                <td className="py-3 text-right font-bold text-green-600 dark:text-green-400">{r.rev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ─── Tab: Học viên ───
const StudentsTab = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Tổng học viên" value="1,013" icon={<Users className="w-4 h-4" />} trend="up" trendVal="+284" />
      <StatCard label="Hoàn thành KH" value="731" sub="72% tỷ lệ" icon={<Award className="w-4 h-4" />} />
      <StatCard label="Đang học" value="198" icon={<Clock className="w-4 h-4" />} />
      <StatCard label="Học viên mới/tháng" value="284" icon={<TrendingUp className="w-4 h-4" />} trend="up" trendVal="+8.1%" />
    </div>
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
      <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Phân bổ học viên theo khóa học</h3>
      <div className="space-y-4">
        {[
          { name: 'React Nâng cao', val: 420, color: 'bg-blue-500' },
          { name: 'Node.js Microservices', val: 318, color: 'bg-purple-500' },
          { name: 'TypeScript Toàn tập', val: 275, color: 'bg-emerald-500' },
        ].map(c => <MiniBar key={c.name} label={c.name} value={c.val} max={500} color={c.color} />)}
      </div>
    </div>
  </div>
);

// ─── Tab: Đánh giá ───
const ReviewsTab = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Đánh giá TB" value="4.8 ★" sub="từ 1,240 đánh giá" icon={<Star className="w-4 h-4" />} />
      <StatCard label="5 sao" value="876" sub="70.6%" icon={<Star className="w-4 h-4" />} />
      <StatCard label="Đánh giá tháng này" value="94" icon={<Star className="w-4 h-4" />} trend="up" trendVal="+18%" />
    </div>
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
      <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Đánh giá gần đây</h3>
      <div className="space-y-4">
        {[
          { user: 'Nguyễn Văn A', course: 'React Nâng cao', stars: 5, comment: 'Khóa học rất hay, dễ hiểu và thực tế!', time: '2 giờ trước' },
          { user: 'Trần Thị B', course: 'Node.js Microservices', stars: 4, comment: 'Nội dung chất lượng, giảng viên nhiệt tình.', time: '1 ngày trước' },
          { user: 'Lê Văn C', course: 'TypeScript Toàn tập', stars: 5, comment: 'Tuyệt vời, học xong hiểu rất sâu.', time: '2 ngày trước' },
        ].map((r, i) => (
          <div key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{r.user[0]}</div>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{r.user}</span>
                <span className="text-xs text-zinc-400">· {r.course}</span>
              </div>
              <span className="text-xs text-zinc-400">{r.time}</span>
            </div>
            <div className="flex items-center gap-1 mb-1">{'★'.repeat(r.stars).split('').map((s, j) => <span key={j} className="text-amber-400 text-sm">{s}</span>)}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Tab: Tương tác ───
const EngagementTab = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Thời gian học TB" value="4.2h" sub="mỗi học viên/tuần" icon={<Clock className="w-4 h-4" />} />
      <StatCard label="Tỷ lệ hoàn thành" value="72%" icon={<Award className="w-4 h-4" />} trend="up" trendVal="+3.5%" />
      <StatCard label="Câu hỏi mới" value="38" sub="tháng này" icon={<BookOpen className="w-4 h-4" />} />
      <StatCard label="Video xem nhiều nhất" value="94%" sub="tỷ lệ xem hết" icon={<TrendingUp className="w-4 h-4" />} />
    </div>
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
      <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Mức độ tương tác theo bài học</h3>
      <div className="space-y-4">
        {[
          { name: 'Bài 1: Giới thiệu React', completion: 96, color: 'bg-green-500' },
          { name: 'Bài 2: Hooks nâng cao', completion: 84, color: 'bg-blue-500' },
          { name: 'Bài 3: State Management', completion: 71, color: 'bg-amber-500' },
          { name: 'Bài 4: Performance Tips', completion: 58, color: 'bg-orange-500' },
        ].map(l => (
          <div key={l.name} className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-44 shrink-0 truncate">{l.name}</span>
            <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full ${l.color} rounded-full transition-all duration-500`} style={{ width: `${l.completion}%` }} />
            </div>
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 w-10 text-right">{l.completion}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Main ───
export const InstructorPerformance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PerfTab>('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Hiệu suất</h1>
        <p className="text-muted-foreground mt-1">Phân tích chi tiết hoạt động giảng dạy của bạn.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {PERF_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview'    && <OverviewTab />}
      {activeTab === 'revenue'     && <RevenueTab />}
      {activeTab === 'students'    && <StudentsTab />}
      {activeTab === 'reviews'     && <ReviewsTab />}
      {activeTab === 'engagement'  && <EngagementTab />}
    </div>
  );
};
