// ========================
// Admin User List: File đầu mối quản lý học viên & giảng viên sau khi đã tách nhỏ.
// Giữ phần điều phối state, query, paging, và các thao tác quản trị người dùng tại đây.
// ========================
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { IAdminUser } from '@/types/admin.types';
import { useAdminUsers } from '@/hooks/useAdminUsers';

import { UserStats } from './UserStats';
import { UserFilters } from './UserFilters';
import { UserTable } from './UserTable';

export const UserList: React.FC = () => {
  // ── Filter state ──
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [page, setPage]               = useState(1);

  // ── Dialog state ──
  const [lockTarget, setLockTarget]   = useState<IAdminUser | null>(null);
  const [lockReason, setLockReason]   = useState('');

  // ── Debounce search (400ms) ──
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleOpenLockDialog = (user: IAdminUser) => {
    setLockReason('');
    setLockTarget(user);
  };

  // ── Hook ──
  const { users, total, totalPages, isLoading, isFetching, lockMut, unlockMut } =
    useAdminUsers({
      search: debouncedSearch || undefined,
      role:   roleFilter     || undefined,
      status: statusFilter   || undefined,
      page,
      limit: 20,
    });

  // ── Handlers ──
  const handleConfirmLock = () => {
    if (!lockTarget) return;
    if (lockTarget.status === 'LOCKED') {
      unlockMut.mutate(
        { userId: lockTarget._id, reason: lockReason.trim() || undefined },
        { onSuccess: () => setLockTarget(null) }
      );
    } else {
      const reason = lockReason.trim();
      if (!reason) return;
      lockMut.mutate(
        { userId: lockTarget._id, reason },
        { onSuccess: () => setLockTarget(null) }
      );
    }
  };

  const isUnlocking = lockTarget?.status === 'LOCKED';
  const isLockReasonMissing = !isUnlocking && !lockReason.trim();
  const isSubmittingLockChange = lockMut.isPending || unlockMut.isPending;

  // ── Render ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Dialogs */}
      <AlertDialog open={lockTarget !== null} onOpenChange={(o) => { if (!o) setLockTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isUnlocking ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isUnlocking
                ? `Tài khoản ${lockTarget?.email} sẽ được khôi phục và có thể đăng nhập trở lại.`
                : `Tài khoản ${lockTarget?.email} sẽ bị đình chỉ. Người dùng không thể đăng nhập cho đến khi được mở khóa.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isUnlocking && lockTarget?.lockReason && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <p className="font-medium">Lý do khóa gần nhất</p>
              <p className="mt-1 text-xs leading-relaxed">{lockTarget.lockReason}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {isUnlocking ? 'Lý do mở khóa (tùy chọn)' : 'Lý do khóa tài khoản'}
            </label>
            <textarea
              value={lockReason}
              onChange={(event) => setLockReason(event.target.value)}
              rows={4}
              placeholder={isUnlocking ? 'Ví dụ: Đã xác minh lại tài khoản' : 'Ví dụ: Spam nội dung không phù hợp'}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            {!isUnlocking && (
              <p className="text-xs text-zinc-500">Bắt buộc nhập lý do để lưu lại người khóa và nguyên nhân khóa.</p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingLockChange}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmittingLockChange || isLockReasonMissing}
              onClick={handleConfirmLock}
              className={
                isUnlocking
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }
            >
              {isUnlocking ? 'Mở khóa' : 'Khóa tài khoản'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats */}
      <UserStats users={users} total={total} />

      {/* Filters */}
      <UserFilters
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
      />

      {/* Table */}
      <UserTable
        users={users}
        total={total}
        page={page}
        totalPages={totalPages}
        isFetching={isFetching}
        onLock={handleOpenLockDialog}
        onUnlock={handleOpenLockDialog}
        onPageChange={setPage}
      />
    </div>
  );
};
