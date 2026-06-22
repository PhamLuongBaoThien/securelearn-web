// ========================
// StaffList: File đầu mối sau khi đã tách nhỏ thành dialog, row component, và utils riêng.
// Giữ phần điều phối state, query, filter, và thao tác quản lý nhân sự tại đây.
// ========================
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, UserCog, RefreshCw, Search, Shield, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { IAdminStaff } from '@/types/admin.types';
import {
  useAdminStaff,
  useCreateAdminStaff,
  useDeleteAdminStaff,
  useUpdateAdminStaff,
} from '@/hooks/useAdminStaff';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/useDebounce';
import { StaffFormDialog } from './StaffFormDialog';
import { StaffTableRow } from './StaffTableRow';
import type { StaffFormValues } from './staff.utils';

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
  const page = Math.max(Number(searchParams.get('page') || '1'), 1);

  const { staff, isLoading, isFetching, invalidate } = useAdminStaff();
  const { roles: rolesData } = useAdminRoles();
  const createMutation = useCreateAdminStaff();
  const updateMutation = useUpdateAdminStaff();
  const deleteMutation = useDeleteAdminStaff();

  const availableRoles = rolesData.filter((role) => role.roleKey !== 'SUPER_ADMIN');

  const debouncedSearch = useDebounce(searchVal.trim(), 300);

  const [now] = useState(() => Date.now());
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IAdminStaff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IAdminStaff | null>(null);

  const filteredStaff = useMemo(() => {
    return staff.filter((item) => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchSearch =
        !debouncedSearch ||
        item.fullName.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower);
      const matchRole = !roleVal || item.adminRole === roleVal;
      return matchSearch && matchRole;
    });
  }, [staff, debouncedSearch, roleVal]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(searchVal.trim() || roleVal || page > 1);
  }, [searchVal, roleVal, page]);

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
      return;
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        setFormOpen(false);
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.adminRole === 'SUPER_ADMIN') {
      toast.error('Không thể xóa tài khoản Super Admin.');
      setDeleteTarget(null);
      return;
    }

    deleteMutation.mutate(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) });
  };

  const roleStats = useMemo(() => {
    return rolesData.length > 0
      ? rolesData
      : Array.from(new Set(staff.map((item) => item.adminRole))).map((roleKey) => ({
          roleKey,
          label: roleKey,
        }));
  }, [rolesData, staff]);

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
        <StaffFormDialog
          key={editTarget?._id ?? (formOpen ? 'create-open' : 'create-closed')}
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditTarget(null);
          }}
          initial={editTarget}
          onSave={handleSave}
          availableRoles={availableRoles}
        />
        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title="Xóa tài khoản nhân viên?"
          description={`Tài khoản ${deleteTarget?.email} sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác.`}
          confirmText="Xóa tài khoản"
          isDestructive
          onConfirm={handleDelete}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Danh sách nhân viên</h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">Quản lý tài khoản Admin — thêm, sửa, xóa và phân vai trò nhân viên.</p>
          </div>
          <div className="flex items-center gap-2">
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
                <p>Làm mới danh sách nhân viên</p>
              </TooltipContent>
            </Tooltip>
            <Button
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Thêm nhân viên
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {roleStats.map((role) => (
            <KpiCard
              key={role.roleKey}
              label={role.label}
              value={staff.filter((item) => item.adminRole === role.roleKey).length}
              sub="Nhân viên"
              icon={<Shield className="h-5 w-5 text-zinc-400" />}
            />
          ))}
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
                {rolesData.map((role) => (
                  <option key={role.roleKey} value={role.roleKey}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-opacity">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  {['Nhân viên', 'Vai trò Admin', 'Trạng thái', 'Phòng ban', 'Đăng nhập gần nhất', 'Hành động'].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
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
