// ========================
// Guard Component: AdminRoleRoute
// Bảo vệ route theo adminRole — hiển thị trang 403 inline nếu thiếu quyền.
// Không redirect để tránh UX xấu và lộ thông tin route.
// ========================
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import type { AdminRole } from '@/types/admin.types';

interface AdminRoleRouteProps {
  allowedRoles: AdminRole[];
  children: React.ReactNode;
}

export const AdminRoleRoute: React.FC<AdminRoleRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.adminAuth);

  // Chưa đăng nhập — AdminProtectedRoute đã xử lý, nhưng check thêm cho an toàn
  if (!isAuthenticated || !user) {
    return null;
  }

  // Kiểm tra role
  if (!allowedRoles.includes(user.adminRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Không có quyền truy cập</h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
          Tài khoản của bạn không có đủ quyền để truy cập.
        </p>
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
