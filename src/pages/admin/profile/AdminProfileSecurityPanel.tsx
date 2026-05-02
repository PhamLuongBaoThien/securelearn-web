// Admin Profile Security Panel: Form đổi mật khẩu cho tài khoản quản trị.
import React from 'react';
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminPasswordFormData } from './adminProfile.types';
import { adminProfileInputClassName } from './adminProfile.utils';

interface AdminProfileSecurityPanelProps {
  registerPassword: UseFormRegister<AdminPasswordFormData>;
  handlePasswordSubmit: UseFormHandleSubmit<AdminPasswordFormData>;
  passwordErrors: FieldErrors<AdminPasswordFormData>;
  isChangingPassword: boolean;
  onSubmitPassword: (data: AdminPasswordFormData) => Promise<void>;
}

export const AdminProfileSecurityPanel: React.FC<AdminProfileSecurityPanelProps> = ({
  registerPassword,
  handlePasswordSubmit,
  passwordErrors,
  isChangingPassword,
  onSubmitPassword,
}) => (
  <AnimatedTabContent activeKey="security" className="space-y-6">
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-zinc-900 dark:text-white">Đổi mật khẩu</h2>

      <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-6 max-w-md">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mật khẩu hiện tại</label>
          <Input
            type="password"
            {...registerPassword('oldPassword', { required: 'Vui lòng nhập mật khẩu cũ' })}
            className={adminProfileInputClassName}
          />
          {passwordErrors.oldPassword && <p className="text-sm text-red-500">{passwordErrors.oldPassword.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mật khẩu mới</label>
          <Input
            type="password"
            {...registerPassword('newPassword', {
              required: 'Vui lòng nhập mật khẩu mới',
              minLength: { value: 6, message: 'Mật khẩu phải tối thiểu 6 ký tự' },
            })}
            className={adminProfileInputClassName}
          />
          {passwordErrors.newPassword && <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Xác nhận mật khẩu mới</label>
          <Input
            type="password"
            {...registerPassword('confirmPassword', { required: 'Vui lòng xác nhận mật khẩu mới' })}
            className={adminProfileInputClassName}
          />
          {passwordErrors.confirmPassword && <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isChangingPassword}
            className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none bg-amber-500 text-white hover:bg-amber-600 h-11 px-8 shadow-lg shadow-amber-500/20"
          >
            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cập Nhật Mật Khẩu
          </Button>
        </div>
      </form>
    </div>
  </AnimatedTabContent>
);
