import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { BadgeCheck, Briefcase, FileText, Loader2, Mail, Phone, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import type { ProfileFormData, ProfileUser } from './profile.types';
import { profileInputClassName } from './profile.utils';

interface Props { user: ProfileUser; register: UseFormRegister<ProfileFormData>; handleSubmit: UseFormHandleSubmit<ProfileFormData>; errors: FieldErrors<ProfileFormData>; isUpdating: boolean; isDirty?: boolean; onSubmit: (data: ProfileFormData) => Promise<void>; }
export function ProfileEditPanel({ user, register, handleSubmit, errors, isUpdating, isDirty = false, onSubmit }: Props) {
  return <AnimatedTabContent activeKey="edit-profile"><div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
    <h2 className="text-2xl font-bold mb-6">Chỉnh sửa hồ sơ</h2>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className='space-y-2'>
        <label className='text-sm font-medium flex items-center gap-2'>
          <Mail size={16}/> Email đăng nhập
          {user.emailVerifiedAt && <span className='text-emerald-600 flex items-center gap-1 text-xs'><BadgeCheck size={14}/>Đã xác minh</span>}
        </label>
        <Input type='email' value={user.email} readOnly disabled className={profileInputClassName}/>
        <p className='text-xs text-muted-foreground'>Email được cố định để bảo vệ tài khoản và không thể thay đổi trong hồ sơ.</p>
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-medium flex gap-2'><Phone size={16}/>Số điện thoại</label>
        <Input placeholder='VD: 0912345678 hoặc +84912345678' {...register('phone', { validate: (value) => { const compact = value.replace(/[\s().-]/g, ''); return !compact || /^(?:0\d{9}|(?:\+?84)\d{9})$/.test(compact) || 'Số điện thoại Việt Nam không hợp lệ'; } })} className={profileInputClassName}/>
        {errors.phone && <p className='text-sm text-destructive'>{errors.phone.message}</p>}
      </div>
      <div className="space-y-2"><label className="text-sm font-medium flex gap-2"><User size={16}/>Họ và tên</label><Input {...register('fullName', { required: 'Vui lòng nhập họ và tên', validate: { noOnlySpaces: (v) => v.trim().length > 0 || 'Vui lòng nhập họ và tên', minLen: (v) => v.trim().length >= 2 || 'Họ và tên phải có tối thiểu 2 ký tự', validChars: (v) => !/\d/.test(v) || 'Họ và tên không được chứa số' } })} className={profileInputClassName}/>{errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}</div>
      <div className="space-y-2"><label className="text-sm font-medium flex gap-2"><Briefcase size={16}/>Chức danh / Định danh</label><Input placeholder="VD: Chuyên gia bảo mật" {...register('headline')} className={profileInputClassName}/></div>
      <div className="space-y-2"><label className="text-sm font-medium flex gap-2"><FileText size={16}/>Tiểu sử</label><textarea placeholder="Giới thiệu kinh nghiệm và chuyên môn..." {...register('bio')} className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/></div>
      <Button type="submit" disabled={isUpdating || !isDirty} className="h-11 px-8">{isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Lưu hồ sơ công khai</Button>
    </form>
  </div></AnimatedTabContent>;
}
