// User Profile Page: Điều phối state, form và các panel con cho trang hồ sơ người dùng.
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { FadeIn } from '@/components/animations/FadeIn';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useChangePassword, useDeleteAccount, useUpdateProfile, authKeys } from '@/hooks/useAuth';
import { ProfileAvatarPanel } from './ProfileAvatarPanel';
import { ProfileEditPanel } from './ProfileEditPanel';
import { ProfilePublicPanel } from './ProfilePublicPanel';
import { ProfileSecurityPanel } from './ProfileSecurityPanel';
import { ProfileTabNav } from './ProfileTabNav';
import type { PasswordFormData, ProfileFormData, ProfileTabType } from './profile.types';

export function Profile() {
  const { user } = useAppSelector((state) => state.auth);
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutateAsync: deleteAccount, isPending: isDeleting } = useDeleteAccount();
  const { mutateAsync: changePassword, isPending: isChangingPassword } = useChangePassword();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ProfileTabType>('public');
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
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <FadeIn direction="down" distance={20} duration={0.35} className="bg-card rounded-2xl shadow-sm border border-border p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <UserAvatar user={user} className="w-24 h-24 text-4xl border-2 border-primary/20 shadow-md" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.fullName}</h1>
            <p className="text-muted-foreground mt-1 text-lg flex items-center justify-center md:justify-start gap-2">
              <Briefcase size={18} />
              {user.profile?.headline || 'Thành viên SecureLearn'}
            </p>
          </div>
        </div>
      </FadeIn>

      <div className="flex flex-col md:flex-row gap-8">
        <ProfileTabNav activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 min-w-0">
          {activeTab === 'public' && <ProfilePublicPanel user={user} />}
          {activeTab === 'edit-profile' && (
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
        </div>
      </div>
    </div>
  );
}
