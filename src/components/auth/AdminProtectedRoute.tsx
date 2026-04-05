// ========================
// Layout Component: Component bọc các route yêu cầu Admin đăng nhập
// Dùng React Query useInitializeAdminAuth() thay cho Redux createAsyncThunk.
// ========================
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setAdminUser } from '@/features/auth/adminAuthSlice';
import { useInitializeAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.adminAuth);
  const location = useLocation();

  // React Query sẽ tự gọi API khi component mount
  const { data, isLoading, isSuccess } = useInitializeAdminAuth();

  // Sync data vào Redux khi query thành công
  useEffect(() => {
    if (isSuccess && data) {
      dispatch(setAdminUser({ user: data.user, accessToken: data.accessToken }));
    }
  }, [isSuccess, data, dispatch]);

  if (isLoading) {
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
    return <Navigate to="/not-found" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
