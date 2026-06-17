// Admin Profile Avatar Panel: Khu vực thay đổi ảnh đại diện cho tài khoản admin.
import React from 'react';
import { Camera, Loader2, Save } from 'lucide-react';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { IAdminUser } from '@/types/auth.types';

interface AdminProfileAvatarPanelProps {
  adminUser: IAdminUser;
  avatarPreview: string | null;
  avatarFile: File | null;
  isUpdating: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitAvatar: () => Promise<void>;
}

export const AdminProfileAvatarPanel: React.FC<AdminProfileAvatarPanelProps> = ({
  adminUser,
  avatarPreview,
  avatarFile,
  isUpdating,
  fileInputRef,
  onAvatarChange,
  onSubmitAvatar,
}) => (
  <AnimatedTabContent activeKey="avatar">
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Ảnh đại diện</h2>
      <div className="flex flex-col items-start gap-8">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl relative">
              <UserAvatar
                user={avatarPreview ? { ...adminUser, avatarUrl: avatarPreview } : adminUser}
                className="w-full h-full text-6xl"
              />
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
              onChange={onAvatarChange}
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
          onClick={() => void onSubmitAvatar()}
          disabled={isUpdating || !avatarFile}
          className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-11 px-8 shadow-lg shadow-primary/20"
        >
          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Cập Nhật Ảnh
        </Button>
      </div>
    </div>
  </AnimatedTabContent>
);
