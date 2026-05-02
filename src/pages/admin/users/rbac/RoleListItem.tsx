// ========================
// RoleListItem: Component hiển thị từng role trong danh sách của module RBAC đã tách nhỏ.
// ========================
import React from 'react';
import { Crown, Pencil, Trash2 } from 'lucide-react';
import type { IRolePermission } from '@/types/admin.types';
import { Button } from '@/components/ui/button';
import { COLOR_DOTS, COLOR_SELECTED } from './rbac.constants';

interface RoleListItemProps {
  role: IRolePermission;
  isSelected: boolean;
  permissionCount: number;
  onSelect: (roleKey: string) => void;
  onEdit: (role: IRolePermission) => void;
  onDelete: (roleKey: string) => void;
}

export const RoleListItem: React.FC<RoleListItemProps> = ({
  role,
  isSelected,
  permissionCount,
  onSelect,
  onEdit,
  onDelete,
}) => (
  <div className="group relative">
    <Button
      onClick={() => onSelect(role.roleKey)}
      variant="ghost"
      className={`w-full p-3.5 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${
        isSelected
          ? COLOR_SELECTED[role.color] ?? COLOR_SELECTED.zinc
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40'
      }`}
    >
      {role.isSystem && <Crown className="w-4 h-4 text-red-400 shrink-0" />}
      <div className="min-w-0 flex-1">
        <span
          className={`block text-sm font-semibold truncate ${
            isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'
          }`}
        >
          {role.label}
        </span>
        <span className="block text-xs text-zinc-400 mt-0.5">
          {role.isSystem ? 'Toàn quyền hệ thống' : `${permissionCount} quyền`}
        </span>
      </div>
      <div
        className={`ml-auto shrink-0 rounded-full transition-all ${
          isSelected ? 'w-2.5 h-2.5' : 'w-2 h-2 opacity-40'
        } ${COLOR_DOTS[role.color] ?? 'bg-zinc-500'}`}
      />
    </Button>

    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 z-10">
      <button
        onClick={(event) => {
          event.stopPropagation();
          onEdit(role);
        }}
        className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-primary hover:border-primary/50 transition-colors shadow-sm"
        title="Sửa tên/màu"
      >
        <Pencil className="w-3 h-3" />
      </button>
      {!role.isSystem && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(role.roleKey);
          }}
          className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
          title="Xóa vai trò"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  </div>
);
