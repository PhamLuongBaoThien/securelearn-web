// ========================
// Layout Component: Component bọc các route yêu cầu Admin đăng nhập
// Chỉ đọc admin auth state đã được AuthInitializer đồng bộ sẵn vào Redux.
// ========================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { AuthLoadingScreen } from './AuthLoadingScreen';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.adminAuth);
  const location = useLocation();

  if (!authResolved) {
    return <AuthLoadingScreen variant="admin" message="Đang xác thực quản trị viên..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};


