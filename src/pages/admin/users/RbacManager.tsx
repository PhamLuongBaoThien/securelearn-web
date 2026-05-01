// ========================
// RBAC Manager: Phân quyền cho Admin (nhân viên)
// Super Admin: quản lý tất cả + có thể thêm/gán role
// Các admin khác: xem quyền của mình
// ========================
import React, { useState } from 'react';
import { Check, Info, Save, BookOpen, Users, DollarSign, Lock, Settings, Plus, X, Crown } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminRole } from '@/types/admin.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ─── Permission definitions ───
interface Permission { id: string; resource: string; action: string; label: string; description: string; }

const ALL_PERMISSIONS: Permission[] = [
  // Course / Content
  { id: 'course:read',    resource: 'course',   action: 'read',    label: 'Xem khóa học',         description: 'Truy cập danh sách và chi tiết khóa học' },
  { id: 'course:update',  resource: 'course',   action: 'update',  label: 'Sửa khóa học',          description: 'Chỉnh sửa nội dung và cấu trúc khóa học' },
  { id: 'course:delete',  resource: 'course',   action: 'delete',  label: 'Xóa khóa học',          description: 'Xóa vĩnh viễn khóa học khỏi hệ thống' },
  { id: 'course:approve', resource: 'course',   action: 'approve', label: 'Duyệt khóa học',        description: 'Phê duyệt hoặc từ chối xuất bản khóa học' },
  // User
  { id: 'user:read',      resource: 'user',     action: 'read',    label: 'Xem người dùng',        description: 'Tra cứu thông tin tài khoản học viên/giảng viên' },
  { id: 'user:lock',      resource: 'user',     action: 'lock',    label: 'Khóa/Mở tài khoản',    description: 'Đình chỉ hoặc khôi phục tài khoản người dùng' },
  { id: 'user:password',  resource: 'user',     action: 'password', label: 'Đặt lại mật khẩu',   description: 'Thiết lập mật khẩu mới cho người dùng' },
  // Finance
  { id: 'finance:read',   resource: 'finance',  action: 'read',    label: 'Xem tài chính',         description: 'Xem giao dịch và báo cáo doanh thu' },
  { id: 'finance:manage', resource: 'finance',  action: 'manage',  label: 'Quản lý gói cước',      description: 'Thêm, sửa, xóa các gói cước' },
  // Notifications
  { id: 'notif:read',     resource: 'notif',    action: 'read',    label: 'Xem thông báo',         description: 'Xem lịch sử và cấu hình thông báo' },
  { id: 'notif:manage',   resource: 'notif',    action: 'manage',  label: 'Quản lý thông báo',     description: 'Tạo và gửi thông báo cho học viên/giảng viên' },
  // System
  { id: 'system:config',  resource: 'system',   action: 'config',  label: 'Cấu hình hệ thống',    description: 'Thay đổi cài đặt toàn hệ thống' },
  { id: 'system:rbac',    resource: 'system',   action: 'rbac',    label: 'Quản lý phân quyền',   description: 'Thiết lập RBAC và quản lý nhân viên' },
];

const RESOURCE_GROUPS: { label: string; key: string; icon: React.ReactNode }[] = [
  { label: 'Nội dung đào tạo', key: 'course',  icon: <BookOpen className="w-3.5 h-3.5" /> },
  { label: 'Người dùng',       key: 'user',    icon: <Users className="w-3.5 h-3.5" /> },
  { label: 'Tài chính',        key: 'finance', icon: <DollarSign className="w-3.5 h-3.5" /> },
  { label: 'Thông báo',        key: 'notif',   icon: <Lock className="w-3.5 h-3.5" /> },
  { label: 'Hệ thống',         key: 'system',  icon: <Settings className="w-3.5 h-3.5" /> },
];

// Default permissions per admin role
const ALL_PERM_IDS = ALL_PERMISSIONS.map(p => p.id);
const DEFAULT_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN:     ALL_PERM_IDS,
  CONTENT_MANAGER: ['course:read', 'course:update', 'course:approve'],
  FINANCE_MANAGER: ['finance:read', 'finance:manage'],
  SUPPORT_AGENT:   ['user:read'],
};

