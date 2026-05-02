// Admin Profile Page: Điều phối state, form và các panel con cho trang hồ sơ quản trị.
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector } from '@/app/hooks';
import { useChangeAdminPassword, useUpdateAdminProfile } from '@/hooks/useAdminAuth';
import { AdminProfileAvatarPanel } from './AdminProfileAvatarPanel';
import { AdminProfileFormPanel } from './AdminProfileFormPanel';
import { AdminProfileSecurityPanel } from './AdminProfileSecurityPanel';
import { AdminProfileTabNav } from './AdminProfileTabNav';
import type { AdminPasswordFormData, AdminProfileFormData, AdminProfileTabType } from './adminProfile.types';

export function AdminProfile() {
  const { user: adminUser } = useAppSelector((state) => state.adminAuth);
  const [activeTab, setActiveTab] = useState<AdminProfileTabType>('edit-profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: updateAdminProfile, isPending: isUpdating } = useUpdateAdminProfile();
  const { mutateAsync: changeAdminPassword, isPending: isChangingPassword } = useChangeAdminPassword();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdminProfileFormData>({
    defaultValues: {
      fullName: '',
      phone: '',
      bio: '',
      department: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<AdminPasswordFormData>();

  useEffect(() => {
    setValue('fullName', adminUser?.fullName || 'Administrator');
    setValue('phone', adminUser?.phone || '');
    setValue('bio', adminUser?.bio || '');
    setValue('department', adminUser?.department || '');
    if (adminUser?.avatarUrl) {
      setAvatarPreview(adminUser.avatarUrl);
    }
  }, [adminUser, setValue]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    const file = event.target.files[0];
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmitAvatar = async () => {
    if (!avatarFile) {
      toast.error('Vui lòng chọn ảnh trước khi lưu!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      await updateAdminProfile(formData);
      toast.success('Ảnh đại diện đã được cập nhật!');
      setAvatarFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật ảnh thất bại.');
    }
  };

  const onSubmitProfile = async (data: AdminProfileFormData) => {
    try {
      const formData = new FormData();
      if (data.fullName) formData.append('fullName', data.fullName);
      if (data.phone !== undefined) formData.append('phone', data.phone);
      if (data.department !== undefined) formData.append('department', data.department);
      if (data.bio !== undefined) formData.append('bio', data.bio);

      await updateAdminProfile(formData);
      toast.success('Hồ sơ quản trị đã được cập nhật thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    }
  };

  const onSubmitPassword = async (data: AdminPasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      await changeAdminPassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      toast.success('Mật khẩu đã được thay đổi thành công!');
      resetPasswordForm();
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    }
  };

  if (!adminUser) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Cài đặt tài khoản</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Quản lý thông tin cá nhân và bảo mật tài khoản admin.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <AdminProfileTabNav activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 min-w-0">
          {activeTab === 'edit-profile' && (
            <AdminProfileFormPanel
              adminUser={adminUser}
              register={register}
              handleSubmit={handleSubmit}
              errors={errors}
              isUpdating={isUpdating}
              onSubmit={onSubmitProfile}
            />
          )}
          {activeTab === 'avatar' && (
            <AdminProfileAvatarPanel
              adminUser={adminUser}
              avatarPreview={avatarPreview}
              avatarFile={avatarFile}
              isUpdating={isUpdating}
              fileInputRef={fileInputRef}
              onAvatarChange={handleAvatarChange}
              onSubmitAvatar={onSubmitAvatar}
            />
          )}
          {activeTab === 'security' && (
            <AdminProfileSecurityPanel
              registerPassword={registerPassword}
              handlePasswordSubmit={handlePasswordSubmit}
              passwordErrors={passwordErrors}
              isChangingPassword={isChangingPassword}
              onSubmitPassword={onSubmitPassword}
            />
          )}
        </div>
      </div>
    </div>
  );
}
