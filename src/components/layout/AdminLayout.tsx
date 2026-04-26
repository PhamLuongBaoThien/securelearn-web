import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useAdminLogout } from '@/hooks/useAdminAuth';
import { toggleTheme } from '@/features/dashboard/uiSlice';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  CreditCard,
  Globe,
  Image,
  Tag,
  UserCheck,
  UserCog,
  Lock,
  CheckSquare,
  FolderOpen,
  DollarSign,
  Package,
  FileText,
  Bell,
  Send,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import sidebarLogo from '@/assets/logoweb.png';

import { Sidebar } from './Sidebar';
import type { SidebarEntry } from './Sidebar';

const sidebarEntries: SidebarEntry[] = [
  {
    type: 'single',
    name: 'Bảng điều khiển',
    path: '/admin/dashboard',
    icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
  },
  {
    type: 'group',
    group: {
      groupName: 'Thiết lập chung',
      groupIcon: <Settings className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Cấu hình Website', path: '/admin/system/config', icon: <Globe className="w-4 h-4 shrink-0" /> },
        { name: 'Banner & Slider', path: '/admin/system/banners', icon: <Image className="w-4 h-4 shrink-0" /> },
        { name: 'Danh mục', path: '/admin/system/categories', icon: <Tag className="w-4 h-4 shrink-0" /> },
      ],
    },
  },
  {
    type: 'group',
    group: {
      groupName: 'Người dùng',
      groupIcon: <Users className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Danh sách người dùng', path: '/admin/users/list', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
        { name: 'Danh sách nhân viên', path: '/admin/users/staff', icon: <UserCog className="w-4 h-4 shrink-0" /> },
        { name: 'Phân quyền nhân viên', path: '/admin/users/rbac', icon: <Lock className="w-4 h-4 shrink-0" /> },
      ],
    },
  },
  {
    type: 'group',
    group: {
      groupName: 'Nội dung đào tạo',
      groupIcon: <BookOpen className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Kiểm duyệt khóa học', path: '/admin/courses/review', icon: <CheckSquare className="w-4 h-4 shrink-0" /> },
        { name: 'Tài nguyên', path: '/admin/courses/resources', icon: <FolderOpen className="w-4 h-4 shrink-0" /> },
      ],
    },
  },
  {
    type: 'group',
    group: {
      groupName: 'Tài chính',
      groupIcon: <CreditCard className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Giao dịch', path: '/admin/finance/transactions', icon: <DollarSign className="w-4 h-4 shrink-0" /> },
        { name: 'Gói cước', path: '/admin/finance/plans', icon: <Package className="w-4 h-4 shrink-0" /> },
      ],
    },
  },
  {
    type: 'group',
    group: {
      groupName: 'Thông báo',
      groupIcon: <Bell className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Gửi thông báo', path: '/admin/notifications/send', icon: <Send className="w-4 h-4 shrink-0" /> },
        { name: 'Hộp thư đến', path: '/admin/notifications/inbox', icon: <Inbox className="w-4 h-4 shrink-0" /> },
        { name: 'Mẫu thông báo', path: '/admin/notifications/config', icon: <FileText className="w-4 h-4 shrink-0" /> },
      ],
    },
  },
];

// ===== Main AdminLayout =====
export const AdminLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.adminAuth);
  const { theme } = useAppSelector((state) => state.ui);
  const [collapsed, setCollapsed] = useState(false);

  const adminLogoutMutation = useAdminLogout();

  const handleLogout = () => {
    adminLogoutMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(data?.message || 'Đã đăng xuất tài khoản quản trị.');
      },
    });
  };

  const handleToggleSidebar = () => setCollapsed(!collapsed);

  const handleThemeChange = () => {
    if (theme === 'light') dispatch(toggleTheme('dark'));
    else if (theme === 'dark') dispatch(toggleTheme('system'));
    else dispatch(toggleTheme('light'));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex text-zinc-900 dark:text-zinc-100 font-sans selection:bg-primary/30 transition-colors duration-300">
      <Sidebar
        entries={sidebarEntries}
        roleTitle="Trang quản trị"
        collapsed={collapsed}
        onToggleCollapsed={handleToggleSidebar}
        userFullName={user?.fullName}
        userEmail={user?.email}
        userAvatarNode={
          <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary border border-primary/30 shrink-0 overflow-hidden aspect-square">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.fullName?.charAt(0) || 'A'
            )}
          </div>
        }
        profileLink="/admin/profile"
        theme={theme}
        onThemeChange={handleThemeChange}
        onLogout={handleLogout}
        logoSrc={sidebarLogo}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-[margin-left] duration-200 ease-out relative min-h-screen will-change-[margin-left] ${collapsed ? 'ml-20' : 'ml-72'}`}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 transition-all duration-500" />
        <div className="p-8 pb-12 w-full max-w-7xl mx-auto h-full animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
