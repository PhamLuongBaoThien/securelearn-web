import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { BadgeCheck, Briefcase, FileText, Loader2, Mail, Phone, Save, User, Globe, Github, Facebook, Youtube, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import type { ProfileFormData, ProfileUser } from './profile.types';
import { profileInputClassName } from './profile.utils';

interface Props { 
  user: ProfileUser; 
  register: UseFormRegister<ProfileFormData>; 
  handleSubmit: UseFormHandleSubmit<ProfileFormData>; 
  errors: FieldErrors<ProfileFormData>; 
  isUpdating: boolean; 
  isDirty?: boolean; 
  onSubmit: (data: ProfileFormData) => Promise<void>; 
}

export function ProfileEditPanel({ user, register, handleSubmit, errors, isUpdating, isDirty = false, onSubmit }: Props) {
  return (
    <AnimatedTabContent activeKey="profile">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold mb-6">Thông tin tài khoản</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Grid Layout 2 Cột */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Cột Trái: Thông tin cá nhân cơ bản */}
            <div className="space-y-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/80 pb-2.5">
                <User size={18} className="text-primary" />
                Thông tin cá nhân
              </h3>
              
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail size={16} className="text-muted-foreground" /> 
                  Email đăng nhập
                  {user.emailVerifiedAt && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-semibold">
                      <BadgeCheck size={14} /> Đã xác minh
                    </span>
                  )}
                </label>
                <Input type="email" value={user.email} readOnly disabled className={profileInputClassName} />
                <p className="text-xs text-muted-foreground">Email được cố định để bảo vệ tài khoản và không thể thay đổi.</p>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone size={16} className="text-muted-foreground" />
                  Số điện thoại
                </label>
                <Input 
                  placeholder="VD: 0912345678 hoặc +84912345678" 
                  {...register('phone', { 
                    validate: (value) => { 
                      const compact = value?.replace(/[\s().-]/g, '') || ''; 
                      return !compact || /^(?:0\d{9}|(?:\+?84)\d{9})$/.test(compact) || 'Số điện thoại Việt Nam không hợp lệ'; 
                    } 
                  })} 
                  className={profileInputClassName} 
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>

              {/* Họ và tên */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} className="text-muted-foreground" />
                  Họ và tên
                </label>
                <Input 
                  {...register('fullName', { 
                    required: 'Vui lòng nhập họ và tên', 
                    validate: { 
                      noOnlySpaces: (v) => v.trim().length > 0 || 'Vui lòng nhập họ và tên', 
                      minLen: (v) => v.trim().length >= 2 || 'Họ và tên phải có tối thiểu 2 ký tự', 
                      validChars: (v) => !/\d/.test(v) || 'Họ và tên không được chứa số' 
                    } 
                  })} 
                  className={profileInputClassName} 
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>

              {/* Chức danh */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase size={16} className="text-muted-foreground" />
                  Chức danh / Định danh
                </label>
                <Input placeholder="VD: Chuyên gia bảo mật hoặc Học viên" {...register('headline')} className={profileInputClassName} />
              </div>

              {/* Tiểu sử */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  Tiểu sử bản thân
                </label>
                <textarea 
                  placeholder="Giới thiệu ngắn về kinh nghiệm học tập, giảng dạy hoặc chuyên môn của bạn..." 
                  {...register('bio')} 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Cột Phải: Liên kết mạng xã hội & Website */}
            <div className="space-y-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/80 pb-2.5">
                <Globe size={18} className="text-primary" />
                Liên kết liên quan
              </h3>
              
              {/* Website cá nhân */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe size={16} className="text-muted-foreground" />
                  Website cá nhân
                </label>
                <Input placeholder="https://yourwebsite.com" {...register('website')} className={profileInputClassName} />
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Github size={16} className="text-muted-foreground" />
                  GitHub Profile
                </label>
                <Input placeholder="https://github.com/username" {...register('github')} className={profileInputClassName} />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Linkedin size={16} className="text-muted-foreground" />
                  LinkedIn Profile
                </label>
                <Input placeholder="https://linkedin.com/in/username" {...register('linkedin')} className={profileInputClassName} />
              </div>

              {/* Facebook */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Facebook size={16} className="text-muted-foreground" />
                  Facebook Profile
                </label>
                <Input placeholder="https://facebook.com/username" {...register('facebook')} className={profileInputClassName} />
              </div>

              {/* YouTube */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Youtube size={16} className="text-muted-foreground" />
                  Kênh YouTube
                </label>
                <Input placeholder="https://youtube.com/@cchannel" {...register('youtube')} className={profileInputClassName} />
              </div>
            </div>

          </div>

          {/* Hàng nút Lưu dưới cùng */}
          <div className="border-t border-border/80 pt-6 flex justify-end">
            <Button type="submit" disabled={isUpdating || !isDirty} className="h-11 px-8 cursor-pointer">
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </AnimatedTabContent>
  );
}
