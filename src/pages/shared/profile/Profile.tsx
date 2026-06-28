// User Profile Page: Điều phối state, form và các panel con cho trang hồ sơ người dùng.
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useChangePassword, useDeleteAccount, useUpdateProfile, authKeys } from '@/hooks/useAuth';
import { ProfileAvatarPanel } from './ProfileAvatarPanel';
import { ProfileEditPanel } from './ProfileEditPanel';
import { ProfileSessionsPanel } from './ProfileSessionsPanel';
import { ProfileSecurityPanel } from './ProfileSecurityPanel';
import { ProfileTabNav } from './ProfileTabNav';
import type { PasswordFormData, ProfileFormData, ProfileTabType } from './profile.types';

export function Profile() {
  const { user } = useAppSelector((state) => state.auth);
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutateAsync: deleteAccount, isPending: isDeleting } = useDeleteAccount();
  const { mutateAsync: changePassword, isPending: isChangingPassword } = useChangePassword();
  const queryClient = useQueryClient();
  const { tab } = useParams<{ tab: string }>();
  const validTabs: ProfileTabType[] = ['profile', 'avatar', 'security', 'sessions'];
  const activeTab = (tab && validTabs.includes(tab as ProfileTabType)) ? (tab as ProfileTabType) : 'profile';
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayedAvatarPreview = avatarPreview ?? user?.profile?.avatarUrl ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      bio: user?.profile?.bio || '',
      headline: user?.profile?.headline || '',
      website: user?.profile?.website || '',
      github: user?.profile?.github || '',
      facebook: user?.profile?.facebook || '',
      youtube: user?.profile?.youtube || '',
      linkedin: user?.profile?.linkedin || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>();

  useEffect(() => {
    if (!user) return;

    reset({
      fullName: user.fullName || '',
      phone: user.phone || '',
      bio: user.profile?.bio || '',
      headline: user.profile?.headline || '',
      website: user.profile?.website || '',
      github: user.profile?.github || '',
      facebook: user.profile?.facebook || '',
      youtube: user.profile?.youtube || '',
      linkedin: user.profile?.linkedin || '',
    });
  }, [reset, user]);

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
      await updateProfile(formData);
      toast.success('Ảnh đại diện đã được cập nhật!');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Cập nhật ảnh thất bại.');
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      const formData = new FormData();
      if (data.fullName) formData.append('fullName', data.fullName);
      if (data.phone !== undefined) formData.append('phone', data.phone);
      if (data.bio !== undefined) formData.append('bio', data.bio);
      if (data.headline !== undefined) formData.append('headline', data.headline);
      if (data.website !== undefined) formData.append('website', data.website);
      if (data.github !== undefined) formData.append('github', data.github);
      if (data.facebook !== undefined) formData.append('facebook', data.facebook);
      if (data.youtube !== undefined) formData.append('youtube', data.youtube);
      if (data.linkedin !== undefined) formData.append('linkedin', data.linkedin);

      await updateProfile(formData);
      toast.success('Hồ sơ của bạn đã được cập nhật thành công!');
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    }
  };

  const hasPassword = user?.hasPassword === true;
  const isPasswordless = user?.hasPassword === false;
  const hasResolvedPasswordState = typeof user?.hasPassword === 'boolean';

  const onSubmitPassword = async (data: PasswordFormData) => {
    if (!user) return;
    if (!hasResolvedPasswordState) {
      toast.error('Đang đồng bộ trạng thái bảo mật. Vui lòng thử lại sau ít giây.');
      return;
    }
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      await changePassword({
        oldPassword: hasPassword ? data.oldPassword : undefined,
        newPassword: data.newPassword,
      });
      toast.success(
        isPasswordless
          ? 'Tạo mật khẩu thành công! Bạn có thể đăng nhập bằng email/mật khẩu.'
          : 'Mật khẩu đã được thay đổi thành công!'
      );
      resetPasswordForm();
      queryClient.invalidateQueries({ queryKey: authKeys.profile });
      queryClient.invalidateQueries({ queryKey: authKeys.session });
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast.success('Tài khoản đã được xóa.');
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Có lỗi xảy ra khi xóa tài khoản');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Tiêu đề trang phẳng, hiện đại */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Quản lý thông tin hồ sơ cá nhân, thiết lập ảnh đại diện, bảo mật và quản lý các phiên đăng nhập.
        </p>
        <hr className="border-border/60 mt-6" />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar chứa thông tin User & Menu */}
        <aside className="w-full shrink-0 md:w-64 space-y-6">
          <div className="flex items-center gap-3.5 px-2 pb-5 border-b border-border/50">
            <UserAvatar user={user} className="w-12 h-12 border border-border shadow-sm text-lg" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{user.fullName}</h3>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <ProfileTabNav />
        </aside>

        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <ProfileEditPanel
              user={user}
              register={register}
              handleSubmit={handleSubmit}
              errors={errors}
              isUpdating={isUpdating}
              isDirty={isDirty}
              onSubmit={onSubmitProfile}
            />
          )}
          {activeTab === 'avatar' && (
            <ProfileAvatarPanel
              user={user}
              avatarPreview={displayedAvatarPreview}
              avatarFile={avatarFile}
              isUpdating={isUpdating}
              fileInputRef={fileInputRef}
              onAvatarChange={handleAvatarChange}
              onSubmitAvatar={onSubmitAvatar}
            />
          )}
          {activeTab === 'security' && (
            <ProfileSecurityPanel
              hasPassword={hasPassword}
              isPasswordless={isPasswordless}
              hasResolvedPasswordState={hasResolvedPasswordState}
              isChangingPassword={isChangingPassword}
              isDeleting={isDeleting}
              registerPassword={registerPassword}
              handlePasswordSubmit={handlePasswordSubmit}
              passwordErrors={passwordErrors}
              onSubmitPassword={onSubmitPassword}
              onDeleteAccount={handleDeleteAccount}
            />
          )}
          {activeTab === 'sessions' && (
            <ProfileSessionsPanel />
          )}
        </div>
      </div>
    </div>
  );
}
