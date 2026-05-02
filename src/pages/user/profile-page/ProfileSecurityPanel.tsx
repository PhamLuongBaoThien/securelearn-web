// User Profile Security Panel: Đổi mật khẩu và xóa tài khoản cho người dùng.
import React from 'react';
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { AlertCircle, Key, Loader2, Trash2 } from 'lucide-react';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import type { PasswordFormData } from './profile.types';
import { profileInputClassName } from './profile.utils';

interface ProfileSecurityPanelProps {
  hasPassword: boolean;
  isPasswordless: boolean;
  hasResolvedPasswordState: boolean;
  isChangingPassword: boolean;
  isDeleting: boolean;
  registerPassword: UseFormRegister<PasswordFormData>;
  handlePasswordSubmit: UseFormHandleSubmit<PasswordFormData>;
  passwordErrors: FieldErrors<PasswordFormData>;
  onSubmitPassword: (data: PasswordFormData) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export const ProfileSecurityPanel: React.FC<ProfileSecurityPanelProps> = ({
  hasPassword,
  isPasswordless,
  hasResolvedPasswordState,
  isChangingPassword,
  isDeleting,
  registerPassword,
  handlePasswordSubmit,
  passwordErrors,
  onSubmitPassword,
  onDeleteAccount,
}) => (
  <AnimatedTabContent activeKey="security" className="space-y-6">
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Key className="text-primary" size={24} />
        {!hasResolvedPasswordState ? 'Bảo mật tài khoản' : hasPassword ? 'Mật khẩu & Đăng nhập' : 'Tạo mật khẩu'}
      </h2>

      {!hasResolvedPasswordState && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-muted/60 border border-border">
          <Loader2 className="h-5 w-5 animate-spin mt-0.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Đang đồng bộ trạng thái mật khẩu</p>
            <p className="text-sm text-muted-foreground mt-1">
              Hệ thống đang tải thông tin bảo mật mới nhất từ phiên đăng nhập của bạn.
            </p>
          </div>
        </div>
      )}

      {isPasswordless && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <svg
            className="h-5 w-5 text-blue-500 mt-0.5 shrink-0"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Tài khoản đăng nhập qua Google</p>
            <p className="text-sm text-muted-foreground mt-1">
              Bạn đang đăng nhập bằng Google. Tạo mật khẩu để có thể đăng nhập bằng cả email và mật khẩu.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-6 max-w-md">
        {hasPassword && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Mật khẩu hiện tại</label>
            <input
              type="password"
              {...registerPassword('oldPassword', { required: 'Vui lòng nhập mật khẩu cũ' })}
              className={profileInputClassName}
            />
            {passwordErrors.oldPassword && <p className="text-sm text-destructive">{passwordErrors.oldPassword.message}</p>}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Mật khẩu mới</label>
          <input
            type="password"
            {...registerPassword('newPassword', {
              required: 'Vui lòng nhập mật khẩu mới',
              minLength: { value: 6, message: 'Mật khẩu phải tối thiểu 6 ký tự' },
            })}
            className={profileInputClassName}
          />
          {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            {...registerPassword('confirmPassword', { required: 'Vui lòng xác nhận mật khẩu mới' })}
            className={profileInputClassName}
          />
          {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isChangingPassword}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
        >
          {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!hasResolvedPasswordState ? 'Đang tải...' : hasPassword ? 'Đổi Mật Khẩu' : 'Tạo Mật Khẩu'}
        </button>
      </form>
    </div>

    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8">
      <h2 className="text-xl font-bold flex items-center gap-2 text-destructive mb-4">
        <AlertCircle size={24} />
        Xóa tài khoản
      </h2>
      <p className="text-sm text-destructive/80 mb-6 max-w-xl leading-relaxed">
        Khi bạn xóa tài khoản, mọi tiến trình học tập, thông tin thanh toán, và toàn bộ dữ liệu trên hệ thống sẽ bị xóa vĩnh viễn. Hành động này không thể được hoàn tác dưới bất kỳ hình thức nào.
      </p>
      <ConfirmDialog
        title="Bạn có chắc chắn muốn xóa tài khoản?"
        description="Hành động này không thể hoàn tác. Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        isDestructive
        onConfirm={() => void onDeleteAccount()}
        triggerButton={
          <Button
            disabled={isDeleting}
            variant="outline"
            className="h-11 px-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Tiến hành Xóa Tài Khoản
          </Button>
        }
      />
    </div>
  </AnimatedTabContent>
);
