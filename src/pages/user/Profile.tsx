import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Save, Trash2, User, Mail, FileText, Briefcase, Loader2, AlertCircle, Eye, Shield, Key, Phone, Calendar, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppSelector } from '@/app/hooks';
import { useUpdateProfile, useDeleteAccount, useChangePassword } from '@/hooks/useAuth';

type ProfileFormData = {
  fullName: string;
  phone: string;
  bio: string;
  headline: string;
};

type PasswordFormData = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type TabType = 'public' | 'edit-profile' | 'avatar' | 'security';

export function Profile() {
  const { user } = useAppSelector((state) => state.auth);
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutateAsync: deleteAccount, isPending: isDeleting } = useDeleteAccount();
  const { mutateAsync: changePassword, isPending: isChangingPassword } = useChangePassword();

  const [activeTab, setActiveTab] = useState<TabType>('public');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: '',
      phone: '',
      bio: '',
      headline: '',
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFormData>();

  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName || '');
      setValue('phone', user.phone || '');
      setValue('bio', user.profile?.bio || '');
      setValue('headline', user.profile?.headline || '');
      if (user.profile?.avatarUrl) {
        setAvatarPreview(user.profile.avatarUrl);
      }
    }
  }, [user, setValue]);

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
      await updateProfile(formData);
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
      if (data.bio !== undefined) formData.append('bio', data.bio);
      if (data.headline !== undefined) formData.append('headline', data.headline);

      await updateProfile(formData);
      toast.success('Hồ sơ của bạn đã được cập nhật thành công!');
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
      await changePassword({
         oldPassword: data.oldPassword,
         newPassword: data.newPassword,
      });
      toast.success('Mật khẩu đã được thay đổi thành công!');
      resetPasswordForm();
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này? Hành động này không thể hoàn tác.')) {
      try {
        await deleteAccount();
        toast.success('Tài khoản đã được xóa.');
      } catch (error: any) {
        toast.error(error.message || 'Có lỗi xảy ra khi xóa tài khoản');
      }
    }
  };

  /** Format ngày tháng theo locale Việt Nam */
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Không xác định';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!user) {
    return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Đang tải dữ liệu...</div>;
  }

  const tabs = [
    { id: 'public', label: 'Xem hồ sơ công khai', icon: Eye },
    { id: 'edit-profile', label: 'Chỉnh sửa hồ sơ', icon: User },
    { id: 'avatar', label: 'Ảnh đại diện', icon: Camera },
    { id: 'security', label: 'Bảo mật', icon: Shield },
  ] as const;

  const inputClassName = "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const inputDisabledClassName = `${inputClassName} bg-muted cursor-not-allowed opacity-70`;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Info Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm border border-border p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 shadow-md bg-muted flex items-center justify-center shrink-0">
            {user.profile?.avatarUrl ? (
              <img src={user.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.fullName}</h1>
            <p className="text-muted-foreground mt-1 text-lg flex items-center justify-center md:justify-start gap-2">
              <Briefcase size={18} />
              {user.profile?.headline || 'Thành viên SecureLearn'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            
            {/* TAB: PUBLIC PROFILE */}
            {activeTab === 'public' && (
              <motion.div
                key="public"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Hồ sơ công khai</h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {/* Tiểu sử */}
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText size={16} /> Giới thiệu
                      </h3>
                      <p className="text-foreground text-base leading-relaxed">
                        {user.profile?.bio || 'Người dùng này chưa cập nhật tiểu sử.'}
                      </p>
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-muted/50 rounded-xl">
                       <div>
                         <p className="text-sm font-medium text-muted-foreground mb-1">Email liên hệ</p>
                         <p className="text-foreground font-medium flex items-center gap-2"><Mail size={16}/> {user.email}</p>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-muted-foreground mb-1">Số điện thoại</p>
                         <p className="text-foreground font-medium flex items-center gap-2"><Phone size={16}/> {user.phone || 'Chưa cập nhật'}</p>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-muted-foreground mb-1">Chức danh</p>
                         <p className="text-foreground font-medium flex items-center gap-2"><Briefcase size={16}/> {user.profile?.headline || 'Chưa cập nhật'}</p>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-muted-foreground mb-1">Ngày tham gia</p>
                         <p className="text-foreground font-medium flex items-center gap-2"><Calendar size={16}/> {formatDate(user.createdAt)}</p>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-muted-foreground mb-1">Trạng thái xác minh</p>
                         <p className="text-foreground font-medium flex items-center gap-2">
                           {user.isVerified ? (
                             <><CheckCircle size={16} className="text-green-500" /> Đã xác minh</>
                           ) : (
                             <><Clock size={16} className="text-amber-500" /> Chưa xác minh</>
                           )}
                         </p>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-muted-foreground mb-1">Gói đăng ký</p>
                         <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                           user.subscriptionStatus === 'ACTIVE' 
                             ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                             : 'bg-muted text-muted-foreground border-border'
                         }`}>
                            {user.subscriptionStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: EDIT PROFILE */}
            {activeTab === 'edit-profile' && (
              <motion.div
                key="edit-profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Chỉnh sửa hồ sơ</h2>
                  <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6 max-w-2xl">
                    
                    {/* Email — readonly */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium leading-none flex items-center gap-2">
                        <Mail size={16} className="text-muted-foreground" /> Email
                      </label>
                      <input
                        id="email"
                        value={user.email}
                        disabled
                        className={inputDisabledClassName}
                      />
                      <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
                    </div>

                    {/* Họ và tên */}
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium leading-none flex items-center gap-2">
                        <User size={16} className="text-muted-foreground" /> Họ và tên
                      </label>
                      <input
                        id="fullName"
                        {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
                        className={inputClassName}
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                    </div>

                    {/* Số điện thoại */}
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
                        className={inputClassName}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                    </div>

                    {/* Chức danh */}
                    <div className="space-y-2">
                      <label htmlFor="headline" className="text-sm font-medium leading-none flex items-center gap-2">
                        <Briefcase size={16} className="text-muted-foreground" /> Chức danh / Định danh
                      </label>
                      <input
                        id="headline"
                        placeholder="VD: Software Engineer, Designer..."
                        {...register('headline')}
                        className={inputClassName}
                      />
                    </div>

                    {/* Tiểu sử */}
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
              </motion.div>
            )}

            {/* TAB: AVATAR */}
            {activeTab === 'avatar' && (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Ảnh đại diện</h2>
                  <div className="flex flex-col items-start gap-8">
                    <div className="flex items-center gap-8">
                       <div className="relative group">
                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-background shadow-xl relative bg-muted flex items-center justify-center">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={64} className="text-muted-foreground" />
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
                      <div className="text-sm text-muted-foreground">
                         <p>Định dạng hỗ trợ: JPG, PNG, WEBP.</p>
                         <p>Khuyến nghị kích thước: 500x500px.</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={onSubmitAvatar}
                      disabled={isUpdating || !avatarFile}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-11 px-8"
                    >
                      {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Cập Nhật Ảnh
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Đổi mật khẩu */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <Key className="text-primary" size={24} />
                    Mật khẩu & Đăng nhập
                  </h2>
                  <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Mật khẩu hiện tại</label>
                       <input 
                         type="password"
                         {...registerPassword('oldPassword', { required: 'Vui lòng nhập mật khẩu cũ' })}
                         className={inputClassName}
                       />
                       {passwordErrors.oldPassword && <p className="text-sm text-destructive">{passwordErrors.oldPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Mật khẩu mới</label>
                       <input 
                         type="password"
                         {...registerPassword('newPassword', { 
                            required: 'Vui lòng nhập mật khẩu mới',
                            minLength: { value: 6, message: 'Mật khẩu phải tối thiểu 6 ký tự' }
                         })}
                         className={inputClassName}
                       />
                       {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
                       <input 
                         type="password"
                         {...registerPassword('confirmPassword', { required: 'Vui lòng xác nhận mật khẩu mới' })}
                         className={inputClassName}
                       />
                       {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                    >
                      {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Đổi Mật Khẩu
                    </button>
                  </form>
                </div>

                {/* Xóa tài khoản */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-destructive mb-4">
                    <AlertCircle size={24} />
                    Xóa tài khoản
                  </h2>
                  <p className="text-sm text-destructive/80 mb-6 max-w-xl leading-relaxed">
                    Khi bạn xóa tài khoản, mọi tiến trình học tập, thông tin thanh toán, và toàn bộ dữ liệu trên hệ thống sẽ bị xóa vĩnh viễn. Hành động này không thể được hoàn tác dưới bất kỳ hình thức nào.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none border border-destructive bg-background hover:bg-destructive hover:text-destructive-foreground h-11 px-8 text-destructive"
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Tiến hành Xóa Tài Khoản
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
