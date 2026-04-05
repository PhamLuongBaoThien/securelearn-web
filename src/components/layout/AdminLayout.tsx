import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useAdminLogout } from '@/hooks/useAdminAuth';
import { toggleTheme } from '@/features/dashboard/uiSlice';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Shield,
  CreditCard,
  BarChart3,
  Menu,
  ChevronLeft,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';

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
      }
    });
  };

  const menuItems = [
    { name: 'Bảng điều khiển', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { name: 'Quản lý người dùng', path: '/admin/users', icon: <Users className="w-5 h-5 shrink-0" /> },
    { name: 'Khóa học', path: '/admin/courses', icon: <BookOpen className="w-5 h-5 shrink-0" /> },
    { name: 'Giao dịch', path: '/admin/transactions', icon: <CreditCard className="w-5 h-5 shrink-0" /> },
    { name: 'Thống kê', path: '/admin/analytics', icon: <BarChart3 className="w-5 h-5 shrink-0" /> },
    { name: 'Cài đặt', path: '/admin/settings', icon: <Settings className="w-5 h-5 shrink-0" /> },
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
        className={`${collapsed ? 'w-20' : 'w-72'} bg-white/80 dark:bg-zinc-950/50 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800/60 flex flex-col fixed h-full z-20 transition-all duration-300`}
      >
        {/* Header Sidebar */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800/60 shrink-0">
          <div className={`flex items-center gap-3 text-primary overflow-hidden transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <div className="bg-primary/10 p-2 rounded-xl shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap">Quản trị viên</h1>
          </div>
          
          <button 
            onClick={handleToggleSidebar} 
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User Info (Hide when collapsed) */}
        {!collapsed && (
          <div className="p-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary border border-primary/30 shrink-0">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user?.fullName || 'Administrator'}</span>
              <span className="text-xs text-zinc-500 truncate">{user?.email || 'admin@securelearn.com'}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 custom-scrollbar transition-all ${collapsed ? 'mt-4' : 'mt-2'}`}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.name : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
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
                  {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  {isActive && !collapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md shadow-[0_0_10px_theme('colors.primary.DEFAULT')]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/60 shrink-0 space-y-2">
          {/* Theme Toggle */}
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

          {/* Logout */}
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
      <main className={`flex-1 transition-all duration-300 relative min-h-screen ${collapsed ? 'ml-20' : 'ml-72'}`}>
        {/* Dynamic Background Blob */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 transition-all duration-500" />
        
        <div className="p-8 pb-12 w-full max-w-7xl mx-auto h-full animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
