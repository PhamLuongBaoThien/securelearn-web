// Admin Profile Form Panel: Form cập nhật thông tin cá nhân cho admin.
import React from 'react';
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { Building, FileText, Loader2, Mail, Phone, Save, User } from 'lucide-react';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { IAdminUser } from '@/types/auth.types';
import type { AdminProfileFormData } from './adminProfile.types';
import { adminProfileInputClassName, adminProfileInputDisabledClassName } from './adminProfile.utils';

interface AdminProfileFormPanelProps {
  adminUser: IAdminUser;
  register: UseFormRegister<AdminProfileFormData>;
  handleSubmit: UseFormHandleSubmit<AdminProfileFormData>;
  errors: FieldErrors<AdminProfileFormData>;
  isUpdating: boolean;
  onSubmit: (data: AdminProfileFormData) => Promise<void>;
}

export const AdminProfileFormPanel: React.FC<AdminProfileFormPanelProps> = ({
  adminUser,
  register,
  handleSubmit,
  errors,
  isUpdating,
  onSubmit,
}) => (
  <AnimatedTabContent activeKey="edit-profile">
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Thông tin cá nhân</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Mail size={16} className="text-zinc-400" /> Email
          </label>
          <Input id="email" value={adminUser.email} disabled className={adminProfileInputDisabledClassName} />
          <p className="text-xs text-zinc-500">Email hệ thống không thể thay đổi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium leading-none flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <User size={16} className="text-zinc-400" /> Họ và tên
            </label>
            <Input
              id="fullName"
              {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
              className={adminProfileInputClassName}
            />
            {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium leading-none flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Phone size={16} className="text-zinc-400" /> Số điện thoại
            </label>
            <Input id="phone" placeholder="VD: 0912345678" {...register('phone')} className={adminProfileInputClassName} />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="department" className="text-sm font-medium leading-none flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Building size={16} className="text-zinc-400" /> Phòng ban / Vị trí
          </label>
          <Input
            id="department"
            placeholder="VD: Ban Giám đốc, Quản lý nội dung..."
            {...register('department')}
            className={adminProfileInputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium leading-none flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <FileText size={16} className="text-zinc-400" /> Ghi chú / Tiểu sử
          </label>
          <textarea
            id="bio"
            placeholder="Thông tin thêm về vai trò quản trị..."
            {...register('bio')}
            className="flex min-h-[120px] w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all resize-y"
          />
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <Button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 shadow-lg shadow-primary/20"
          >
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu Thông Tin
          </Button>
        </div>
      </form>
    </div>
  </AnimatedTabContent>
);
