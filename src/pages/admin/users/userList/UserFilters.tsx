// ========================
// UserFilters: Component bộ lọc người dùng, tách riêng để giữ UserList gọn hơn.
// ========================
import React from 'react';
import { Search, Filter } from 'lucide-react';

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
  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm flex flex-wrap gap-3">
    {/* Search */}
    <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
      <Search className="w-4 h-4 text-zinc-400 shrink-0" />
      <input
        className="bg-transparent text-sm flex-1 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
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
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
      <select
        className={selectCls}
        value={roleFilter}
        onChange={(e) => onRoleChange(e.target.value)}
      >
        <option value="">Tất cả vai trò</option>
        <option value="STUDENT">Học viên</option>
        <option value="INSTRUCTOR">Giảng viên</option>
      </select>

      <select
        className={selectCls}
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">Tất cả trạng thái</option>
        <option value="ACTIVE">Hoạt động</option>
        <option value="LOCKED">Đã khóa</option>
      </select>
    </div>
  </div>
);
