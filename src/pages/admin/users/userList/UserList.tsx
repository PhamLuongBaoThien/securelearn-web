// ========================
// Admin User List: File đầu mối quản lý học viên & giảng viên sau khi đã tách nhỏ.
// Giữ phần điều phối state, query, paging, và các thao tác quản trị người dùng tại đây.
// ========================
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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

  // ── Debounce search (400ms) ──
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [roleFilter, statusFilter]);

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
      unlockMut.mutate(lockTarget._id, { onSuccess: () => setLockTarget(null) });
    } else {
      lockMut.mutate(lockTarget._id, { onSuccess: () => setLockTarget(null) });
    }
  };

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
      <ConfirmDialog
        open={lockTarget !== null}
        onOpenChange={(o) => { if (!o) setLockTarget(null); }}
        title={lockTarget?.status === 'LOCKED' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
        description={
          lockTarget?.status === 'LOCKED'
            ? `Tài khoản ${lockTarget?.email} sẽ được khôi phục và có thể đăng nhập trở lại.`
            : `Tài khoản ${lockTarget?.email} sẽ bị đình chỉ. Người dùng không thể đăng nhập cho đến khi được mở khóa.`
        }
        confirmText={lockTarget?.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
        isDestructive={lockTarget?.status !== 'LOCKED'}
        onConfirm={handleConfirmLock}
      />

      {/* Stats */}
      <UserStats users={users} total={total} />

      {/* Filters */}
      <UserFilters
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatus}
      />

      {/* Table */}
      <UserTable
        users={users}
        total={total}
        page={page}
        totalPages={totalPages}
        isFetching={isFetching}
        onLock={setLockTarget}
        onUnlock={setLockTarget}
        onPageChange={setPage}
      />
    </div>
  );
};
