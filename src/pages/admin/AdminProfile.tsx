import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Save, User, Mail, FileText, Loader2, Phone, Building, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector } from '@/app/hooks';
import { useUpdateAdminProfile, useChangeAdminPassword } from '@/hooks/useAdminAuth';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type ProfileFormData = {
  fullName: string;
  phone: string;
  bio: string;
  department: string;
};

type PasswordFormData = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type TabType = 'edit-profile' | 'avatar' | 'security';

export function AdminProfile() {
  const { user: adminUser } = useAppSelector((state) => state.adminAuth);
  
  const [activeTab, setActiveTab] = useState<TabType>('edit-profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: updateAdminProfile, isPending: isUpdating } = useUpdateAdminProfile();
  const { mutateAsync: changeAdminPassword, isPending: isChangingPassword } = useChangeAdminPassword();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: '',
      phone: '',
      bio: '',
      department: '',
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFormData>();

  useEffect(() => {
    setValue('fullName', adminUser?.fullName || 'Administrator');
    setValue('phone', adminUser?.phone || '');
    setValue('bio', adminUser?.bio || '');
    setValue('department', adminUser?.department || '');
    if (adminUser?.avatarUrl) {
      setAvatarPreview(adminUser.avatarUrl);
    }
  }, [adminUser, setValue]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  const onSubmitProfile = async (data: ProfileFormData) => {
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

  const onSubmitPassword = async (data: PasswordFormData) => {
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
    return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Đang tải dữ liệu...</div>;
  }

  const tabs = [
    { id: 'edit-profile', label: 'Thông tin cá nhân', icon: User },
    { id: 'avatar', label: 'Ảnh đại diện', icon: Camera },
    { id: 'security', label: 'Bảo mật', icon: Shield },
  ] as const;

  const inputClassName = "flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all";
  const inputDisabledClassName = `${inputClassName} bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed opacity-70`;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Cài đặt tài khoản</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Quản lý thông tin cá nhân và bảo mật tài khoản admin.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'edit-profile' && (
            <AnimatedTabContent activeKey="edit-profile">
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Thông tin cá nhân</h2>
                  <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6 max-w-2xl">
                    
                    {/* Email — readonly */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium leading-none flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Mail size={16} className="text-zinc-400" /> Email
                      </label>
                      <Input
                        id="email"
                        value={adminUser.email}
                        disabled
                        className={inputDisabledClassName}
                      />
                      <p className="text-xs text-zinc-500">Email hệ thống không thể thay đổi.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Họ và tên */}
                      <div className="space-y-2">
                        <label htmlFor="fullName" className="text-sm font-medium leading-none flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <User size={16} className="text-zinc-400" /> Họ và tên
                        </label>
                        <Input
                          id="fullName"
                          {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
                          className={inputClassName}
                        />
                        {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
                      </div>

                      {/* Số điện thoại */}
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium leading-none flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <Phone size={16} className="text-zinc-400" /> Số điện thoại
                        </label>
                        <Input
                          id="phone"
                          placeholder="VD: 0912345678"
                          {...register('phone')}
                          className={inputClassName}
                        />
                      </div>
                    </div>

                    {/* Phòng ban */}
                    <div className="space-y-2">
                      <label htmlFor="department" className="text-sm font-medium leading-none flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Building size={16} className="text-zinc-400" /> Phòng ban / Vị trí
                      </label>
                      <Input
                        id="department"
                        placeholder="VD: Ban Giám đốc, Quản lý nội dung..."
                        {...register('department')}
                        className={inputClassName}
                      />
                    </div>

                    {/* Tiểu sử */}
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
          )}

          {activeTab === 'avatar' && (
            <AnimatedTabContent activeKey="avatar">
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Ảnh đại diện</h2>
                  <div className="flex flex-col items-start gap-8">
                    <div className="flex items-center gap-8">
                       <div className="relative group">
                        <div className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center relative">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-6xl font-bold text-primary">{adminUser.fullName?.charAt(0) || 'A'}</span>
                          )}
                          <div 
                            className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Camera className="text-white w-8 h-8 mb-2" />
                            <span className="text-white text-xs font-medium">Đổi ảnh</span>
                          </div>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleAvatarChange} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                      <div className="text-sm text-zinc-500">
                         <p>Định dạng hỗ trợ: JPG, PNG, WEBP.</p>
                         <p>Khuyến nghị kích thước: 500x500px.</p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={onSubmitAvatar}
                      disabled={isUpdating || !avatarFile}
                      className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-11 px-8 shadow-lg shadow-primary/20"
                    >
                      {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Cập Nhật Ảnh
                    </Button>
                  </div>
                </div>
            </AnimatedTabContent>
          )}

          {activeTab === 'security' && (
            <AnimatedTabContent activeKey="security" className="space-y-6">
                {/* Đổi mật khẩu */}
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-zinc-900 dark:text-white">
                    Đổi mật khẩu
                  </h2>

                  <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mật khẩu hiện tại</label>
                      <Input 
                        type="password"
                        {...registerPassword('oldPassword', { required: 'Vui lòng nhập mật khẩu cũ' })}
                        className={inputClassName}
                      />
                      {passwordErrors.oldPassword && <p className="text-sm text-red-500">{passwordErrors.oldPassword.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mật khẩu mới</label>
                       <Input 
                         type="password"
                         {...registerPassword('newPassword', { 
                            required: 'Vui lòng nhập mật khẩu mới',
                            minLength: { value: 6, message: 'Mật khẩu phải tối thiểu 6 ký tự' }
                         })}
                         className={inputClassName}
                       />
                       {passwordErrors.newPassword && <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Xác nhận mật khẩu mới</label>
                       <Input 
                         type="password"
                         {...registerPassword('confirmPassword', { required: 'Vui lòng xác nhận mật khẩu mới' })}
                         className={inputClassName}
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
          )}
        </div>
      </div>
    </div>
  );
}
