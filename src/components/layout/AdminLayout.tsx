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
  ListChecks,
  DollarSign,
  Package,
  FileText,
  Bell,
  Send,
  Inbox,
  TicketPercent,
  ScrollText,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useInboxUnread } from '@/hooks/useInboxUnread';

import { Sidebar } from './Sidebar';
import type { SidebarEntry } from './Sidebar';
import { adminSubMenuVariants, adminTextVariants } from '@/components/animations/sidebar';

// ===== Hàm tạo sidebar entries động theo role =====
function buildSidebarEntries(isSuperAdmin: boolean, permissions: string[], inboxUnread = 0): SidebarEntry[] {
  const hasPerm = (p: string) => isSuperAdmin || permissions.includes(p);

  const rawGroups = [
    {
      groupName: 'Thiết lập chung',
      groupIcon: <Settings className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Cấu hình Website', path: '/admin/system/config', icon: <Globe className="w-4 h-4 shrink-0" />, req: 'system:config' },
        { name: 'Banner & Slider', path: '/admin/system/banners', icon: <Image className="w-4 h-4 shrink-0" />, req: 'system:config' },
        { name: 'Chính sách', path: '/admin/system/policies', icon: <ScrollText className="w-4 h-4 shrink-0" />, req: 'system:config' },
        { name: 'Danh mục', path: '/admin/system/categories', icon: <Tag className="w-4 h-4 shrink-0" />, req: 'system:config' },
      ],
    },
    {
      groupName: 'Người dùng',
      groupIcon: <Users className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Danh sách người dùng', path: '/admin/users/list', icon: <UserCheck className="w-4 h-4 shrink-0" />, req: 'user:read' },
        { name: 'Danh sách nhân viên', path: '/admin/users/staff', icon: <UserCog className="w-4 h-4 shrink-0" />, req: 'system:rbac', superOnly: true },
        { name: 'Vai trò & Quyền hạn', path: '/admin/users/rbac', icon: <ShieldCheck className="w-4 h-4 shrink-0" />, req: 'system:rbac', superOnly: true },
      ],
    },
    {
      groupName: 'Nội dung đào tạo',
      groupIcon: <BookOpen className="w-5 h-5 shrink-0" />,
      items: [
        { name: 'Kiểm duyệt khóa học', path: '/admin/courses/review', icon: <CheckSquare className="w-4 h-4 shrink-0" />, req: 'course:approve' },
        { name: 'Danh sách khóa học', path: '/admin/courses/resources', icon: <ListChecks className="w-4 h-4 shrink-0" />, req: 'course:read' },
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
        { name: 'Lịch sử thông báo', path: '/admin/notifications/system', icon: <Bell className="w-4 h-4 shrink-0" />, req: 'notif:read' },
        { name: 'Mẫu thông báo', path: '/admin/notifications/config', icon: <FileText className="w-4 h-4 shrink-0" />, req: 'notif:manage' },
      ],
    },
    {
      groupName: 'Hỗ trợ',
      groupIcon: <Inbox className="w-5 h-5 shrink-0" />,
      items: [
        { name: inboxUnread ? 'Hỗ trợ & Báo cáo (' + inboxUnread + ')' : 'Hỗ trợ & Báo cáo', path: '/admin/notifications/inbox', icon: <Inbox className="w-4 h-4 shrink-0" />, req: 'inbox:manage' },
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
    const validItems = g.items.filter(item => item.superOnly ? isSuperAdmin : hasPerm(item.req)).map(item => ({
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

// ===== Helper lấy nhãn và class hiển thị của Admin Role =====
function getAdminRoleLabel(roleKey: string): { label: string; className: string } {
  switch (roleKey) {
    case 'SUPER_ADMIN':
      return { label: 'Super Admin', className: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20' };
    case 'CONTENT_MANAGER':
      return { label: 'Quản lý nội dung', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' };
    case 'SUPPORT_AGENT':
      return { label: 'Nhân viên hỗ trợ', className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' };
    case 'FINANCE_MANAGER':
      return { label: 'Quản lý tài chính', className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' };
    default: {
      const formatted = roleKey
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return { label: formatted, className: 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' };
    }
  }
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
  const inboxUnread = useInboxUnread(true);
  const sidebarEntries = buildSidebarEntries(isSuperAdmin, userPermissions, inboxUnread);

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
        subMenuVariants={adminSubMenuVariants}
        textVariants={adminTextVariants}
        theme={theme}
        onThemeChange={handleThemeChange}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-[margin-left] duration-200 ease-out relative min-h-screen will-change-[margin-left] ${!sidebarOpen ? 'ml-20' : 'ml-72'}`}>
        <div className="sticky top-0 z-50 flex h-14 items-center justify-end gap-3 border-b bg-background/80 px-8 backdrop-blur">
          {user?.adminRole && (
            <span className={`px-2.5 py-0.5 text-[11px] font-semibold border rounded-full ${getAdminRoleLabel(user.adminRole).className}`}>
              {getAdminRoleLabel(user.adminRole).label}
            </span>
          )}
          <NotificationBell allPath="/admin/notifications/system" />
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="p-8 pb-12 w-full max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
