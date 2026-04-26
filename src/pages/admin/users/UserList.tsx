import React, { useState } from 'react';
import { Search, Filter, Lock, Unlock, Shield, Mail, Phone, BookOpen, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import type { IAdminUser, UserRole, UserStatus } from '@/types/admin.types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const MOCK_USERS: IAdminUser[] = [
  { _id: 'u1', email: 'nguyenvana@gmail.com', fullName: 'Nguyễn Văn A', role: 'STUDENT', status: 'ACTIVE', isVerified: true, subscriptionStatus: 'ACTIVE', phone: '0901000001', coursesPurchased: 12, createdAt: '2026-01-15T08:00:00Z', lastLoginAt: '2026-04-21T10:30:00Z' },
  { _id: 'u2', email: 'tranthib@gmail.com', fullName: 'Trần Thị B', role: 'INSTRUCTOR', status: 'ACTIVE', isVerified: true, subscriptionStatus: 'INACTIVE', phone: '0912000002', coursesCreated: 5, coursesPurchased: 3, createdAt: '2026-02-10T09:00:00Z', lastLoginAt: '2026-04-20T14:00:00Z' },
  { _id: 'u3', email: 'lebinhc@gmail.com', fullName: 'Lê Bình C', role: 'STUDENT', status: 'LOCKED', isVerified: true, subscriptionStatus: 'INACTIVE', coursesPurchased: 2, createdAt: '2026-03-05T11:00:00Z' },
  { _id: 'u4', email: 'phamthid@gmail.com', fullName: 'Phạm Thị D', role: 'INSTRUCTOR', status: 'ACTIVE', isVerified: false, subscriptionStatus: 'INACTIVE', coursesCreated: 2, coursesPurchased: 0, createdAt: '2026-03-20T07:00:00Z', lastLoginAt: '2026-04-18T09:00:00Z' },
  { _id: 'u5', email: 'hoangvane@gmail.com', fullName: 'Hoàng Văn E', role: 'STUDENT', status: 'UNVERIFIED', isVerified: false, subscriptionStatus: 'INACTIVE', coursesPurchased: 0, createdAt: '2026-04-01T16:00:00Z' },
  { _id: 'u6', email: 'dinhthif@gmail.com', fullName: 'Đinh Thị F', role: 'STUDENT', status: 'ACTIVE', isVerified: true, subscriptionStatus: 'ACTIVE', coursesPurchased: 8, createdAt: '2026-01-28T12:00:00Z', lastLoginAt: '2026-04-22T08:00:00Z' },
];

const roleColors: Record<UserRole, string> = {
  STUDENT: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400',
  INSTRUCTOR: 'bg-violet-100 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400',
  ADMIN: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400',
};
const statusColors: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400',
  LOCKED: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400',
  UNVERIFIED: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
};
const roleLabel: Record<UserRole, string> = { STUDENT: 'Học viên', INSTRUCTOR: 'Giảng viên', ADMIN: 'Admin' };
const statusLabel: Record<UserStatus, string> = { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa', UNVERIFIED: 'Chưa xác minh' };



// ===== Main Page =====
export const UserList: React.FC = () => {
  const [users, setUsers] = useState<IAdminUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Dialog states
  const [lockTarget, setLockTarget] = useState<IAdminUser | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleConfirmLock = () => {
    if (!lockTarget) return;
    const newStatus: UserStatus = lockTarget.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    setUsers((prev) => prev.map((u) => u._id === lockTarget._id ? { ...u, status: newStatus } : u));
    toast.success(newStatus === 'LOCKED' ? `Đã khóa tài khoản ${lockTarget.email}` : `Đã mở khóa tài khoản ${lockTarget.email}`);
    setLockTarget(null);
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Chưa đăng nhập';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    return `${Math.floor(hrs / 24)} ngày trước`;
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">


      {/* Lock/Unlock Confirm Dialog */}
      <ConfirmDialog
        open={lockTarget !== null}
        onOpenChange={(o) => { if (!o) setLockTarget(null); }}
        title={lockTarget?.status === 'LOCKED' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
        description={
          lockTarget?.status === 'LOCKED'
            ? `Tài khoản ${lockTarget?.email} sẽ được khôi phục và có thể đăng nhập trở lại.`
            : `Tài khoản ${lockTarget?.email} sẽ bị đình chỉ. Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.`
        }
        confirmText={lockTarget?.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
        isDestructive={lockTarget?.status !== 'LOCKED'}
        onConfirm={handleConfirmLock}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Danh sách người dùng</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Quản lý tài khoản Học viên và Giảng viên trên nền tảng.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-500 shadow-sm">
          <Shield className="w-4 h-4 text-primary" />
          <span><b className="text-zinc-900 dark:text-white">{users.length}</b> tài khoản</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Học viên', count: users.filter((u) => u.role === 'STUDENT').length, cls: 'text-blue-500' },
          { label: 'Giảng viên', count: users.filter((u) => u.role === 'INSTRUCTOR').length, cls: 'text-violet-500' },
          { label: 'Đã khóa', count: users.filter((u) => u.status === 'LOCKED').length, cls: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.count}</p>
            <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            className="bg-transparent text-sm flex-1 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
          <select
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="STUDENT">Học viên</option>
            <option value="INSTRUCTOR">Giảng viên</option>
          </select>
          <select
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
            <option value="UNVERIFIED">Chưa xác minh</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Người dùng', 'Vai trò', 'Trạng thái', 'Thông tin', 'Đăng nhập gần nhất', 'Hành động'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((user) => (
                <tr key={user._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{user.fullName}</p>
                        <p className="text-xs text-zinc-400 flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>{roleLabel[user.role]}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[user.status]}`}>{statusLabel[user.status]}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500">
                    {user.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</div>}
                    {user.coursesPurchased !== undefined && <div className="flex items-center gap-1 mt-0.5"><ShoppingBag className="w-3 h-3" />{user.coursesPurchased} đã mua</div>}
                    {user.coursesCreated !== undefined && <div className="flex items-center gap-1 mt-0.5"><BookOpen className="w-3 h-3" />{user.coursesCreated} đã tạo</div>}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500">{timeAgo(user.lastLoginAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`btn-toggle-lock-${user._id}`}
                        onClick={() => setLockTarget(user)}
                        title={user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
                        className={`p-1.5 rounded-lg transition-colors ${user.status === 'LOCKED' ? 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500' : 'hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500'}`}
                      >
                        {user.status === 'LOCKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Không tìm thấy tài khoản phù hợp.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-sm text-zinc-500">Hiển thị {filtered.length} / {users.length} tài khoản</span>
        </div>
      </div>
    </div>
  );
};
