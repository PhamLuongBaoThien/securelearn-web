// ========================
// ProtectedRoute: Bảo vệ các route yêu cầu đăng nhập
// Nếu chưa xác thực → redirect về /auth/login
// Chỉ đọc auth state đã được AuthInitializer đồng bộ sẵn vào Redux.
// ========================
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import type { Role } from '@/types/auth.types';
import { AuthLoadingScreen } from './AuthLoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Danh sách role được phép truy cập (nếu không truyền → cho tất cả user đã đăng nhập) */
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, authResolved } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Chặn render sớm khi session từ localStorage chưa được backend xác minh xong.
  if (!authResolved) {
    return <AuthLoadingScreen />;
  }

  // Chưa đăng nhập (API lỗi) → redirect về login (lưu lại URL hiện tại để quay lại sau)
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Kiểm tra quyền (role)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

