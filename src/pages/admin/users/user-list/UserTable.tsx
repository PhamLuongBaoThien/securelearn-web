// Thành phần giao diện: UserTable thuộc trang quản lý danh sách người dùng (route: /admin/users/list).
// ========================
// UserTable: Component bảng danh sách người dùng và thao tác từng dòng trong module user list.
// ========================
import React, { useMemo } from 'react';
import { Lock, Unlock, Mail, Phone, ShoppingBag, BookOpen, Search, Loader2, Filter } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { IAdminUser } from '@/types/admin.types';
import { ROLE_COLORS, STATUS_COLORS, ROLE_LABEL, STATUS_LABEL, timeAgo } from './constants';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sortedPages = Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [];
  sortedPages.forEach((pageNumber, index) => {
    const previous = sortedPages[index - 1];
    if (previous && pageNumber - previous > 1) {
      items.push(previous === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    items.push(pageNumber);
  });

  return items;
}

interface UserTableProps {
  users: IAdminUser[];
  total: number;
  page: number;
  totalPages: number;
  isFetching?: boolean;
  onLock: (user: IAdminUser) => void;
  onUnlock: (user: IAdminUser) => void;
  onPageChange: (page: number) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onExecuteMultiAction?: (action: string) => void;
  onClearSelection?: () => void;
  canManageLocks?: boolean;
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
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected,
  isSomeSelected,
  onExecuteMultiAction,
  onClearSelection,
  canManageLocks = true,
}) => {
  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages]);
  const hasSelection = canManageLocks && selectedIds.length > 0;
  const visibleCols = canManageLocks ? COLS : COLS.filter((header) => header !== 'Hành động');

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Filter className="h-4 w-4" />
          {total.toLocaleString('vi-VN')} kết quả
        </div>
        <div className="h-4 w-4">
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
        </div>
      </div>
      <div className={`overflow-x-auto transition-opacity duration-150 ${isFetching ? 'opacity-70' : 'opacity-100'}`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b border-zinc-100 dark:border-zinc-800 transition-colors ${hasSelection ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}>
              {canManageLocks && (
                <th className="w-10 px-4 py-3.5 align-middle">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeSelected;
                      }
                    }}
                    onChange={onToggleSelectAll}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4 bg-transparent"
                  />
                </th>
              )}
              {hasSelection ? (
                <th colSpan={visibleCols.length} className="px-4 py-2.5 align-middle text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      Đã chọn {selectedIds.length} tài khoản
                    </span>
                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onExecuteMultiAction?.('lock')}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 transition"
                      >
                        Khóa tài khoản
                      </button>
                      <button
                        onClick={() => onExecuteMultiAction?.('unlock')}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 transition"
                      >
                        Mở khóa
                      </button>
                      <button
                        onClick={onClearSelection}
                        className="px-2.5 py-1 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                      >
                        Hủy chọn
                      </button>
                    </div>
                  </div>
                </th>
              ) : (
                visibleCols.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.map((user) => (
              <tr
                key={user._id}
                data-state={selectedIds.includes(user._id) ? 'selected' : undefined}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group data-[state=selected]:bg-zinc-50 dark:data-[state=selected]:bg-zinc-800/20"
              >
                {canManageLocks && (
                  <td className="w-10 px-4 py-3.5 align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user._id)}
                      onChange={() => onToggleSelect(user._id)}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4 bg-transparent"
                    />
                  </td>
                )}

                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} className="w-9 h-9 text-sm" />
                    <div>
                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{user.fullName}</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABEL[user.role]}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <div className="space-y-1.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[user.status]}`}>
                      {STATUS_LABEL[user.status]}
                    </span>
                    {user.status === 'LOCKED' && (
                      <div className="max-w-[220px] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        <p>Bị khóa bởi {getAdminLabel(user.lockedByAdmin, user.lockedBy)}</p>
                        <p>{user.lockedAt ? ` ${timeAgo(user.lockedAt)}` : ''}</p>
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

                <td className="px-4 py-3.5 text-xs text-zinc-500">{timeAgo(user.lastLoginAt)}</td>

                {canManageLocks && (
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        id={`btn-toggle-lock-${user._id}`}
                        onClick={() => user.status === 'LOCKED' ? onUnlock(user) : onLock(user)}
                        title={user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
                        className={`p-1.5 rounded-lg transition-colors ${user.status === 'LOCKED'
                          ? 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500'
                          : 'hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500'
                        }`}
                      >
                        {user.status === 'LOCKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !isFetching && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Search className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Không tìm thấy tài khoản phù hợp.</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-sm text-zinc-500">
          Hiển thị {users.length} / {total} tài khoản
        </span>

        {totalPages > 1 && (
          <Pagination className="mx-0 w-auto justify-start sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Trước"
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  onClick={(event) => {
                    event.preventDefault();
                    if (page > 1) onPageChange(page - 1);
                  }}
                />
              </PaginationItem>
              {visiblePages.map((item, idx) => (
                <PaginationItem key={idx}>
                  {typeof item === 'number' ? (
                    <PaginationLink
                      href="#"
                      isActive={item === page}
                      onClick={(event) => {
                        event.preventDefault();
                        onPageChange(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  ) : (
                    <PaginationEllipsis />
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Sau"
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  onClick={(event) => {
                    event.preventDefault();
                    if (page < totalPages) onPageChange(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};
