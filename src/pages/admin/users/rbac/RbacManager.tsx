// ========================
// RbacManager: File đầu mối sau khi đã tách nhỏ thành các sub-components và constants riêng.
// Giữ phần điều phối state, query, và luồng thao tác phân quyền tại đây.
// ========================
import React, { useState } from 'react';
import { Info, Loader2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import type { IRolePermission } from '@/types/admin.types';
import { getRoleBadgeClass } from '@/types/admin.types';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PermissionGroupCard } from './PermissionGroupCard';
import { ALL_PERMISSIONS, RESOURCE_GROUPS } from './rbac.constants';
import { RoleFormDialog } from './RoleFormDialog';
import { RoleListItem } from './RoleListItem';

export const RbacManager: React.FC = () => {
  const { roles, isLoading, invalidate, updateMut, deleteMut } = useAdminRoles();
  const [selectedKey, setSelectedKey] = useState('CONTENT_MANAGER');
  const [localPerms, setLocalPerms] = useState<Record<string, string[]>>({});
  const [dirtyRoles, setDirtyRoles] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<IRolePermission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const selected = roles.find((role) => role.roleKey === selectedKey);
  const isSystem = selected?.isSystem ?? false;
  const isDirty = dirtyRoles.has(selectedKey);
  const currentPerms = isDirty
    ? localPerms[selectedKey] ?? selected?.permissions ?? []
    : selected?.permissions ?? [];

  const handleSavePerms = () => {
    updateMut.mutate(
      { roleKey: selectedKey, data: { permissions: currentPerms } },
      {
        onSuccess: () => {
          toast.success('Đã lưu phân quyền.');
          setDirtyRoles((prev) => {
            const next = new Set(prev);
            next.delete(selectedKey);
            return next;
          });
        },
        onError: (error: unknown) => toast.error((error as Error).message || 'Không thể lưu phân quyền.'),
      }
    );
  };

  const handleToggle = (permissionId: string) => {
    if (isSystem) {
      toast.error('Không thể chỉnh quyền Super Admin.');
      return;
    }

    setLocalPerms((prev) => {
      return {
        ...prev,
        [selectedKey]: currentPerms.includes(permissionId)
          ? currentPerms.filter((item) => item !== permissionId)
          : [...currentPerms, permissionId],
      };
    });
    setDirtyRoles((prev) => new Set(prev).add(selectedKey));
  };

  const handleSelectAllForResource = (resource: string) => {
    if (isSystem) return;
    const permissionIds = ALL_PERMISSIONS
      .filter((permission) => permission.resource === resource)
      .map((permission) => permission.id);
    const allSelected = permissionIds.every((permissionId) => currentPerms.includes(permissionId));

    setLocalPerms((prev) => ({
      ...prev,
      [selectedKey]: allSelected
        ? currentPerms.filter((permissionId) => !permissionIds.includes(permissionId as (typeof permissionIds)[number]))
        : [...new Set([...currentPerms, ...permissionIds])],
    }));
    setDirtyRoles((prev) => new Set(prev).add(selectedKey));
  };

  const confirmDeleteRole = () => {
    if (!deleteTarget) return;

    deleteMut.mutate(deleteTarget, {
      onSuccess: () => {
        if (selectedKey === deleteTarget) {
          setSelectedKey('CONTENT_MANAGER');
        }
        setDeleteTarget(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Phân quyền RBAC</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Tạo và thiết lập quyền hạn cho từng vai trò Admin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateOpen(true)}
            id="btn-create-role"
            variant="outline"
            className="flex items-center gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
          >
            <Plus className="w-4 h-4" /> Tạo vai trò
          </Button>
          <Button
            onClick={handleSavePerms}
            disabled={updateMut.isPending || isSystem || !isDirty}
            id="btn-save-rbac"
            className="flex items-center gap-2 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {updateMut.isPending ? 'Đang lưu...' : isDirty ? 'Lưu thay đổi *' : 'Đã lưu'}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Super Admin</strong> có toàn quyền và không thể thay đổi. Thay đổi permissions áp dụng ngay lập tức cho tất cả nhân viên cùng vai trò.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Vai trò Admin
          </h2>
          {roles.map((role) => (
            <RoleListItem
              key={role.roleKey}
              role={role}
              isSelected={selectedKey === role.roleKey}
              permissionCount={(dirtyRoles.has(role.roleKey) ? localPerms[role.roleKey] ?? role.permissions : role.permissions).length}
              onSelect={setSelectedKey}
              onEdit={setEditRole}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex-1">
              Quyền hạn
            </h2>
            {selected && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(selected.color)}`}>
                {selected.label}
              </span>
            )}
          </div>

          {RESOURCE_GROUPS.map((group) => (
            <PermissionGroupCard
              key={group.key}
              resourceKey={group.key}
              label={group.label}
              icon={group.icon}
              currentPerms={currentPerms}
              isSystem={isSystem}
              onSelectAll={handleSelectAllForResource}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      <RoleFormDialog
        key={editRole?.roleKey ?? (createOpen ? 'create-open' : 'create-closed')}
        open={createOpen || editRole !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditRole(null);
          }
        }}
        onSuccess={invalidate}
        initialData={editRole}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xóa vai trò?"
        description={`Vai trò "${roles.find((role) => role.roleKey === deleteTarget)?.label}" sẽ bị xóa vĩnh viễn khỏi hệ thống (nếu không có nhân viên nào đang sử dụng). Hành động này không thể hoàn tác.`}
        confirmText={deleteMut.isPending ? 'Đang xóa...' : 'Xóa vai trò'}
        isDestructive
        onConfirm={confirmDeleteRole}
      />
    </div>
  );
};
