// User Profile Avatar Panel: Khu vực chọn ảnh và cập nhật avatar người dùng.
import React from 'react';
import { Camera, Loader2, Save } from 'lucide-react';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { ProfileUser } from './profile.types';

interface ProfileAvatarPanelProps {
  user: ProfileUser;
  avatarPreview: string | null;
  avatarFile: File | null;
  isUpdating: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitAvatar: () => Promise<void>;
}

export const ProfileAvatarPanel: React.FC<ProfileAvatarPanelProps> = ({
  user,
  avatarPreview,
  avatarFile,
  isUpdating,
  fileInputRef,
  onAvatarChange,
  onSubmitAvatar,
}) => (
  <AnimatedTabContent activeKey="avatar">
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-foreground mb-6">Ảnh đại diện</h2>
      <div className="flex flex-col items-start gap-8">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-background shadow-xl relative bg-muted flex items-center justify-center">
              <UserAvatar
                user={avatarPreview ? { ...user, profile: { ...user.profile, avatarUrl: avatarPreview } } : user}
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
          <div className="text-sm text-muted-foreground">
            <p>Định dạng hỗ trợ: JPG, PNG, WEBP.</p>
            <p>Khuyến nghị kích thước: 500x500px.</p>
          </div>
        </div>

        <button
          onClick={() => void onSubmitAvatar()}
          disabled={isUpdating || !avatarFile}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-11 px-8"
        >
          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Cập Nhật Ảnh
        </button>
      </div>
    </div>
  </AnimatedTabContent>
);
