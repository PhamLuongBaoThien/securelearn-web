// ========================
// AuthInitializer: Khôi phục session khi app khởi động
// Dùng React Query useInitializeAuth() thay cho Redux createAsyncThunk.
// Lắng nghe event session-expired từ apiClient interceptor.
// ========================
import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setUser, clearUser } from '@/features/auth/authSlice';
import { setAccessToken } from '@/services/apiClient';
import { useInitializeAuth } from '@/hooks/useAuth';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useAppDispatch();
  const { data, status } = useInitializeAuth();

  // Khi session recovery thành công hoặc thất bại → sync vào Redux
  useEffect(() => {
    if (status === 'success' && data) {
      dispatch(setUser({ user: data.user, accessToken: data.accessToken }));
    } else if (status === 'error') {
      dispatch(clearUser());
    }
  }, [status, data, dispatch]);

  // Lắng nghe event khi refresh token cũng hết hạn (session expired hoàn toàn)
  useEffect(() => {
    const handleSessionExpired = () => {
      setAccessToken(null);
      dispatch(clearUser());
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [dispatch]);

  return <>{children}</>;
}
