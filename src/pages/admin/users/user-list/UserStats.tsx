// ========================
// UserStats: Component thống kê nhanh cho module user list đã tách nhỏ.
// ========================
import React from 'react';
import { Shield } from 'lucide-react';
import type { IAdminUser } from '@/types/admin.types';

interface UserStatsProps {
  users: IAdminUser[];
  total: number;
}

export const UserStats: React.FC<UserStatsProps> = ({ users, total }) => {
  const stats = [
    {
      label: 'Học viên',
      count: users.filter((u) => u.role === 'STUDENT').length,
      cls: 'text-blue-500',
    },
    {
      label: 'Giảng viên',
      count: users.filter((u) => u.role === 'INSTRUCTOR').length,
      cls: 'text-violet-500',
    },
    {
      label: 'Đã khóa',
      count: users.filter((u) => u.status === 'LOCKED').length,
      cls: 'text-red-500',
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
            Danh sách người dùng
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Quản lý tài khoản Học viên và Giảng viên trên nền tảng.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-500 shadow-sm">
          <Shield className="w-4 h-4 text-primary" />
          <span>
            <b className="text-zinc-900 dark:text-white">{total}</b> tài khoản
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm"
          >
            <p className={`text-2xl font-bold ${s.cls}`}>{s.count}</p>
            <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </>
  );
};
