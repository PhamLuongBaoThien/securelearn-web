import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { AuthLoadingScreen } from './AuthLoadingScreen';

interface AdminGuestRouteProps {
  children: React.ReactNode;
}

export const AdminGuestRoute: React.FC<AdminGuestRouteProps> = ({ children }) => {
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.adminAuth);

  if (!authResolved) {
    return <AuthLoadingScreen variant="admin" message="Đang kiểm tra phiên quản trị..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};


