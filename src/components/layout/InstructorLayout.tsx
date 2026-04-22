import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleTheme } from '@/features/dashboard/uiSlice';
import { useLogout } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  PlaySquare,
  Activity,
  Wallet,
  Bell,
  LogOut,
  Menu,
  ChevronLeft,
  Moon,
  Sun,
  Monitor,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';

export const InstructorLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);
  const [collapsed, setCollapsed] = useState(false);

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

  const menuGroups = [
    {
      label: 'Tổng quan',
      items: [
        { name: 'Bảng điều khiển', path: '/instructor/dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
      ],
    },
    {
      label: 'Quản lý nội dung',
      items: [
        { name: 'Khóa học', path: '/instructor/courses', icon: <PlaySquare className="w-5 h-5 shrink-0" /> },
      ],
    },
    {
      label: 'Phân tích & Kinh doanh',
      items: [
        { name: 'Learning Analytics', path: '/instructor/performance', icon: <Activity className="w-5 h-5 shrink-0" /> },
        { name: 'Tài chính', path: '/instructor/earnings', icon: <Wallet className="w-5 h-5 shrink-0" /> },
        { name: 'Thông báo lớp', path: '/instructor/communication', icon: <Bell className="w-5 h-5 shrink-0" /> },
      ],
    },
  ];

  const handleToggleSidebar = () => setCollapsed(!collapsed);

  const handleThemeChange = () => {
    if (theme === 'light') dispatch(toggleTheme('dark'));
    else if (theme === 'dark') dispatch(toggleTheme('system'));
    else dispatch(toggleTheme('light'));
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5 shrink-0" />;
    if (theme === 'dark') return <Moon className="w-5 h-5 shrink-0" />;
    return <Monitor className="w-5 h-5 shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex text-zinc-900 dark:text-zinc-100 font-sans selection:bg-primary/30 transition-colors duration-300">
      {/* Left Sidebar */}
      <aside 
        className={`${collapsed ? 'w-20' : 'w-64'} bg-white/80 dark:bg-zinc-950/50 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800/60 flex flex-col fixed h-full z-20 transition-all duration-300`}
      >
        {/* Header Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800/60 shrink-0">
          <div className={`flex items-center gap-3 text-primary overflow-hidden transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap">Giảng viên</h1>
          </div>
          
          <button 
            onClick={handleToggleSidebar} 
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary border border-primary/30 shrink-0">
              {user?.fullName?.charAt(0) || 'G'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user?.fullName || 'Giảng viên'}</span>
              <span className="text-xs text-zinc-500 truncate">{user?.email || 'instructor@securelearn.com'}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar transition-all ${collapsed ? 'mt-4 space-y-2' : 'mt-2 space-y-4'}`}>
          {menuGroups.map((group) => (
            <div key={group.label}>
              {/* Group Label */}
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.name : ''}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                      } ${collapsed ? 'justify-center' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`transition-transform duration-200 shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                          {item.icon}
                        </span>
                        {!collapsed && <span className="whitespace-nowrap text-sm">{item.name}</span>}
                        {isActive && !collapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md shadow-[0_0_10px_theme('colors.primary.DEFAULT')]" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/60 shrink-0 space-y-2">
          <button
            onClick={handleThemeChange}
            title={collapsed ? "Đổi giao diện" : ""}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="group-hover:scale-110 transition-transform">{getThemeIcon()}</div>
            {!collapsed && <span className="font-medium whitespace-nowrap">
              {theme === 'light' ? 'Nền sáng' : theme === 'dark' ? 'Nền tối' : 'Mặc định HT'}
            </span>}
          </button>

          <button
            onClick={handleLogout}
            title={collapsed ? "Đăng xuất" : ""}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-colors group ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {!collapsed && <span className="font-medium whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 relative min-h-screen ${collapsed ? 'ml-20' : 'ml-64'}`}>
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/60 sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
             {/* Logo or page title placeholder */}
          </div>
          <div className="flex items-center gap-4">
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
