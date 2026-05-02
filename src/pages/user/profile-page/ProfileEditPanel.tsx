// User Profile Edit Panel: Form chỉnh sửa thông tin hồ sơ người dùng.
import React from 'react';
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { Briefcase, FileText, Loader2, Mail, Phone, Save, User } from 'lucide-react';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import type { ProfileFormData, ProfileUser } from './profile.types';
import { profileInputClassName, profileInputDisabledClassName } from './profile.utils';

interface ProfileEditPanelProps {
  user: ProfileUser;
  register: UseFormRegister<ProfileFormData>;
  handleSubmit: UseFormHandleSubmit<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  isUpdating: boolean;
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

export const ProfileEditPanel: React.FC<ProfileEditPanelProps> = ({
  user,
  register,
  handleSubmit,
  errors,
  isUpdating,
  onSubmit,
}) => (
  <AnimatedTabContent activeKey="edit-profile">
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-foreground mb-6">Chỉnh sửa hồ sơ</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none flex items-center gap-2">
            <Mail size={16} className="text-muted-foreground" /> Email
          </label>
          <input id="email" value={user.email} disabled className={profileInputDisabledClassName} />
          <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium leading-none flex items-center gap-2">
            <User size={16} className="text-muted-foreground" /> Họ và tên
          </label>
          <input
            id="fullName"
            {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
            className={profileInputClassName}
          />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium leading-none flex items-center gap-2">
            <Phone size={16} className="text-muted-foreground" /> Số điện thoại
          </label>
          <input
            id="phone"
            placeholder="VD: 0912345678"
            {...register('phone', {
              pattern: {
                value: /^(0|\+84)[0-9]{9,10}$/,
                message: 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)',
              },
            })}
            className={profileInputClassName}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="headline" className="text-sm font-medium leading-none flex items-center gap-2">
            <Briefcase size={16} className="text-muted-foreground" /> Chức danh / Định danh
          </label>
          <input
            id="headline"
            placeholder="VD: Software Engineer, Designer..."
            {...register('headline')}
            className={profileInputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium leading-none flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" /> Tiểu sử
          </label>
          <p className="text-xs text-muted-foreground">Sẽ hiển thị trên hồ sơ công khai của bạn.</p>
          <textarea
            id="bio"
            placeholder="Viết vài dòng giới thiệu về bản thân bạn..."
            {...register('bio')}
            className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
        >
          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Lưu Thay Đổi
        </button>
      </form>
    </div>
  </AnimatedTabContent>
);
