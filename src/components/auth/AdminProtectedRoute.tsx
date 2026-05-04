// ========================
// Layout Component: Component bọc các route yêu cầu Admin đăng nhập
// Chỉ đọc admin auth state đã được AuthInitializer đồng bộ sẵn vào Redux.
// ========================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.adminAuth);
  const location = useLocation();

  if (!authResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <h2 className="text-zinc-400 font-medium">Verifying Administrator Session...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
