// ========================
// Admin Staff Management: Danh sách nhân viên (CRUD tài khoản ADMIN)
// ========================
import React, { useState } from 'react';
import {
  UserCog, Plus, Search, Edit2, Trash2, KeyRound, ShieldCheck,
  Mail, Phone, Eye, EyeOff, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import type { IAdminStaff, AdminRole, UserStatus } from '@/types/admin.types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

// ─── Constants ───
const ADMIN_ROLE_CONFIG: Record<AdminRole, { label: string; color: string; desc: string }> = {
  SUPER_ADMIN:      { label: 'Super Admin',       color: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400',         desc: 'Toàn quyền hệ thống, quản lý nhân viên & phân quyền' },
  CONTENT_MANAGER:  { label: 'Quản lý nội dung',  color: 'bg-violet-100 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400', desc: 'Duyệt khóa học, quản lý danh mục & tài nguyên' },
  FINANCE_MANAGER:  { label: 'Quản lý tài chính', color: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400', desc: 'Xem giao dịch, quản lý gói cước & báo cáo doanh thu' },
  SUPPORT_AGENT:    { label: 'Nhân viên hỗ trợ',  color: 'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400',      desc: 'Hỗ trợ người dùng, xem thông tin tài khoản' },
};

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
  ACTIVE:     { label: 'Hoạt động',      color: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' },
  LOCKED:     { label: 'Đã khóa',        color: 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400' },
  UNVERIFIED: { label: 'Chưa xác minh',  color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' },
};

// ─── Staff Form Dialog ───
interface StaffFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: IAdminStaff | null;
  onSave: (data: Partial<IAdminStaff> & { password?: string }) => void;
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
    {children}
  </div>
);

const StaffFormDialog: React.FC<StaffFormProps> = ({ open, onOpenChange, initial, onSave }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    fullName: initial?.fullName || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    department: initial?.department || '',
    adminRole: initial?.adminRole || 'SUPPORT_AGENT' as AdminRole,
    password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        fullName: initial?.fullName || '',
        email: initial?.email || '',
        phone: initial?.phone || '',
        department: initial?.department || '',
        adminRole: initial?.adminRole || 'SUPPORT_AGENT',
        password: '',
      });
      setShowPw(false);
    }
  }, [open, initial]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.fullName.trim()) { toast.error('Vui lòng nhập họ tên.'); return; }
    if (!form.email.trim()) { toast.error('Vui lòng nhập email.'); return; }
    if (!isEdit && form.password.length < 6) { toast.error('Mật khẩu tối thiểu 6 ký tự.'); return; }
    onSave({ ...form });
    onOpenChange(false);
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
          <DialogDescription>{isEdit ? `Cập nhật thông tin: ${initial?.email}` : 'Tạo tài khoản admin mới cho nhân viên.'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Họ và tên *">
              <Input className={inputCls} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Nguyễn Văn A" />
            </Field>
            <Field label="Email *">
              <Input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="nv@securelearn.com" disabled={isEdit} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số điện thoại">
              <Input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="090xxxxxxx" />
            </Field>
            <Field label="Phòng ban">
              <Input className={inputCls} value={form.department} onChange={e => set('department', e.target.value)} placeholder="Nội dung, Tài chính..." />
            </Field>
          </div>
          <Field label="Vai trò Admin *">
            <Select className={inputCls + ' cursor-pointer'} value={form.adminRole} onChange={e => set('adminRole', e.target.value)}>
              {(Object.keys(ADMIN_ROLE_CONFIG) as AdminRole[]).filter(r => r !== 'SUPER_ADMIN').map(r => (
                <option key={r} value={r}>{ADMIN_ROLE_CONFIG[r].label} — {ADMIN_ROLE_CONFIG[r].desc}</option>
              ))}
            </Select>
          </Field>
          {!isEdit && (
            <Field label="Mật khẩu *">
              <div className="relative">
                <Input className={inputCls + ' pr-10'} type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Tối thiểu 6 ký tự" />
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowPw(p => !p)} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-400 hover:text-zinc-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-4 py-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">Hủy</Button>
          <Button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/20">
            <Save className="w-4 h-4" />{saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo tài khoản'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Change Password Dialog ───
const ResetPasswordDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; staff: IAdminStaff | null }> = ({ open, onOpenChange, staff }) => {
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { if (open) { setPw(''); setShowPw(false); } }, [open]);

  const resetMut = useMutation({
    mutationFn: (password: string) => resetAdminStaffPassword(staff!._id, password),
    onSuccess: () => {
      toast.success(`Đã đặt lại mật khẩu cho ${staff?.email}`);
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || 'Lỗi đặt lại mật khẩu'),
    onSettled: () => setSaving(false)
  });

  const handleSave = async () => {
    if (pw.length < 6) { toast.error('Mật khẩu tối thiểu 6 ký tự!'); return; }
    setSaving(true);
    resetMut.mutate(pw);
  };

  if (!staff) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          <DialogDescription>Tài khoản: <strong>{staff.email}</strong></DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mật khẩu mới</label>
          <div className="relative">
            <Input type={showPw ? 'text' : 'password'} className="w-full px-3 py-2.5 pr-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" value={pw} onChange={e => setPw(e.target.value)} placeholder="Tối thiểu 6 ký tự" autoFocus />
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowPw(p => !p)} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-400">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-4 py-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">Hủy</Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/20">
            <Save className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Page ───
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminStaff, createAdminStaff, updateAdminStaff, deleteAdminStaff, resetAdminStaffPassword } from '@/services/adminApi';

