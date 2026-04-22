import React, { useState } from 'react';
import { TrendingUp, Search, Filter, Download, Clock, BookOpen, Activity } from 'lucide-react';
import type { ILearningProgress } from '@/types/admin.types';

const MOCK_PROGRESS: ILearningProgress[] = [
  { _id: 'lp1', user: { _id: 'u1', fullName: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com' }, course: { _id: 'c1', title: 'Ethical Hacking: Từ Zero đến Chuyên Gia', instructor: 'Trần Văn Minh' }, progressPercent: 78, completedLessons: 35, totalLessons: 45, heartbeatCount: 1240, totalWatchTime: 1440, lastActivityAt: '2026-04-22T07:30:00Z', enrolledAt: '2026-04-01T10:00:00Z' },
  { _id: 'lp2', user: { _id: 'u6', fullName: 'Đinh Thị F', email: 'dinhthif@gmail.com' }, course: { _id: 'c2', title: 'React & TypeScript Masterclass 2026', instructor: 'Nguyễn Thị Lan' }, progressPercent: 45, completedLessons: 28, totalLessons: 62, heartbeatCount: 840, totalWatchTime: 840, lastActivityAt: '2026-04-21T20:15:00Z', enrolledAt: '2026-03-15T09:00:00Z' },
  { _id: 'lp3', user: { _id: 'u1', fullName: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com' }, course: { _id: 'c2', title: 'React & TypeScript Masterclass 2026', instructor: 'Nguyễn Thị Lan' }, progressPercent: 100, completedLessons: 62, totalLessons: 62, heartbeatCount: 1860, totalWatchTime: 2400, lastActivityAt: '2026-04-15T12:00:00Z', enrolledAt: '2026-03-01T08:00:00Z', completedAt: '2026-04-15T12:00:00Z' },
  { _id: 'lp4', user: { _id: 'u6', fullName: 'Đinh Thị F', email: 'dinhthif@gmail.com' }, course: { _id: 'c3', title: 'Docker & Kubernetes cho Developers', instructor: 'Phạm Anh Tuấn' }, progressPercent: 12, completedLessons: 5, totalLessons: 38, heartbeatCount: 150, totalWatchTime: 180, lastActivityAt: '2026-04-20T11:00:00Z', enrolledAt: '2026-04-10T14:00:00Z' },
];

const fmtTime = (mins: number) => { if (mins >= 60) return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? (mins % 60) + 'm' : ''}`; return `${mins}m`; };
const timeAgo = (dateStr: string) => { const diff = (Date.now() - new Date(dateStr).getTime()) / 60000; if (diff < 60) return `${Math.floor(diff)} phút trước`; if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`; return `${Math.floor(diff / 1440)} ngày trước`; };

export const LearningReport: React.FC = () => {
  const [progress] = useState<ILearningProgress[]>(MOCK_PROGRESS);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  const courses = Array.from(new Set(progress.map((p) => p.course.title)));
  const filtered = progress.filter((p) => {
    const matchSearch = !search || p.user.fullName.toLowerCase().includes(search.toLowerCase()) || p.course.title.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !courseFilter || p.course.title === courseFilter;
    return matchSearch && matchCourse;
  });

  const totalHeartbeat = progress.reduce((s, p) => s + p.heartbeatCount, 0);
  const avgProgress = Math.round(progress.reduce((s, p) => s + p.progressPercent, 0) / progress.length);
  const completedCount = progress.filter((p) => p.progressPercent === 100).length;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Báo cáo Tiến độ Học tập</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Theo dõi học viên thông qua dữ liệu Heartbeat để đánh giá hiệu quả khóa học.</p>
        </div>
        <button id="btn-export-progress" className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Xuất báo cáo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Lượt đăng ký', value: progress.length, icon: <BookOpen className="w-5 h-5" />, cls: 'bg-blue-100 dark:bg-blue-400/10 text-blue-500' },
          { label: 'Đã hoàn thành', value: completedCount, icon: <TrendingUp className="w-5 h-5" />, cls: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-500' },
          { label: 'TB tiến độ', value: `${avgProgress}%`, icon: <Activity className="w-5 h-5" />, cls: 'bg-violet-100 dark:bg-violet-400/10 text-violet-500' },
          { label: 'Tổng Heartbeat', value: totalHeartbeat.toLocaleString(), icon: <Clock className="w-5 h-5" />, cls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.cls}`}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input className="bg-transparent text-sm flex-1 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400" placeholder="Tìm học viên, khóa học..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none text-zinc-700 dark:text-zinc-300" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="">Tất cả khóa học</option>
            {courses.map((c) => <option key={c} value={c}>{c.slice(0, 40)}...</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Học viên', 'Khóa học', 'Tiến độ', 'Bài hoàn thành', 'Thời gian xem', 'Heartbeat', 'Hoạt động gần nhất', 'Trạng thái'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((p) => (
                <tr key={p._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        {p.user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.user.fullName}</p>
                        <p className="text-xs text-zinc-400">{p.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-36 truncate">{p.course.title}</p>
                    <p className="text-xs text-zinc-400">{p.course.instructor}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${p.progressPercent === 100 ? 'bg-emerald-500' : p.progressPercent >= 50 ? 'bg-primary' : 'bg-amber-500'}`} style={{ width: `${p.progressPercent}%` }} />
                      </div>
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 shrink-0">{p.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-zinc-500 font-mono">{p.completedLessons}/{p.totalLessons}</td>
                  <td className="px-4 py-3.5 text-sm text-zinc-500">{fmtTime(p.totalWatchTime)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{p.heartbeatCount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-400">{timeAgo(p.lastActivityAt)}</td>
                  <td className="px-4 py-3.5">
                    {p.completedAt ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400">Hoàn thành</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400">Đang học</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Không có dữ liệu tiến độ.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {filtered.length} bản ghi · Tổng heartbeat: <strong className="text-zinc-900 dark:text-white">{filtered.reduce((s, p) => s + p.heartbeatCount, 0).toLocaleString()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
