import React, { useState } from 'react';
import { Key, Shield, XCircle, CheckCircle, Clock, Search, Filter, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { IKmsKey, KmsKeyStatus } from '@/types/admin.types';

const MOCK_KEYS: IKmsKey[] = [
  { _id: 'k1', keyId: 'kms-c1-u1-a1b2c3', courseId: 'c1', courseTitle: 'Ethical Hacking: Từ Zero đến Chuyên Gia', issuedTo: 'u1', issuedToName: 'Nguyễn Văn A', status: 'ACTIVE', usageCount: 47, createdAt: '2026-04-01T10:00:00Z', expiresAt: '2026-12-31T23:59:59Z' },
  { _id: 'k2', keyId: 'kms-c1-u6-d4e5f6', courseId: 'c1', courseTitle: 'Ethical Hacking: Từ Zero đến Chuyên Gia', issuedTo: 'u6', issuedToName: 'Đinh Thị F', status: 'ACTIVE', usageCount: 12, createdAt: '2026-04-05T14:00:00Z', expiresAt: '2026-12-31T23:59:59Z' },
  { _id: 'k3', keyId: 'kms-c2-u1-g7h8i9', courseId: 'c2', courseTitle: 'React & TypeScript Masterclass 2026', issuedTo: 'u1', issuedToName: 'Nguyễn Văn A', status: 'ACTIVE', usageCount: 23, createdAt: '2026-03-20T09:00:00Z' },
  { _id: 'k4', keyId: 'kms-c3-u3-j0k1l2', courseId: 'c3', courseTitle: 'Docker & Kubernetes cho Developers', issuedTo: 'u3', issuedToName: 'Lê Bình C', status: 'REVOKED', usageCount: 5, createdAt: '2026-02-10T11:00:00Z', revokedAt: '2026-03-01T08:00:00Z' },
  { _id: 'k5', keyId: 'kms-c1-u2-m3n4o5', courseId: 'c1', courseTitle: 'Ethical Hacking: Từ Zero đến Chuyên Gia', issuedTo: 'u2', issuedToName: 'Trần Thị B', status: 'EXPIRED', usageCount: 88, createdAt: '2025-01-01T00:00:00Z', expiresAt: '2025-12-31T23:59:59Z' },
];

const statusConfig: Record<KmsKeyStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  ACTIVE: { label: 'Hoạt động', icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' },
  REVOKED: { label: 'Đã thu hồi', icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400' },
  EXPIRED: { label: 'Hết hạn', icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' },
};

export const KmsManager: React.FC = () => {
  const [keys, setKeys] = useState<IKmsKey[]>(MOCK_KEYS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [revoking, setRevoking] = useState<string | null>(null);

  const filtered = keys.filter((k) => {
    const matchSearch = !search || k.keyId.includes(search) || k.courseTitle.toLowerCase().includes(search.toLowerCase()) || (k.issuedToName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || k.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    await new Promise((r) => setTimeout(r, 700));
    setKeys((p) => p.map((k) => k._id === id ? { ...k, status: 'REVOKED' as KmsKeyStatus, revokedAt: new Date().toISOString() } : k));
    setRevoking(null);
    toast.success('Đã thu hồi khóa giải mã. Người dùng sẽ không thể truy cập nội dung.');
  };

  const stats = { active: keys.filter((k) => k.status === 'ACTIVE').length, revoked: keys.filter((k) => k.status === 'REVOKED').length, expired: keys.filter((k) => k.status === 'EXPIRED').length };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Quản lý Khóa (KMS)</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Kiểm soát cơ chế cấp khóa giải mã cho người dùng đã thanh toán.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <Key className="w-4 h-4 text-primary" />
          <span className="text-sm text-zinc-500"><strong className="text-zinc-900 dark:text-white">{stats.active}</strong> khóa đang hoạt động</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Đang hoạt động', value: stats.active, cls: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-400/10' },
          { label: 'Đã thu hồi', value: stats.revoked, cls: 'text-red-500 bg-red-100 dark:bg-red-400/10' },
          { label: 'Hết hạn', value: stats.expired, cls: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.cls}`}><Key className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{s.value}</p>
                <p className="text-sm text-zinc-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-300">Thu hồi khóa sẽ ngay lập tức vô hiệu hóa khả năng giải mã video của người dùng. Hành động này không thể hoàn tác — hãy cẩn thận trước khi thực hiện.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input className="bg-transparent text-sm flex-1 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400" placeholder="Tìm Key ID, khóa học, người dùng..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="REVOKED">Đã thu hồi</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Key ID', 'Khóa học', 'Người dùng', 'Trạng thái', 'Lần dùng', 'Tạo lúc', 'Hết hạn', 'Hành động'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((k) => {
                const sc = statusConfig[k.status];
                return (
                  <tr key={k._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <code className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">{k.keyId.slice(0, 18)}...</code>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-36 truncate">{k.courseTitle}</td>
                    <td className="px-4 py-3.5 text-sm text-zinc-700 dark:text-zinc-300">{k.issuedToName || '—'}</td>
                    <td className="px-4 py-3.5"><span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>{sc.icon}{sc.label}</span></td>
                    <td className="px-4 py-3.5 text-sm text-zinc-500 font-mono">{k.usageCount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400">{new Date(k.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400">{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString('vi-VN') : <span className="text-emerald-500">Vĩnh viễn</span>}</td>
                    <td className="px-4 py-3.5">
                      {k.status === 'ACTIVE' && (
                        <button
                          id={`btn-revoke-${k._id}`}
                          onClick={() => handleRevoke(k._id)}
                          disabled={revoking === k._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium hover:bg-red-200 dark:hover:bg-red-400/20 disabled:opacity-50 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5" />{revoking === k._id ? 'Đang...' : 'Thu hồi'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Key className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Không tìm thấy khóa nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
