// User Profile Tab Nav: Sidebar điều hướng giữa các tab trong trang hồ sơ người dùng.
import React from 'react';
import { profileTabs } from './profile.utils';
import type { ProfileTabType } from './profile.types';

interface ProfileTabNavProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
}

export const ProfileTabNav: React.FC<ProfileTabNavProps> = ({ activeTab, onTabChange }) => (
  <div className="w-full md:w-64 shrink-0">
    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
      {profileTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
);