export const StaffList: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin_staff'],
    queryFn: getAdminStaff,
  });

  const staff = (response?.data || []) as IAdminStaff[];
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminRole | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IAdminStaff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IAdminStaff | null>(null);
  const [pwTarget, setPwTarget] = useState<IAdminStaff | null>(null);

  const filtered = staff.filter(s => {
    const matchSearch = !search || s.fullName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || s.adminRole === roleFilter;
    return matchSearch && matchRole;
  });

  const createMut = useMutation({
    mutationFn: createAdminStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_staff'] });
      toast.success('Đã tạo tài khoản nhân viên thành công.');
    },
    onError: (err: any) => toast.error(err.message || 'Lỗi khi tạo nhân viên'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_staff'] });
      toast.success('Đã cập nhật thông tin nhân viên.');
    },
    onError: (err: any) => toast.error(err.message || 'Lỗi khi cập nhật nhân viên'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAdminStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_staff'] });
      toast.success('Đã xóa tài khoản nhân viên.');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.message || 'Lỗi khi xóa nhân viên'),
  });

  const handleSave = (data: Partial<IAdminStaff> & { password?: string }) => {
    if (editTarget) {
      updateMut.mutate({ id: editTarget._id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.adminRole === 'SUPER_ADMIN') {
      toast.error('Không thể xóa tài khoản Super Admin.');
      setDeleteTarget(null);
      return;
    }
    deleteMut.mutate(deleteTarget._id);
  };

  const timeAgo = (d?: string) => {
    if (!d) return 'Chưa đăng nhập';
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    return `${Math.floor(hrs / 24)} ngày trước`;
  };

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-500">Đang tải danh sách nhân viên...</div>;
  }

  return (
    <div className="w-full space-y-6">
      {/* Dialogs */}
      <StaffFormDialog open={formOpen} onOpenChange={o => { setFormOpen(o); if (!o) setEditTarget(null); }} initial={editTarget} onSave={handleSave} />
      <ResetPasswordDialog open={pwTarget !== null} onOpenChange={o => { if (!o) setPwTarget(null); }} staff={pwTarget} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={o => { if (!o) setDeleteTarget(null); }}
        title="Xóa tài khoản nhân viên?"
        description={`Tài khoản ${deleteTarget?.email} sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác.`}
        confirmText="Xóa tài khoản"
        isDestructive
        onConfirm={handleDelete}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Danh sách nhân viên</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Quản lý tài khoản Admin — thêm, sửa, xóa và phân vai trò nhân viên.</p>
        </div>
        <Button
          onClick={() => { setEditTarget(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm nhân viên
        </Button>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(ADMIN_ROLE_CONFIG) as AdminRole[]).map(r => (
          <div key={r} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{staff.filter(s => s.adminRole === r).length}</p>
            <p className="text-xs text-zinc-500 mt-1">{ADMIN_ROLE_CONFIG[r].label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <Input className="bg-transparent text-sm flex-1 border-0 shadow-none px-0 py-0 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus-visible:ring-0" placeholder="Tìm theo tên, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as AdminRole | '')}
        >
          <option value="">Tất cả vai trò</option>
          {(Object.keys(ADMIN_ROLE_CONFIG) as AdminRole[]).map(r => (
            <option key={r} value={r}>{ADMIN_ROLE_CONFIG[r].label}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Nhân viên', 'Vai trò Admin', 'Trạng thái', 'Phòng ban', 'Đăng nhập gần nhất', 'Hành động'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map(s => {
                const roleCfg = ADMIN_ROLE_CONFIG[s.adminRole];
                const statusCfg = STATUS_CONFIG[s.status];
                const isSuperAdmin = s.adminRole === 'SUPER_ADMIN';
                return (
                  <tr key={s._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                          {s.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{s.fullName}</p>
                            {isSuperAdmin && <ShieldCheck className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <p className="text-xs text-zinc-400 flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</p>
                          {s.phone && <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{s.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleCfg.color}`}>{roleCfg.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-zinc-500">{s.department || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-zinc-500">{timeAgo(s.lastLoginAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => { setEditTarget(s); setFormOpen(true); }}
                          title="Chỉnh sửa"
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Reset password */}
                        <button
                          onClick={() => setPwTarget(s)}
                          title="Đặt lại mật khẩu"
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500 transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {/* Delete — không xóa Super Admin */}
                        {!isSuperAdmin && (
                          <button
                            onClick={() => setDeleteTarget(s)}
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
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <UserCog className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Không tìm thấy nhân viên phù hợp.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-500">
          Hiển thị {filtered.length} / {staff.length} nhân viên
        </div>
      </div>
    </div>
  );
};
