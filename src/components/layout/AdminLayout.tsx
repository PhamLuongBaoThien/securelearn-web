import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
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
  Monitor,
  ChevronDown,
  ChevronRight,
  Globe,
  Image,
  Tag,
  UserCheck,
  Lock,
  CheckSquare,
  FolderOpen,
  Video,
  Key,
  ShieldCheck,
  DollarSign,
  Package,
  FileText,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

// ===== Menu Structure =====
interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface MenuGroup {
  groupName: string;
  groupIcon: React.ReactNode;
  items: MenuItem[];
}

type SidebarEntry = { type: 'single'; name: string; path: string; icon: React.ReactNode } | { type: 'group'; group: MenuGroup };

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
      groupName: 'Hệ thống & CMS',
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
        { name: 'Danh sách User', path: '/admin/users/list', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
        { name: 'Phân quyền RBAC', path: '/admin/users/rbac', icon: <Lock className="w-4 h-4 shrink-0" /> },
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
      groupName: 'Media & Bảo mật',
      groupIcon: <Shield className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Giám sát Mã hóa', path: '/admin/media/encryption', icon: <Video className="w-4 h-4 shrink-0" /> },
        { name: 'Quản lý Khóa (KMS)', path: '/admin/media/kms', icon: <Key className="w-4 h-4 shrink-0" /> },
        { name: 'Cấu hình Bảo vệ', path: '/admin/media/security', icon: <ShieldCheck className="w-4 h-4 shrink-0" /> },
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
        { name: 'Đối soát & Báo cáo', path: '/admin/finance/reports', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
      ],
    },
  },
  {
    type: 'group',
    group: {
      groupName: 'Thông báo & Tiến độ',
      groupIcon: <Bell className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Mẫu Thông báo', path: '/admin/notifications/config', icon: <FileText className="w-4 h-4 shrink-0" /> },
        { name: 'Tiến độ Học tập', path: '/admin/notifications/progress', icon: <TrendingUp className="w-4 h-4 shrink-0" /> },
      ],
    },
  },
];

// ===== Sub-component: Group Menu =====
const GroupMenu: React.FC<{
  group: MenuGroup;
  collapsed: boolean;
  currentPath: string;
}> = ({ group, collapsed, currentPath }) => {
  const isGroupActive = group.items.some((item) => currentPath.startsWith(item.path));
  const [open, setOpen] = useState(isGroupActive);

  const toggleOpen = () => {
    if (!collapsed) setOpen((prev) => !prev);
  };

  return (
    <div>
      {/* Group Header */}
      <button
        onClick={toggleOpen}
        title={collapsed ? group.groupName : ''}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
          isGroupActive && collapsed
            ? 'bg-primary/10 text-primary'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <span className={`transition-transform duration-200 shrink-0 ${isGroupActive ? 'text-primary' : 'group-hover:scale-110'}`}>
          {group.groupIcon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 text-left font-medium text-sm whitespace-nowrap">{group.groupName}</span>
            <span className="transition-transform duration-200">
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          </>
        )}
      </button>

      {/* Group Items */}
      {!collapsed && open && (
        <div className="ml-3 mt-1 pl-3 border-l border-zinc-200 dark:border-zinc-800 space-y-1">
          {group.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`
              }
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== Main AdminLayout =====
export const AdminLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.adminAuth);
  const { theme } = useAppSelector((state) => state.ui);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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
          <div
            className={`flex items-center gap-3 text-primary overflow-hidden transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}
          >
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

        {/* User Info */}
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
        {collapsed && <div className="h-4" />}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 custom-scrollbar">
          {sidebarEntries.map((entry, idx) => {
            if (entry.type === 'single') {
              return (
                <NavLink
                  key={entry.path}
                  to={entry.path}
                  title={collapsed ? entry.name : ''}
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
                        {entry.icon}
                      </span>
                      {!collapsed && <span className="whitespace-nowrap text-sm">{entry.name}</span>}
                      {isActive && !collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md shadow-[0_0_10px_theme('colors.primary.DEFAULT')]" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            } else {
              return (
                <GroupMenu
                  key={idx}
                  group={entry.group}
                  collapsed={collapsed}
                  currentPath={location.pathname}
                />
              );
            }
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/60 shrink-0 space-y-2">
          <button
            onClick={handleThemeChange}
            title={collapsed ? 'Đổi giao diện' : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="group-hover:scale-110 transition-transform">{getThemeIcon()}</div>
            {!collapsed && (
              <span className="font-medium whitespace-nowrap text-sm">
                {theme === 'light' ? 'Nền sáng' : theme === 'dark' ? 'Nền tối' : 'Mặc định HT'}
              </span>
            )}
          </button>

          <button
            onClick={handleLogout}
            title={collapsed ? 'Đăng xuất' : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-colors group ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {!collapsed && <span className="font-medium whitespace-nowrap text-sm">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 relative min-h-screen ${collapsed ? 'ml-20' : 'ml-72'}`}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 transition-all duration-500" />
        <div className="p-8 pb-12 w-full max-w-7xl mx-auto h-full animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
