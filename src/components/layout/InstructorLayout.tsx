import React, { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import sidebarLogo from '@/assets/logoweb.png';
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
          { name: 'Hỏi đáp & Tin nhắn', path: '/instructor/communication', icon: <MessageSquare className="w-5 h-5 shrink-0" /> },
          { name: unreadNotifications ? 'Thông báo (' + unreadNotifications + ')' : 'Thông báo', path: '/instructor/notifications', icon: <Bell className="w-5 h-5 shrink-0" /> },
          { name: 'Hỗ trợ & góp ý', path: '/support', icon: <MessageSquare className="w-5 h-5 shrink-0" /> },
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
        entries={instructorEntries}
        roleTitle="Trang giảng viên"
        collapsed={collapsed}
        onToggleCollapsed={handleToggleSidebar}
        userFullName={user?.fullName || 'Giảng viên'}
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
        logoSrc={sidebarLogo}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-[margin-left] duration-200 ease-out relative min-h-screen will-change-[margin-left] ${collapsed ? 'ml-20' : 'ml-72'}`}>
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/60 sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
             {/* Logo or page title placeholder */}
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell allPath="/notifications" />
            <button 
              onClick={handleBackToStudent}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <GraduationCap className="h-4 w-4" />
              Chuyển sang Học viên
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

