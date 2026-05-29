// ========================
// StaffFilters: Component bộ lọc nhân viên, tách riêng để giữ StaffList gọn hơn.
// ========================
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { IRolePermission } from '@/types/admin.types';

interface StaffFiltersProps {
  search: string;
  roleFilter: string;
  rolesData: IRolePermission[];
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
}

export const StaffFilters: React.FC<StaffFiltersProps> = ({
  search,
  roleFilter,
  rolesData,
  onSearchChange,
  onRoleChange,
}) => (
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
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
    <Select
      className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
      value={roleFilter}
      onChange={(event) => onRoleChange(event.target.value)}
    >
      <option value="">Tất cả vai trò</option>
      {rolesData.map((role) => (
        <option key={role.roleKey} value={role.roleKey}>
          {role.label}
        </option>
      ))}
    </Select>
  </div>
);
