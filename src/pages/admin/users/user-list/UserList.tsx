// ========================
// Admin User List: File đầu mối quản lý học viên & giảng viên sau khi đã tách nhỏ.
// Giữ phần điều phối state, query, paging, và các thao tác quản trị người dùng tại đây.
// ========================
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Users,
  GraduationCap,
  Filter,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { IAdminUser } from '@/types/admin.types';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { UserTable } from './UserTable';

const cardClass = 'rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

const KpiCard: React.FC<{
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, icon }) => (
  <div className={`${cardClass} p-5`}>
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        </p>
        {sub && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
      </div>
      <div className="shrink-0 self-center text-zinc-300 dark:text-zinc-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
    </div>
  </div>
);

export const UserList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchVal = searchParams.get('search') || '';
  const roleVal = searchParams.get('role') || '';
  const statusVal = searchParams.get('status') || '';
  const page = Math.max(Number(searchParams.get('page') || '1'), 1);

  // ── Dialog state ──
  const [lockTarget, setLockTarget] = useState<IAdminUser | null>(null);
  const [lockReason, setLockReason] = useState('');

  const debouncedSearch = useDebounce(searchVal.trim(), 300);
  const PAGE_SIZE = 10;

  // ── Hook ──
  const { users, total, totalPages, isLoading, isFetching, invalidate, lockMut, unlockMut } =
    useAdminUsers({
      search: debouncedSearch || undefined,
      role: roleVal || undefined,
      status: statusVal || undefined,
      page,
      limit: PAGE_SIZE,
    });

  const hasActiveFilters = useMemo(() => {
    return Boolean(searchVal.trim() || roleVal || statusVal || page > 1);
  }, [searchVal, roleVal, statusVal, page]);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams, { replace: true });
  };

  const handleOpenLockDialog = (user: IAdminUser) => {
    setLockReason('');
    setLockTarget(user);
  };

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
    <TooltipProvider>
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

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Danh sách người dùng</h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">Quản lý tài khoản Học viên và Giảng viên trên nền tảng.</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => invalidate()}
                disabled={isFetching}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Làm mới danh sách người dùng</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Học viên"
            value={users.filter((u) => u.role === 'STUDENT').length}
            sub="Trong danh sách trang này"
            icon={<Users className="h-5 w-5 text-blue-500" />}
          />
          <KpiCard
            label="Giảng viên"
            value={users.filter((u) => u.role === 'INSTRUCTOR').length}
            sub="Trong danh sách trang này"
            icon={<GraduationCap className="h-5 w-5 text-violet-500" />}
          />
          <KpiCard
            label="Tài khoản bị khóa"
            value={users.filter((u) => u.status === 'LOCKED').length}
            sub="Đã bị khóa tạm thời"
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          />
        </div>

        {/* Filters */}
        <div className={`${cardClass} p-4 space-y-3`}>
          {/* Search */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" />
              <Input
                value={searchVal}
                onChange={(event) => {
                  const val = event.target.value;
                  const nextParams = new URLSearchParams(searchParams);
                  if (val) {
                    nextParams.set('search', val);
                  } else {
                    nextParams.delete('search');
                  }
                  nextParams.delete('page');
                  setSearchParams(nextParams, { replace: true });
                }}
                placeholder="Tìm theo tên, email..."
                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="h-10 px-3 rounded-lg border-dashed text-zinc-500 hover:text-zinc-800"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* Filters dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
            <div className="w-48">
              <Select
                value={roleVal}
                onChange={(event) => {
                  const val = event.target.value;
                  const nextParams = new URLSearchParams(searchParams);
                  if (val) {
                    nextParams.set('role', val);
                  } else {
                    nextParams.delete('role');
                  }
                  nextParams.delete('page');
                  setSearchParams(nextParams, { replace: true });
                }}
              >
                <option value="">Tất cả vai trò</option>
                <option value="STUDENT">Học viên</option>
                <option value="INSTRUCTOR">Giảng viên</option>
              </Select>
            </div>

            <div className="w-48">
              <Select
                value={statusVal}
                onChange={(event) => {
                  const val = event.target.value;
                  const nextParams = new URLSearchParams(searchParams);
                  if (val) {
                    nextParams.set('status', val);
                  } else {
                    nextParams.delete('status');
                  }
                  nextParams.delete('page');
                  setSearchParams(nextParams, { replace: true });
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="LOCKED">Đã khóa</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <UserTable
          users={users}
          total={total}
          page={page}
          totalPages={totalPages}
          isFetching={isFetching}
          onLock={handleOpenLockDialog}
          onUnlock={handleOpenLockDialog}
          onPageChange={handlePageChange}
        />
      </div>
    </TooltipProvider>
  );
};

