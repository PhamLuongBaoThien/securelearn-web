import React, { useState } from 'react';
import { Video, RefreshCw, FileText, CheckCircle, XCircle, Clock, Loader, BarChart2, Lock, Timer } from 'lucide-react';
import { toast } from 'sonner';
import type { IEncryptionJob, EncryptionStatus } from '@/types/admin.types';

const MOCK_JOBS: IEncryptionJob[] = [
  { _id: 'j1', videoId: 'v1', videoTitle: 'Bài 1: Giới thiệu Ethical Hacking', courseTitle: 'Ethical Hacking: Từ Zero đến Chuyên Gia', status: 'DONE', progress: 100, duration: 2400, outputFormat: 'HLS', encryptionType: 'AES-128', startedAt: '2026-04-10T10:00:00Z', completedAt: '2026-04-10T10:12:00Z', createdAt: '2026-04-10T09:55:00Z' },
  { _id: 'j2', videoId: 'v2', videoTitle: 'Bài 2: Network Scanning với Nmap', courseTitle: 'Ethical Hacking: Từ Zero đến Chuyên Gia', status: 'PROCESSING', progress: 67, duration: 3600, outputFormat: 'HLS', encryptionType: 'AES-128', startedAt: '2026-04-22T00:30:00Z', createdAt: '2026-04-22T00:25:00Z' },
  { _id: 'j3', videoId: 'v3', videoTitle: 'Bài 3: Vulnerability Assessment', courseTitle: 'Ethical Hacking: Từ Zero đến Chuyên Gia', status: 'PENDING', progress: 0, duration: 2700, outputFormat: 'HLS', encryptionType: 'AES-128', createdAt: '2026-04-22T00:55:00Z' },
  { _id: 'j4', videoId: 'v4', videoTitle: 'Bài 12: Custom Hooks trong React', courseTitle: 'React & TypeScript Masterclass 2026', status: 'FAILED', progress: 23, outputFormat: 'HLS', encryptionType: 'AES-128', startedAt: '2026-04-21T18:00:00Z', errorMessage: 'FFmpeg process exited with code 1: Invalid input file format.', createdAt: '2026-04-21T17:55:00Z' },
  { _id: 'j5', videoId: 'v5', videoTitle: 'Bài 1: Docker Architecture', courseTitle: 'Docker & Kubernetes cho Developers', status: 'DONE', progress: 100, duration: 1800, outputFormat: 'HLS', encryptionType: 'AES-128', startedAt: '2026-04-08T09:00:00Z', completedAt: '2026-04-08T09:09:00Z', createdAt: '2026-04-08T08:55:00Z' },
];

const statusConfig: Record<EncryptionStatus, { label: string; icon: React.ReactNode; cls: string; barCls: string }> = {
  DONE: { label: 'Hoàn thành', icon: <CheckCircle className="w-4 h-4" />, cls: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400', barCls: 'bg-emerald-500' },
  PROCESSING: { label: 'Đang xử lý', icon: <Loader className="w-4 h-4 animate-spin" />, cls: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400', barCls: 'bg-blue-500' },
  PENDING: { label: 'Chờ xử lý', icon: <Clock className="w-4 h-4" />, cls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400', barCls: 'bg-amber-500' },
  FAILED: { label: 'Thất bại', icon: <XCircle className="w-4 h-4" />, cls: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400', barCls: 'bg-red-500' },
};

const fmtDuration = (secs?: number) => { if (!secs) return '-'; const m = Math.floor(secs / 60); const s = secs % 60; return `${m}:${String(s).padStart(2, '0')}`; };

export const EncryptionMonitor: React.FC = () => {
  const [jobs, setJobs] = useState<IEncryptionJob[]>(MOCK_JOBS);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = statusFilter ? jobs.filter((j) => j.status === statusFilter) : jobs;

  const handleRetry = (id: string) => {
    setJobs((p) => p.map((j) => j._id === id ? { ...j, status: 'PENDING', progress: 0, errorMessage: undefined } : j));
    toast.success('Đã thêm lại vào hàng đợi xử lý.');
  };

  const stats = {
    total: jobs.length,
    done: jobs.filter((j) => j.status === 'DONE').length,
    processing: jobs.filter((j) => j.status === 'PROCESSING').length,
    failed: jobs.filter((j) => j.status === 'FAILED').length,
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Giám sát Mã hóa Video</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Theo dõi trạng thái chuyển đổi HLS và mã hóa AES-128 cho nội dung video.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
          <Loader className="w-4 h-4 text-blue-500 animate-spin" />
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{stats.processing} đang xử lý</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng jobs', value: stats.total, cls: 'text-zinc-900 dark:text-white' },
          { label: 'Hoàn thành', value: stats.done, cls: 'text-emerald-600' },
          { label: 'Đang xử lý', value: stats.processing, cls: 'text-blue-500' },
          { label: 'Thất bại', value: stats.failed, cls: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'PENDING', 'PROCESSING', 'DONE', 'FAILED'] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/30'}`}>
            {s === '' ? 'Tất cả' : statusConfig[s].label}
          </button>
        ))}
      </div>

      {/* Job List */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
        {filtered.map((job) => {
          const sc = statusConfig[job.status];
          return (
            <div key={job._id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-400/10 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{job.videoTitle}</p>
                    <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>{sc.icon}{sc.label}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{job.courseTitle}</p>

                  <div className="flex items-center gap-4 mt-1 text-xs text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" />HLS + AES-128</span>
                    {job.duration && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{fmtDuration(job.duration)}</span>}
                    {job.startedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Bắt đầu: {new Date(job.startedAt).toLocaleTimeString('vi-VN')}</span>}
                    {job.completedAt && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />{new Date(job.completedAt).toLocaleTimeString('vi-VN')}</span>}
                  </div>

                  {/* Progress bar */}
                  {(job.status === 'PROCESSING' || job.status === 'DONE') && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400">Tiến độ</span>
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{job.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${sc.barCls}`} style={{ width: `${job.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {job.status === 'FAILED' && job.errorMessage && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl text-xs text-red-600 dark:text-red-400">
                      <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="font-mono">{job.errorMessage}</span>
                    </div>
                  )}
                </div>

                {job.status === 'FAILED' && (
                  <button id={`btn-retry-${job._id}`} onClick={() => handleRetry(job._id)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-400/20 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <BarChart2 className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Không có job nào.</p>
          </div>
        )}
      </div>
    </div>
  );
};
