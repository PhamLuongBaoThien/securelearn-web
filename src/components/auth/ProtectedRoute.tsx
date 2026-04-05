// ========================
// ProtectedRoute: Bảo vệ các route yêu cầu đăng nhập
// Nếu chưa xác thực → redirect về /auth/login
// Dùng React Query loading state thay cho Redux initializing.
// ========================
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useInitializeAuth } from '@/hooks/useAuth';
import type { Role } from '@/types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Danh sách role được phép truy cập (nếu không truyền → cho tất cả user đã đăng nhập) */
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { isLoading } = useInitializeAuth();
  const location = useLocation();

  // Đang kiểm tra session → hiện loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → redirect về login (lưu lại URL hiện tại để quay lại sau)
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Kiểm tra quyền (role)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
