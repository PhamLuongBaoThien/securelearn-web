import React, { useState } from 'react';
import { Shield, Check, Info, Save, BookOpen, Users, DollarSign, Lock, Settings } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/types/admin.types';

interface Permission { id: string; resource: string; action: string; label: string; description: string; }

const ALL_PERMISSIONS: Permission[] = [
  // Course Service
  { id: 'course:read', resource: 'course', action: 'read', label: 'Xem khóa học', description: 'Truy cập danh sách và chi tiết khóa học' },
  { id: 'course:create', resource: 'course', action: 'create', label: 'Tạo khóa học', description: 'Đăng tải khóa học mới lên nền tảng' },
  { id: 'course:update', resource: 'course', action: 'update', label: 'Sửa khóa học', description: 'Chỉnh sửa nội dung và cấu trúc khóa học' },
  { id: 'course:delete', resource: 'course', action: 'delete', label: 'Xóa khóa học', description: 'Xóa vĩnh viễn khóa học khỏi hệ thống' },
  { id: 'course:approve', resource: 'course', action: 'approve', label: 'Duyệt khóa học', description: 'Phê duyệt hoặc từ chối xuất bản khóa học' },
  // User Management
  { id: 'user:read', resource: 'user', action: 'read', label: 'Xem người dùng', description: 'Tra cứu thông tin tài khoản' },
  { id: 'user:lock', resource: 'user', action: 'lock', label: 'Khóa/Mở tài khoản', description: 'Đình chỉ hoặc khôi phục tài khoản người dùng' },
  { id: 'user:password', resource: 'user', action: 'password', label: 'Đặt lại mật khẩu', description: 'Thiết lập mật khẩu mới cho người dùng' },
  // Finance
  { id: 'finance:read', resource: 'finance', action: 'read', label: 'Xem tài chính', description: 'Xem giao dịch và báo cáo doanh thu' },
  { id: 'finance:manage', resource: 'finance', action: 'manage', label: 'Quản lý gói cước', description: 'Thêm, sửa, xóa các gói cước' },
  // Media & Security
  { id: 'media:read', resource: 'media', action: 'read', label: 'Xem media', description: 'Xem trạng thái mã hóa và khóa KMS' },
  { id: 'media:manage', resource: 'media', action: 'manage', label: 'Quản lý media', description: 'Thu hồi khóa và cấu hình bảo vệ' },
  // System
  { id: 'system:config', resource: 'system', action: 'config', label: 'Cấu hình hệ thống', description: 'Thay đổi cài đặt toàn hệ thống' },
  { id: 'system:rbac', resource: 'system', action: 'rbac', label: 'Quản lý phân quyền', description: 'Thiết lập RBAC cho các vai trò' },
];

const RESOURCE_GROUPS: { label: string; key: string; icon: React.ReactNode }[] = [
  { label: 'Nội dung', key: 'course', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { label: 'Người dùng', key: 'user', icon: <Users className="w-3.5 h-3.5" /> },
  { label: 'Tài chính', key: 'finance', icon: <DollarSign className="w-3.5 h-3.5" /> },
  { label: 'Media & Bảo mật', key: 'media', icon: <Lock className="w-3.5 h-3.5" /> },
  { label: 'Hệ thống', key: 'system', icon: <Settings className="w-3.5 h-3.5" /> },
];

const DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ALL_PERMISSIONS.map((p) => p.id),
  INSTRUCTOR: ['course:read', 'course:create', 'course:update', 'user:read'],
  STUDENT: ['course:read'],
};

const roleColors: Record<UserRole, string> = {
  ADMIN: 'border-amber-500/30 bg-amber-500/5',
  INSTRUCTOR: 'border-violet-500/30 bg-violet-500/5',
  STUDENT: 'border-blue-500/30 bg-blue-500/5',
};
const roleBadge: Record<UserRole, string> = {
  ADMIN: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400',
  INSTRUCTOR: 'bg-violet-100 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400',
  STUDENT: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400',
};

export const RbacManager: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('INSTRUCTOR');
  const [permissions, setPermissions] = useState<Record<UserRole, string[]>>(DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);

  const currentPerms = permissions[selectedRole];

  const handleToggle = (permId: string) => {
    if (selectedRole === 'ADMIN') { toast.error('Không thể chỉnh quyền Admin.'); return; }
    setPermissions((prev) => {
      const current = prev[selectedRole];
      return { ...prev, [selectedRole]: current.includes(permId) ? current.filter((p) => p !== permId) : [...current, permId] };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success(`Đã lưu phân quyền cho vai trò ${selectedRole}.`);
  };

  const roles: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'STUDENT'];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Phân quyền RBAC</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Thiết lập và điều chỉnh quyền hạn cụ thể cho từng vai trò trong hệ thống.</p>
        </div>
        <button onClick={handleSave} disabled={saving || selectedRole === 'ADMIN'} id="btn-save-rbac" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all shadow-lg shadow-primary/20">
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">Quyền Admin là cố định và không thể chỉnh sửa để đảm bảo an toàn hệ thống. Chọn vai trò Giảng viên hoặc Học viên để thiết lập phân quyền.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Vai trò</h2>
          {roles.map((role) => (
            <button
              key={role}
              id={`btn-role-${role}`}
              onClick={() => setSelectedRole(role)}
              className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 text-left ${selectedRole === role ? roleColors[role] + ' shadow-sm' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40'}`}
            >
              <Shield className={`w-5 h-5 shrink-0 ${selectedRole === role ? 'text-primary' : 'text-zinc-400'}`} />
              <div>
                <span className={`block text-sm font-semibold ${selectedRole === role ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {role === 'ADMIN' ? 'Quản trị viên' : role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'}
                </span>
                <span className="block text-xs text-zinc-400 mt-0.5">{permissions[role].length} quyền</span>
              </div>
              {selectedRole === role && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex-1">
              Quyền hạn của vai trò
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge[selectedRole]}`}>
              {selectedRole}
            </span>
          </div>

          {RESOURCE_GROUPS.map((group) => {
            const groupPerms = ALL_PERMISSIONS.filter((p) => p.resource === group.key);
            const allGranted = groupPerms.every((p) => currentPerms.includes(p.id));
            return (
              <div key={group.key} className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{group.icon}{group.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${allGranted ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {groupPerms.filter((p) => currentPerms.includes(p.id)).length}/{groupPerms.length}
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {groupPerms.map((perm) => {
                    const granted = currentPerms.includes(perm.id);
                    const isAdmin = selectedRole === 'ADMIN';
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleToggle(perm.id)}
                        className={`flex items-center gap-4 px-4 py-3 transition-colors ${isAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${granted ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600'}`}>
                          {granted && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${granted ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>{perm.label}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{perm.description}</p>
                        </div>
                        <code className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg font-mono shrink-0">{perm.id}</code>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
