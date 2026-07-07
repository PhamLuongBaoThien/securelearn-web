// ========================
// StaffTableRow: Component hiển thị từng dòng staff trong bảng quản lý nhân sự đã tách nhỏ.
// ========================
import React from 'react';
import { Edit2, Mail, Phone, ShieldCheck, Trash2 } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { IAdminStaff, IRolePermission } from '@/types/admin.types';
import { getRelativeLoginTime, getRoleMeta, STATUS_CONFIG } from './staff.utils';

interface StaffTableRowProps {
  staff: IAdminStaff;
  rolesData: IRolePermission[];
  now: number;
  onEdit: (staff: IAdminStaff) => void;
  onDelete: (staff: IAdminStaff) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  currentAdminId?: string;
}

export const StaffTableRow: React.FC<StaffTableRowProps> = ({
  staff,
  rolesData,
  now,
  onEdit,
  onDelete,
  isSelected,
  onToggleSelect,
  currentAdminId,
}) => {
  const statusConfig = STATUS_CONFIG[staff.status];
  const isSuperAdmin = staff.adminRole === 'SUPER_ADMIN';
  const { label, badgeClass } = getRoleMeta(staff.adminRole, rolesData);
  const canSelect = !isSuperAdmin && staff._id !== currentAdminId;

  return (
    <tr
      data-state={isSelected ? 'selected' : undefined}
      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group data-[state=selected]:bg-zinc-50 dark:data-[state=selected]:bg-zinc-800/20"
    >
      <td className="w-10 px-4 py-3.5 align-middle">
        {canSelect ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(staff._id)}
            className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4 bg-transparent"
          />
        ) : (
          <div className="w-4 h-4" />
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <UserAvatar
            user={staff}
            className="w-9 h-9 text-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{staff.fullName}</p>
              {isSuperAdmin && <ShieldCheck className="w-3.5 h-3.5 text-red-500" />}
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {staff.email}
            </p>
            {staff.phone && (
              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                {staff.phone}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>{label}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-zinc-500">{staff.department || '—'}</td>
      <td className="px-4 py-3.5 text-xs text-zinc-500">{getRelativeLoginTime(now, staff.lastLoginAt)}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(staff)}
            title="Chỉnh sửa"
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {!isSuperAdmin && (
            <button
              onClick={() => onDelete(staff)}
              title="Xóa tài khoản"
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