const ROLE_CONFIG: Record<AdminRole, { label: string; color: string; badge: string; desc: string }> = {
  SUPER_ADMIN:     { label: 'Super Admin',       color: 'border-red-500/30 bg-red-500/5',           badge: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400',            desc: 'Toàn quyền' },
  CONTENT_MANAGER: { label: 'Quản lý nội dung',  color: 'border-violet-500/30 bg-violet-500/5',     badge: 'bg-violet-100 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400',  desc: 'Duyệt & quản lý KH' },
  FINANCE_MANAGER: { label: 'Quản lý tài chính', color: 'border-emerald-500/30 bg-emerald-500/5',   badge: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400', desc: 'Giao dịch & gói cước' },
  SUPPORT_AGENT:   { label: 'Nhân viên hỗ trợ',  color: 'border-blue-500/30 bg-blue-500/5',         badge: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400',          desc: 'Hỗ trợ người dùng' },
};

// ─── Main ───
export const RbacManager: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<AdminRole>('CONTENT_MANAGER');
  const [permissions, setPermissions] = useState<Record<AdminRole, string[]>>(DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);
  // Super admin: manage roles (add new custom role — demo only)
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const currentPerms = permissions[selectedRole];
  const isSuperAdmin = selectedRole === 'SUPER_ADMIN';

  const handleToggle = (permId: string) => {
    if (isSuperAdmin) { toast.error('Không thể chỉnh quyền Super Admin — toàn quyền hệ thống.'); return; }
    setPermissions(prev => {
      const cur = prev[selectedRole];
      return { ...prev, [selectedRole]: cur.includes(permId) ? cur.filter(p => p !== permId) : [...cur, permId] };
    });
  };

  const handleSelectAll = (resource: string) => {
    if (isSuperAdmin) return;
    const groupPerms = ALL_PERMISSIONS.filter(p => p.resource === resource).map(p => p.id);
    const allGranted = groupPerms.every(p => currentPerms.includes(p));
    setPermissions(prev => ({
      ...prev,
      [selectedRole]: allGranted
        ? prev[selectedRole].filter(p => !groupPerms.includes(p))
        : [...new Set([...prev[selectedRole], ...groupPerms])],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success(`Đã lưu phân quyền cho ${ROLE_CONFIG[selectedRole].label}.`);
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    toast.success(`Vai trò "${newRoleName}" đã được tạo (chức năng demo).`);
    setNewRoleName('');
    setShowAddRole(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Phân quyền RBAC</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Thiết lập quyền hạn cho từng vai trò Admin trong hệ thống.</p>
        </div>
        <div className="flex gap-2">
          {/* Super Admin only: Add role */}
          <Button
            onClick={() => setShowAddRole(v => !v)}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
            title="Chỉ Super Admin mới có thể tạo vai trò mới"
          >
            <Crown className="w-4 h-4 text-amber-500" /> Thêm vai trò
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || isSuperAdmin}
            id="btn-save-rbac"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {/* Add Role Panel — Super Admin only */}
      {showAddRole && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <Crown className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Tạo vai trò mới (Super Admin)</p>
          <Input
            className="ml-auto flex-1 max-w-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            placeholder="Tên vai trò mới..."
            value={newRoleName}
            onChange={e => setNewRoleName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddRole()}
          />
          <Button type="button" size="icon" onClick={handleAddRole} className="p-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"><Plus className="w-4 h-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setShowAddRole(false)} className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></Button>
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Super Admin</strong> có toàn quyền hệ thống và không thể bị thay đổi quyền. Chỉ Super Admin mới có thể tạo vai trò mới hoặc thay đổi phân quyền của các nhân viên khác.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Vai trò Admin</h2>
          {(Object.keys(ROLE_CONFIG) as AdminRole[]).map(role => {
            const cfg = ROLE_CONFIG[role];
            return (
              <Button
                key={role}
                id={`btn-role-${role}`}
                onClick={() => setSelectedRole(role)}
                variant="ghost"
                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 text-left ${selectedRole === role ? cfg.color + ' shadow-sm' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40'}`}
              >
                {/* {role === 'SUPER_ADMIN'
                  ? <Crown className={`w-5 h-5 shrink-0 ${selectedRole === role ? 'text-red-500' : 'text-zinc-400'}`} />
                  : <Shield className={`w-5 h-5 shrink-0 ${selectedRole === role ? 'text-primary' : 'text-zinc-400'}`} />
                } */}
                <div className="min-w-0">
                  <span className={`block text-sm font-semibold truncate ${selectedRole === role ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{cfg.label}</span>
                  <span className="block text-xs text-zinc-400 mt-0.5 truncate">{permissions[role].length} quyền · {cfg.desc}</span>
                </div>
                {selectedRole === role && <div className="ml-auto w-2 h-2 rounded-full bg-primary shrink-0" />}
              </Button>
            );
          })}
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex-1">
              Quyền hạn
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_CONFIG[selectedRole].badge}`}>
              {ROLE_CONFIG[selectedRole].label}
            </span>
          </div>

          {RESOURCE_GROUPS.map(group => {
            const groupPerms = ALL_PERMISSIONS.filter(p => p.resource === group.key);
            const grantedCount = groupPerms.filter(p => currentPerms.includes(p.id)).length;
            const allGranted = grantedCount === groupPerms.length;

            return (
              <div key={group.key} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {group.icon}{group.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${allGranted ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                      {grantedCount}/{groupPerms.length}
                    </span>
                    {!isSuperAdmin && (
                      <Button
                        onClick={() => handleSelectAll(group.key)}
                        variant="ghost"
                        className="text-xs text-primary hover:underline"
                      >
                        {allGranted ? 'Bỏ tất cả' : 'Chọn tất cả'}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {groupPerms.map(perm => {
                    const granted = currentPerms.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleToggle(perm.id)}
                        className={`flex items-center gap-4 px-4 py-3 transition-colors ${isSuperAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
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
