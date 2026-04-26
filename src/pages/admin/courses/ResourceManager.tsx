import React, { useState } from 'react';
import { Search, Filter, HardDrive, FileVideo, FileText, Image, File, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ICourseResource, ResourceType } from '@/types/admin.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MOCK_RESOURCES: ICourseResource[] = [
  { _id: 'r1', fileName: 'intro-to-ethical-hacking.mp4', fileType: 'VIDEO', fileSize: 524288000, mimeType: 'video/mp4', url: '#', courseId: 'c1', courseTitle: 'Ethical Hacking: Từ Zero đến Chuyên Gia', lessonTitle: 'Bài 1: Giới thiệu', uploadedBy: 'Trần Văn Minh', createdAt: '2026-04-10T10:00:00Z' },
  { _id: 'r2', fileName: 'slide-chapter-1.pdf', fileType: 'DOCUMENT', fileSize: 3145728, mimeType: 'application/pdf', url: '#', courseId: 'c1', courseTitle: 'Ethical Hacking: Từ Zero đến Chuyên Gia', lessonTitle: 'Bài 1: Giới thiệu', uploadedBy: 'Trần Văn Minh', createdAt: '2026-04-10T10:05:00Z' },
  { _id: 'r3', fileName: 'react-hooks-deep-dive.mp4', fileType: 'VIDEO', fileSize: 786432000, mimeType: 'video/mp4', url: '#', courseId: 'c2', courseTitle: 'React & TypeScript Masterclass 2026', lessonTitle: 'Bài 12: Custom Hooks', uploadedBy: 'Nguyễn Thị Lan', createdAt: '2026-04-12T14:00:00Z' },
  { _id: 'r4', fileName: 'typescript-cheatsheet.pdf', fileType: 'DOCUMENT', fileSize: 1048576, mimeType: 'application/pdf', url: '#', courseId: 'c2', courseTitle: 'React & TypeScript Masterclass 2026', uploadedBy: 'Nguyễn Thị Lan', createdAt: '2026-04-12T14:30:00Z' },
  { _id: 'r5', fileName: 'docker-architecture.png', fileType: 'IMAGE', fileSize: 524288, mimeType: 'image/png', url: '#', courseId: 'c3', courseTitle: 'Docker & Kubernetes cho Developers', lessonTitle: 'Bài 3: Kiến trúc Docker', uploadedBy: 'Phạm Anh Tuấn', createdAt: '2026-04-08T09:00:00Z' },
  { _id: 'r6', fileName: 'k8s-yaml-templates.zip', fileType: 'OTHER', fileSize: 2097152, mimeType: 'application/zip', url: '#', courseId: 'c3', courseTitle: 'Docker & Kubernetes cho Developers', uploadedBy: 'Phạm Anh Tuấn', createdAt: '2026-04-08T09:15:00Z' },
];

const fileTypeConfig: Record<ResourceType, { label: string; icon: React.ReactNode; cls: string }> = {
  VIDEO: { label: 'Video', icon: <FileVideo className="w-4 h-4" />, cls: 'text-blue-500 bg-blue-100 dark:bg-blue-400/10' },
  DOCUMENT: { label: 'Tài liệu', icon: <FileText className="w-4 h-4" />, cls: 'text-violet-500 bg-violet-100 dark:bg-violet-400/10' },
  IMAGE: { label: 'Hình ảnh', icon: <Image className="w-4 h-4" />, cls: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-400/10' },
  OTHER: { label: 'Khác', icon: <File className="w-4 h-4" />, cls: 'text-amber-500 bg-amber-100 dark:bg-amber-400/10' },
};

const fmtSize = (bytes: number) => {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  return (bytes / 1e3).toFixed(0) + ' KB';
};

export const ResourceManager: React.FC = () => {
  const [resources, setResources] = useState<ICourseResource[]>(MOCK_RESOURCES);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const filtered = resources.filter((r) => {
    const matchSearch = !search || r.fileName.toLowerCase().includes(search.toLowerCase()) || r.courseTitle.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || r.fileType === typeFilter;
    return matchSearch && matchType;
  });

  const totalSize = resources.reduce((s, r) => s + r.fileSize, 0);
  const handleDelete = (id: string) => {
    setResources((p) => p.filter((r) => r._id !== id));
    toast.success('Đã xóa tài nguyên.');
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Quản lý Tài nguyên</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Theo dõi các tệp bài giảng và tài liệu đính kèm liên kết với khóa học.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <HardDrive className="w-4 h-4 text-primary" />
          <span className="text-sm text-zinc-500">Tổng: <strong className="text-zinc-900 dark:text-white">{fmtSize(totalSize)}</strong></span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['VIDEO', 'DOCUMENT', 'IMAGE', 'OTHER'] as ResourceType[]).map((type) => {
          const cfg = fileTypeConfig[type];
          const count = resources.filter((r) => r.fileType === type).length;
          const size = resources.filter((r) => r.fileType === type).reduce((s, r) => s + r.fileSize, 0);
          return (
            <div key={type} onClick={() => setTypeFilter(typeFilter === type ? '' : type)} className={`bg-white dark:bg-zinc-900/40 border rounded-2xl p-4 cursor-pointer transition-all shadow-sm ${typeFilter === type ? 'border-primary/50 shadow-md' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cfg.cls}`}>{cfg.icon}</div>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{count}</p>
              <p className="text-xs text-zinc-500">{cfg.label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{fmtSize(size)}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <Input className="bg-transparent text-sm flex-1 border-0 shadow-none px-0 py-0 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-0" placeholder="Tìm theo tên file, khóa học..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Tất cả loại</option>
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Tài liệu</option>
            <option value="IMAGE">Hình ảnh</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Tên file', 'Loại', 'Kích thước', 'Khóa học', 'Bài học', 'Ngày tải', 'Hành động'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((r) => {
                const cfg = fileTypeConfig[r.fileType];
                return (
                  <tr key={r._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.cls}`}>{cfg.icon}</div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-32">{r.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span></td>
                    <td className="px-4 py-3.5 text-sm text-zinc-500">{fmtSize(r.fileSize)}</td>
                    <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-40 truncate">{r.courseTitle}</td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400 max-w-32 truncate">{r.lessonTitle || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={r.url} title="Tải xuống" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors"><Download className="w-4 h-4" /></a>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(r._id)} title="Xóa" className="h-8 w-8 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <HardDrive className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Không có tài nguyên nào phù hợp.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-500">{filtered.length} tài nguyên · Tổng {fmtSize(filtered.reduce((s, r) => s + r.fileSize, 0))}</span>
        </div>
      </div>
    </div>
  );
};
