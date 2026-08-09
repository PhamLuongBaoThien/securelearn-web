import React, { useState } from 'react';
import { useInboxUnread } from '@/hooks/useInboxUnread';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleTheme } from '@/features/dashboard/uiSlice';
import { useLogout } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  PlaySquare,
  BarChart2,
  MessageSquare,
  Bell,
  GraduationCap,
  Users,
  Menu,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Sidebar } from './Sidebar';
import type { SidebarEntry } from './Sidebar';
import { instructorTextVariants } from '@/components/animations/sidebar';

export const InstructorLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { count: unreadNotifications } = useUnreadNotifications();

  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã đăng xuất thành công.');
        navigate('/auth/login');
      }
    });
  };

  const handleBackToStudent = () => {
    navigate('/student/dashboard');
  };

  const inboxUnread = useInboxUnread();

  const instructorEntries: SidebarEntry[] = [
    {
      type: 'label',
      label: {
        labelName: 'Hiệu suất',
        items: [
          { name: 'Tổng quan', path: '/instructor/dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
          { name: 'Phân tích', path: '/instructor/performance', icon: <BarChart2 className="w-5 h-5 shrink-0" /> },
        ],
      }
    },
    {
      type: 'label',
      label: {
        labelName: 'Quản lý nội dung',
        items: [
          { name: 'Khóa học', path: '/instructor/courses', icon: <PlaySquare className="w-5 h-5 shrink-0" /> },
          { name: 'Học viên', path: '/instructor/students', icon: <Users className="w-5 h-5 shrink-0" /> },
        ],
      }
    },
    {
      type: 'label',
      label: {
        labelName: 'Giao tiếp',
        items: [
          { name: 'Giao tiếp', path: '/instructor/communication', icon: <MessageSquare className="w-5 h-5 shrink-0" /> },
          { name: unreadNotifications ? 'Thông báo (' + unreadNotifications + ')' : 'Thông báo', path: '/instructor/notifications', icon: <Bell className="w-5 h-5 shrink-0" /> },
          { name: inboxUnread ? 'Hỗ trợ & góp ý (' + inboxUnread + ')' : 'Hỗ trợ & góp ý', path: '/support', icon: <MessageSquare className="w-5 h-5 shrink-0" /> },
        ],
      }
    },
  ];

  const handleToggleSidebar = () => setCollapsed(!collapsed);

  const handleThemeChange = () => {
    if (theme === 'light') dispatch(toggleTheme('dark'));
    else if (theme === 'dark') dispatch(toggleTheme('system'));
    else dispatch(toggleTheme('light'));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex text-zinc-900 dark:text-zinc-100 font-sans selection:bg-primary/30 transition-colors duration-300">
      <Sidebar
        displayMode="desktop"
        entries={instructorEntries}
        roleTitle="Khu vực giảng dạy"
        collapsed={collapsed}
        onToggleCollapsed={handleToggleSidebar}
        userFullName={user?.fullName || 'Người giảng dạy'}
        userEmail={user?.email || 'instructor@securelearn.com'}
        userAvatarNode={
          <UserAvatar
            user={user}
            className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] text-base aspect-square"
          />
        }
        textVariants={instructorTextVariants}
        theme={theme}
        onThemeChange={handleThemeChange}
        onLogout={handleLogout}
      />

      <Sidebar
        displayMode="mobile"
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        entries={instructorEntries}
        roleTitle="Khu vực giảng dạy"
        collapsed={false}
        onToggleCollapsed={() => setMobileSidebarOpen(false)}
        onItemClick={() => setMobileSidebarOpen(false)}
        userFullName={user?.fullName || 'Người giảng dạy'}
        userEmail={user?.email || 'instructor@securelearn.com'}
        userAvatarNode={
          <UserAvatar
            user={user}
            className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] text-base aspect-square"
          />
        }
        textVariants={instructorTextVariants}
        theme={theme}
        onThemeChange={handleThemeChange}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`relative ml-0 min-h-screen min-w-0 flex-1 transition-[margin-left] duration-200 ease-out will-change-[margin-left] ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>

        {/* Top Header */}
        <header className="sticky top-0 z-50 flex h-16 min-w-0 items-center justify-between border-b border-zinc-200 bg-white/80 px-3 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80 sm:px-6">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Mở menu giảng viên"
              title="Mở menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
            <NotificationBell allPath="/notifications" />
            <button
              onClick={handleBackToStudent}
              aria-label="Chuyển sang Học viên"
              title="Chuyển sang Học viên"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:hover:bg-transparent dark:sm:hover:bg-transparent"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Chuyển sang Học viên</span>
            </button>
          </div>
        </header>

        {/* Dynamic Background Blob */}
        <div className="absolute top-16 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 transition-all duration-500" />

        <div className="p-6 md:p-8 w-full max-w-7xl mx-auto h-full animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
