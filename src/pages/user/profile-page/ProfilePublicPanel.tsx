// User Profile Public Panel: Hiển thị thông tin hồ sơ công khai của người dùng.
import React from 'react';
import { AnimatedTabContent } from '@/components/animations/TabTransition';
import type { ProfileUser } from './profile.types';
import { formatProfileDate, publicInfoIcons } from './profile.utils';

interface ProfilePublicPanelProps {
  user: ProfileUser;
}

export const ProfilePublicPanel: React.FC<ProfilePublicPanelProps> = ({ user }) => {
  const { briefcase: Briefcase, calendar: Calendar, fileText: FileText, mail: Mail, phone: Phone } = publicInfoIcons;

  return (
    <AnimatedTabContent activeKey="public" className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground mb-6">Hồ sơ công khai</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText size={16} /> Giới thiệu
            </h3>
            <p className="text-foreground text-base leading-relaxed">
              {user.profile?.bio || 'Người dùng này chưa cập nhật tiểu sử.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-muted/50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Email liên hệ</p>
              <p className="text-foreground font-medium flex items-center gap-2">
                <Mail size={16} /> {user.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Số điện thoại</p>
              <p className="text-foreground font-medium flex items-center gap-2">
                <Phone size={16} /> {user.phone || 'Chưa cập nhật'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Chức danh</p>
              <p className="text-foreground font-medium flex items-center gap-2">
                <Briefcase size={16} /> {user.profile?.headline || 'Chưa cập nhật'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Ngày tham gia</p>
              <p className="text-foreground font-medium flex items-center gap-2">
                <Calendar size={16} /> {formatProfileDate(user.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Gói đăng ký</p>
              <div
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  user.subscriptionStatus === 'ACTIVE'
                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {user.subscriptionStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Chưa kích hoạt'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedTabContent>
  );
};
