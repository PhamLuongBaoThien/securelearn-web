// ========================
// StaffFormDialog: Dialog tạo/sửa staff, tách riêng khỏi StaffList để giữ luồng chính gọn hơn.
// ========================
import React, { useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { IAdminStaff, IRolePermission } from '@/types/admin.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { staffInputClassName } from './staff.utils';
import type { StaffFormValues } from './staff.utils';

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: IAdminStaff | null;
  onSave: (data: StaffFormValues) => void;
  availableRoles: IRolePermission[];
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
    {children}
  </div>
);

export const StaffFormDialog: React.FC<StaffFormDialogProps> = ({
  open,
  onOpenChange,
  initial,
  onSave,
  availableRoles,
}) => {
  const isEdit = !!initial;
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<StaffFormValues>({
    fullName: initial?.fullName || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    department: initial?.department || '',
    adminRole: initial?.adminRole || availableRoles[0]?.roleKey || 'SUPPORT_AGENT',
    password: '',
  });

  const setField = (key: keyof StaffFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const fullName = form.fullName.trim().normalize('NFC');
    const email = form.email.trim();
    const phone = (form.phone || '').trim();
    const password = form.password;

    if (!fullName) {
      toast.error('Vui lòng nhập họ và tên.');
      return;
    }
    if (fullName.length < 2) {
      toast.error('Họ và tên phải có tối thiểu 2 ký tự.');
      return;
    }
    if (/\d/.test(fullName)) {
      toast.error('Họ và tên không được chứa số.');
      return;
    }

    if (!email) {
      toast.error('Vui lòng nhập email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email không đúng định dạng.');
      return;
    }

    if (phone) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(phone)) {
        toast.error('Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng số 0).');
        return;
      }
    }

    if (!isEdit) {
      if (!password) {
        toast.error('Vui lòng nhập mật khẩu.');
        return;
      }
      if (password.length < 6) {
        toast.error('Mật khẩu phải có tối thiểu 6 ký tự.');
        return;
      }
    }

    onSave({
      ...form,
      fullName,
      email,
      phone,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Cập nhật thông tin: ${initial?.email}` : 'Tạo tài khoản admin mới cho nhân viên.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Họ và tên *">
              <Input
                className={staffInputClassName}
                value={form.fullName}
                onChange={(event) => setField('fullName', event.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </Field>
            <Field label="Email *">
              <Input
                className={staffInputClassName}
                type="email"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                placeholder="nv@securelearn.com"
                disabled={isEdit}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số điện thoại">
              <Input
                className={staffInputClassName}
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                placeholder="090xxxxxxx"
              />
            </Field>
            <Field label="Phòng ban">
              <Input
                className={staffInputClassName}
                value={form.department}
                onChange={(event) => setField('department', event.target.value)}
                placeholder="Nội dung, Tài chính..."
              />
            </Field>
          </div>
          <Field label="Vai trò Admin *">
            <Select
              className={`${staffInputClassName} cursor-pointer`}
              value={form.adminRole}
              onChange={(event) => setField('adminRole', event.target.value)}
            >
              {availableRoles.map((role) => (
                <option key={role.roleKey} value={role.roleKey}>
                  {role.label} {role.permissions.length > 0 ? `— ${role.permissions.length} quyền` : '— Chưa có quyền'}
                </option>
              ))}
            </Select>
          </Field>
          {!isEdit && (
            <Field label="Mật khẩu *">
              <div className="relative">
                <Input
                  className={`${staffInputClassName} pr-10`}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setField('password', event.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {isEdit ? 'Cập nhật' : 'Tạo tài khoản'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
