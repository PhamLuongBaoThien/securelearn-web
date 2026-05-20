// ========================
// StaffList: File đầu mối sau khi đã tách nhỏ thành dialog, row component, và utils riêng.
// Giữ phần điều phối state, query, filter, và thao tác quản lý nhân sự tại đây.
// ========================
import React, { useState } from 'react';
import { Plus, Search, UserCog } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StaffFormDialog } from './StaffFormDialog';
import { StaffTableRow } from './StaffTableRow';
import type { StaffFormValues } from './staff.utils';

export const StaffList: React.FC = () => {
  const { staff, isLoading } = useAdminStaff();
  const { roles: rolesData } = useAdminRoles();
  const createMutation = useCreateAdminStaff();
  const updateMutation = useUpdateAdminStaff();
  const deleteMutation = useDeleteAdminStaff();

  const availableRoles = rolesData.filter((role) => role.roleKey !== 'SUPER_ADMIN');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [now] = useState(() => Date.now());
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IAdminStaff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IAdminStaff | null>(null);

  const filteredStaff = staff.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      !search ||
      item.fullName.toLowerCase().includes(searchLower) ||
      item.email.toLowerCase().includes(searchLower);
    const matchRole = !roleFilter || item.adminRole === roleFilter;
    return matchSearch && matchRole;
  });

  const handleSave = (data: StaffFormValues) => {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget._id, data });
      return;
    }

    createMutation.mutate(data);
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

  const roleStats =
    rolesData.length > 0
      ? rolesData
      : Array.from(new Set(staff.map((item) => item.adminRole))).map((roleKey) => ({
          roleKey,
          label: roleKey,
        }));

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-500">Đang tải danh sách nhân viên...</div>;
  }

  return (
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Danh sách nhân viên</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Quản lý tài khoản Admin — thêm, sửa, xóa và phân vai trò nhân viên.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm nhân viên
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {roleStats.map((role) => (
          <div
            key={role.roleKey}
            className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {staff.filter((item) => item.adminRole === role.roleKey).length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{role.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <Input
            className="bg-transparent text-sm flex-1 border-0 shadow-none px-0 py-0 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-0"
            placeholder="Tìm theo tên, email..."
            name="admin-staff-search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          {rolesData.map((role) => (
            <option key={role.roleKey} value={role.roleKey}>
              {role.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
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
  );
};
