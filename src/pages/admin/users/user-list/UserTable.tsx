// ========================
// UserTable: Component bảng danh sách người dùng và thao tác từng dòng trong module user list.
// ========================
import React from 'react';
import { Lock, Unlock, Mail, Phone, ShoppingBag, BookOpen, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { IAdminUser } from '@/types/admin.types';
import { ROLE_COLORS, STATUS_COLORS, ROLE_LABEL, STATUS_LABEL, timeAgo } from './constants';

interface UserTableProps {
  users: IAdminUser[];
  total: number;
  page: number;
  totalPages: number;
  isFetching?: boolean;
  onLock: (user: IAdminUser) => void;
  onUnlock: (user: IAdminUser) => void;
  onPageChange: (page: number) => void;
}

const COLS = ['Người dùng', 'Vai trò', 'Trạng thái', 'Thông tin', 'Đăng nhập gần nhất', 'Hành động'];

const getAdminLabel = (admin?: { fullName?: string; email?: string } | null, fallback?: string) => {
  if (admin?.fullName) return admin.fullName;
  if (admin?.email) return admin.email;
  return fallback || 'Không rõ admin';
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  total,
  page,
  totalPages,
  isFetching,
  onLock,
  onUnlock,
  onPageChange,
}) => (
  <div className={`bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            {COLS.map((h) => (
              <th
                key={h}
                className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {users.map((user) => (
            <tr
              key={user._id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
            >
              {/* User info */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={user}
                    className="w-9 h-9 text-sm"
                  />
                  <div>
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </p>
                  </div>
                </div>
              </td>

              {/* Role */}
              <td className="px-4 py-3.5">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABEL[user.role]}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 py-3.5">
                <div className="space-y-1.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[user.status]}`}>
                    {STATUS_LABEL[user.status]}
                  </span>
                  {user.status === 'LOCKED' && (
                    <div className="max-w-[220px] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      <p>
                        Bị khóa bởi {getAdminLabel(user.lockedByAdmin, user.lockedBy)}
                      </p>
                      <p>  
                        {user.lockedAt ? ` ${timeAgo(user.lockedAt)}` : ''}
                      </p>
                      {user.lockReason && (
                        <p className="mt-0.5 truncate" title={user.lockReason}>
                          Lý do: {user.lockReason}
                        </p>
                      )}
                    </div>
                  )}
                  {user.status !== 'LOCKED' && user.unlockedAt && (
                    <p className="max-w-[220px] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      Mở khóa bởi {getAdminLabel(user.unlockedByAdmin, user.unlockedBy)} {timeAgo(user.unlockedAt)}
                    </p>
                  )}
                </div>
              </td>

              {/* Info */}
              <td className="px-4 py-3.5 text-xs text-zinc-500">
                {user.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {user.phone}
                  </div>
                )}
                {user.coursesPurchased !== undefined && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShoppingBag className="w-3 h-3" />
                    {user.coursesPurchased} đã mua
                  </div>
                )}
                {user.coursesCreated !== undefined && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <BookOpen className="w-3 h-3" />
                    {user.coursesCreated} đã tạo
                  </div>
                )}
              </td>

              {/* Last login */}
              <td className="px-4 py-3.5 text-xs text-zinc-500">
                {timeAgo(user.lastLoginAt)}
              </td>

              {/* Actions */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1">
                  {/* Lock / Unlock */}
                  <button
                    id={`btn-toggle-lock-${user._id}`}
                    onClick={() => user.status === 'LOCKED' ? onUnlock(user) : onLock(user)}
                    title={user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      user.status === 'LOCKED'
                        ? 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500'
                        : 'hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500'
                    }`}
                  >
                    {user.status === 'LOCKED' ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty state */}
      {users.length === 0 && !isFetching && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <Search className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Không tìm thấy tài khoản phù hợp.</p>
        </div>
      )}
    </div>

    {/* Footer: count + pagination */}
    <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
      <span className="text-sm text-zinc-500">
        Hiển thị {users.length} / {total} tài khoản
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  </div>
);
