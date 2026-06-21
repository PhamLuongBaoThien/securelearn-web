import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useAdminLogout } from '@/hooks/useAdminAuth';
import { toggleTheme, setSidebarOpen } from '@/features/dashboard/uiSlice';
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
  ShieldCheck,
  CheckSquare,
  FolderOpen,
  DollarSign,
  Package,
  FileText,
  Bell,
  Send,
  Inbox,
  TicketPercent,
} from 'lucide-react';
import { toast } from 'sonner';
import sidebarLogo from '@/assets/logoweb.png';
import { UserAvatar } from '@/components/ui/UserAvatar';

import { Sidebar } from './Sidebar';
import type { SidebarEntry } from './Sidebar';

// ===== Hàm tạo sidebar entries động theo role =====
function buildSidebarEntries(isSuperAdmin: boolean, permissions: string[]): SidebarEntry[] {
  const hasPerm = (p: string) => isSuperAdmin || permissions.includes(p);

  const rawGroups = [
    {
      groupName: 'Thiết lập chung',
      groupIcon: <Settings className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Cấu hình Website', path: '/admin/system/config', icon: <Globe className="w-4 h-4 shrink-0" />, req: 'system:config' },
        { name: 'Banner & Slider', path: '/admin/system/banners', icon: <Image className="w-4 h-4 shrink-0" />, req: 'system:config' },
        { name: 'Danh mục', path: '/admin/system/categories', icon: <Tag className="w-4 h-4 shrink-0" />, req: 'system:config' },
      ],
    },
    {
      groupName: 'Người dùng',
      groupIcon: <Users className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Danh sách người dùng', path: '/admin/users/list', icon: <UserCheck className="w-4 h-4 shrink-0" />, req: 'user:read' },
        { name: 'Danh sách nhân viên', path: '/admin/users/staff', icon: <UserCog className="w-4 h-4 shrink-0" />, req: 'system:rbac' },
        { name: 'Phân quyền RBAC', path: '/admin/users/rbac', icon: <ShieldCheck className="w-4 h-4 shrink-0" />, req: 'system:rbac' },
      ],
    },
    {
      groupName: 'Nội dung đào tạo',
      groupIcon: <BookOpen className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Kiểm duyệt khóa học', path: '/admin/courses/review', icon: <CheckSquare className="w-4 h-4 shrink-0" />, req: 'course:approve' },
        { name: 'Tài nguyên', path: '/admin/courses/resources', icon: <FolderOpen className="w-4 h-4 shrink-0" />, req: 'course:read' },
      ],
    },
    {
      groupName: 'Tài chính',
      groupIcon: <CreditCard className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Giao dịch', path: '/admin/finance/transactions', icon: <DollarSign className="w-4 h-4 shrink-0" />, req: 'finance:read' },
        { name: 'Gói cước', path: '/admin/finance/plans', icon: <Package className="w-4 h-4 shrink-0" />, req: 'finance:manage' },
        { name: 'Coupon', path: '/admin/finance/coupons', icon: <TicketPercent className="w-4 h-4 shrink-0" />, req: 'finance:manage' },
      ],
    },
    {
      groupName: 'Thông báo',
      groupIcon: <Bell className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Gửi thông báo', path: '/admin/notifications/send', icon: <Send className="w-4 h-4 shrink-0" />, req: 'notif:manage' },
        { name: 'Hộp thư đến', path: '/admin/notifications/inbox', icon: <Inbox className="w-4 h-4 shrink-0" />, req: 'notif:read' },
        { name: 'Mẫu thông báo', path: '/admin/notifications/config', icon: <FileText className="w-4 h-4 shrink-0" />, req: 'notif:manage' },
      ],
    },
  ];

  const entries: SidebarEntry[] = [
    {
      type: 'single',
      name: 'Bảng điều khiển',
      path: '/admin/dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
  ];

  for (const g of rawGroups) {
    const validItems = g.items.filter(item => hasPerm(item.req)).map(item => ({
      name: item.name,
      path: item.path,
      icon: item.icon,
    }));

    if (validItems.length > 0) {
      entries.push({
        type: 'group',
        group: {
          groupName: g.groupName,
          groupIcon: g.groupIcon,
          items: validItems,
        },
      } as SidebarEntry);
    }
  }

  return entries;
}

// ===== Main AdminLayout =====
export const AdminLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.adminAuth);
  const { theme, sidebarOpen } = useAppSelector((state) => state.ui);

  const adminLogoutMutation = useAdminLogout();

  const isSuperAdmin = user?.adminRole === 'SUPER_ADMIN';

  const handleLogout = () => {
    adminLogoutMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(data?.message || 'Đã đăng xuất tài khoản quản trị.');
      },
    });
  };

  const handleToggleSidebar = () => dispatch(setSidebarOpen(!sidebarOpen));

  const handleThemeChange = () => {
    if (theme === 'light') dispatch(toggleTheme('dark'));
    else if (theme === 'dark') dispatch(toggleTheme('system'));
    else dispatch(toggleTheme('light'));
  };

  const userPermissions = user?.permissions ?? [];
  const sidebarEntries = buildSidebarEntries(isSuperAdmin, userPermissions);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex text-zinc-900 dark:text-zinc-100 font-sans selection:bg-primary/30">
      <Sidebar
        entries={sidebarEntries}
        roleTitle="Trang quản trị"
        collapsed={!sidebarOpen}
        onToggleCollapsed={handleToggleSidebar}
        userFullName={user?.fullName}
        userEmail={user?.email}
        userAvatarNode={
          <UserAvatar
            user={user}
            className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] text-base aspect-square"
          />
        }
        profileLink="/admin/profile"
        theme={theme}
        onThemeChange={handleThemeChange}
        onLogout={handleLogout}
        logoSrc={sidebarLogo}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-[margin-left] duration-200 ease-out relative min-h-screen will-change-[margin-left] ${!sidebarOpen ? 'ml-20' : 'ml-72'}`}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="p-8 pb-12 w-full max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
