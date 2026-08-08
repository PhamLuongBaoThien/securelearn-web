// ========================
// StaffList: File đầu mối sau khi đã tách nhỏ thành dialog, row component, và utils riêng.
// Giữ phần điều phối state, query, filter, và thao tác quản lý nhân sự tại đây.
// ========================
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, UserCog, RefreshCw, Search, Shield, Filter, Loader2 } from 'lucide-react';
import type { IAdminStaff } from '@/types/admin.types';
import {
  useAdminStaff,
  useCreateAdminStaff,
  useDeleteAdminStaff,
  useUpdateAdminStaff,
  useMultiDeleteAdminStaff,
} from '@/hooks/useAdminStaff';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/useDebounce';
import { StaffFormDialog } from './StaffFormDialog';
import { StaffTableRow } from './StaffTableRow';
import type { StaffFormValues } from './staff.utils';
import { useAppSelector } from '@/app/hooks';
import { useMultiSelect } from '@/hooks/useMultiSelect';

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

export const StaffList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchVal = searchParams.get('search') || '';
  const roleVal = searchParams.get('role') || '';
  const sortVal = searchParams.get('sort') || 'newest';
  const page = Math.max(Number(searchParams.get('page') || '1'), 1);

  const currentUser = useAppSelector((state) => state.adminAuth.user);

  const { staff, isLoading, isFetching, invalidate } = useAdminStaff();
  const { roles: rolesData } = useAdminRoles();
  const createMutation = useCreateAdminStaff();
  const updateMutation = useUpdateAdminStaff();
  const deleteMutation = useDeleteAdminStaff();
  const multiDeleteMutation = useMultiDeleteAdminStaff();

  const availableRoles = rolesData.filter((role) => role.roleKey !== 'SUPER_ADMIN');

  const debouncedSearch = useDebounce(searchVal.trim(), 300);

  const [now] = useState(() => Date.now());
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IAdminStaff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IAdminStaff | null>(null);
  const [multiDeleteOpen, setMultiDeleteOpen] = useState(false);

  // ── Multi-select ──
  const {
    selectedIds,
    toggle,
    toggleAllOnPage,
    isAllSelectedOnPage,
    isSomeSelectedOnPage,
    clear,
  } = useMultiSelect();

  const filteredStaff = useMemo(() => {
    const filtered = staff.filter((item) => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchSearch =
        !debouncedSearch ||
        item.fullName.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower);
      const matchRole = !roleVal || item.adminRole === roleVal;
      return matchSearch && matchRole;
    });
    return [...filtered].sort((a, b) => {
      if (sortVal === 'name_asc') return a.fullName.localeCompare(b.fullName, 'vi', { sensitivity: 'base', numeric: true });
      if (sortVal === 'name_desc') return b.fullName.localeCompare(a.fullName, 'vi', { sensitivity: 'base', numeric: true });
      const difference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortVal === 'oldest' ? difference : -difference;
    });
  }, [staff, debouncedSearch, roleVal, sortVal]);

  const eligibleStaffIds = useMemo(() => {
    return filteredStaff
      .filter((s) => s.adminRole !== 'SUPER_ADMIN' && s._id !== currentUser?._id)
      .map((s) => s._id);
  }, [filteredStaff, currentUser]);

  const isAllSelected = isAllSelectedOnPage(eligibleStaffIds);
  const isSomeSelected = isSomeSelectedOnPage(eligibleStaffIds);



  const handleConfirmMultiDelete = () => {
    multiDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setMultiDeleteOpen(false);
        clear();
      },
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(searchVal.trim() || roleVal || sortVal !== 'newest' || page > 1);
  }, [searchVal, roleVal, sortVal, page]);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleSave = (data: StaffFormValues) => {
    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget._id, data },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditTarget(null);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setFormOpen(false);
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => setDeleteTarget(null),
    });
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
    <TooltipProvider>
      <div className="w-full space-y-6 pb-20">
        {/* Dialogs */}
        <StaffFormDialog
          key={editTarget?._id ?? (formOpen ? 'create-open' : 'create-closed')}
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditTarget(null);
          }}
          initial={editTarget}
          availableRoles={availableRoles}
          onSave={handleSave}
        />

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
          title="Xóa tài khoản nhân viên?"
          description={`Tài khoản của nhân viên ${deleteTarget?.fullName || deleteTarget?.email} sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.`}
          onConfirm={handleConfirmDelete}
          isPending={deleteMutation.isPending}
        />

        <ConfirmDialog
          open={multiDeleteOpen}
          onOpenChange={setMultiDeleteOpen}
          title="Xóa hàng loạt nhân viên?"
          description={`Xóa vĩnh viễn ${selectedIds.length} tài khoản nhân viên được chọn khỏi cơ sở dữ liệu.`}
          onConfirm={handleConfirmMultiDelete}
          isPending={multiDeleteMutation.isPending}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Quản lý Nhân sự</h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              Phân quyền Admin, quản trị viên và điều hành hệ thống.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => invalidate()} disabled={isFetching} className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Làm mới danh sách nhân sự</p>
              </TooltipContent>
            </Tooltip>
            <Button onClick={() => setFormOpen(true)} className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Thêm nhân viên
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Tổng nhân viên"
            value={staff.length}
            icon={<UserCog className="h-5 w-5 text-indigo-500" />}
          />
          <KpiCard
            label="Super Admin"
            value={staff.filter((item) => item.adminRole === 'SUPER_ADMIN').length}
            icon={<Shield className="h-5 w-5 text-red-500" />}
          />
          <KpiCard
            label="Lần đăng nhập gần nhất"
            value={staff.length > 0 ? 'Hôm nay' : '—'}
            icon={<RefreshCw className="h-5 w-5 text-emerald-500" />}
          />
        </div>

        {/* Search & Filters */}
        <div className={`${cardClass} p-4 space-y-3`}>
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
                placeholder="Tìm nhân viên theo tên hoặc email..."
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

          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
            <div className="w-48">
              <Select
                value={roleVal}
                onValueChange={(event) => {
                  const val = event;
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả vai trò</SelectItem>
                                  {rolesData.map((role) => (
                                    <SelectItem key={role.roleKey} value={role.roleKey}>
                                      {role.label}
                                    </SelectItem>
                                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={sortVal} onValueChange={(event) => {
                const nextParams = new URLSearchParams(searchParams);
                if (event === 'newest') nextParams.delete('sort');
                else nextParams.set('sort', event);
                nextParams.delete('page');
                setSearchParams(nextParams, { replace: true });
              }}>
                <SelectTrigger aria-label="Sắp xếp">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                                  <SelectItem value="name_asc">Tên A → Z</SelectItem>
                                  <SelectItem value="name_desc">Tên Z → A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-opacity">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b border-zinc-100 dark:border-zinc-800 transition-colors ${selectedIds.length > 0 ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}>
                  <th className="w-10 px-4 py-3.5 align-middle">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = isSomeSelected;
                        }
                      }}
                      onChange={() => toggleAllOnPage(eligibleStaffIds)}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4 bg-transparent"
                    />
                  </th>
                  {selectedIds.length > 0 ? (
                    <th colSpan={6} className="px-4 py-2.5 align-middle text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          Đã chọn {selectedIds.length} nhân viên
                        </span>
                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setMultiDeleteOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 transition"
                          >
                            Xóa nhân viên
                          </button>
                          <button
                            onClick={clear}
                            className="px-2.5 py-1 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                          >
                            Hủy chọn
                          </button>
                        </div>
                      </div>
                    </th>
                  ) : (
                    ['Nhân viên', 'Vai trò Admin', 'Trạng thái', 'Phòng ban', 'Đăng nhập gần nhất', 'Hành động'].map(
                      (header) => (
                        <th
                          key={header}
                          className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      )
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredStaff.map((item) => (
                  <StaffTableRow
                    key={item._id}
                    staff={item}
                    rolesData={rolesData}
                    now={now}
                    onEdit={(target) => {
                      setEditTarget(target);
                      setFormOpen(true);
                    }}
                    onDelete={setDeleteTarget}
                    isSelected={selectedIds.includes(item._id)}
                    onToggleSelect={toggle}
                    currentAdminId={currentUser?._id}
                  />
                ))}
              </tbody>
            </table>
            {filteredStaff.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <UserCog className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Không tìm thấy nhân viên phù hợp.</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-500">
            Hiển thị {filteredStaff.length} / {staff.length} nhân viên
          </div>
        </div>

      </div>
    </TooltipProvider>
  );
};
