// Admin Profile Tab Nav: Sidebar điều hướng giữa các tab trong trang hồ sơ quản trị.
import React from 'react';
import { Button } from '@/components/ui/button';
import { adminProfileTabs } from './adminProfile.utils';
import type { AdminProfileTabType } from './adminProfile.types';

interface AdminProfileTabNavProps {
  activeTab: AdminProfileTabType;
  onTabChange: (tab: AdminProfileTabType) => void;
}

export const AdminProfileTabNav: React.FC<AdminProfileTabNavProps> = ({ activeTab, onTabChange }) => (
  <div className="w-full md:w-64 shrink-0">
    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
      {adminProfileTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
);
