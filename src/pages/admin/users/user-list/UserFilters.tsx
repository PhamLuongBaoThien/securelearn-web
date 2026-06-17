// ========================
// UserFilters: Component bộ lọc người dùng, tách riêng để giữ UserList gọn hơn.
// ========================
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface UserFiltersProps {
  search: string;
  roleFilter: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

const selectCls =
  'px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/30';

export const UserFilters: React.FC<UserFiltersProps> = ({
  search,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}) => (
  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm space-y-3">
    {/* Search */}
    <div className="flex items-center gap-2 w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
      <Search className="w-4 h-4 text-zinc-400 shrink-0" />
      <Input
        className="bg-transparent text-sm flex-1 border-0 shadow-none px-0 py-0 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-0"
        placeholder="Tìm theo tên, email..."
        name="admin-user-search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>

    {/* Filters */}
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
      <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
      <Select
        className={selectCls}
        value={roleFilter}
        onChange={(e) => onRoleChange(e.target.value)}
      >
        <option value="">Tất cả vai trò</option>
        <option value="STUDENT">Học viên</option>
        <option value="INSTRUCTOR">Giảng viên</option>
      </Select>

      <Select
        className={selectCls}
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">Tất cả trạng thái</option>
        <option value="ACTIVE">Hoạt động</option>
        <option value="LOCKED">Đã khóa</option>
      </Select>
    </div>
  </div>
);
