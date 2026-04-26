// ========================
// AuthInitializer: Khôi phục session khi app khởi động
// Dùng React Query useInitializeAuth() thay cho Redux createAsyncThunk.
// Lắng nghe event session-expired từ apiClient interceptor.
// ========================
import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setUser, clearUser } from '@/features/auth/authSlice';
import { clearAdminUser } from '@/features/auth/adminAuthSlice';
import { setAccessToken } from '@/services/apiClient';
import { useInitializeAuth } from '@/hooks/useAuth';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useAppDispatch();
  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const { data, status } = useInitializeAuth({ enabled: !isAdminPath });

  // Khi session recovery thành công hoặc thất bại → sync vào Redux
  useEffect(() => {
    if (status === 'success' && data) {
      dispatch(setUser({ user: data.user, accessToken: data.accessToken }));
    } else if (status === 'error' && !isAdminPath) {
      dispatch(clearUser());
    }
  }, [status, data, dispatch, isAdminPath]);

  // Lắng nghe event khi refresh token cũng hết hạn (session expired hoàn toàn)
  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ context?: 'user' | 'admin' }>;
      const context = customEvent.detail?.context ?? 'user';

      setAccessToken(null, context);

      if (context === 'admin') {
        dispatch(clearAdminUser());
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.replace('/admin/login');
        }
        return;
      }

      dispatch(clearUser());
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.replace('/auth/login');
      }
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [dispatch]);

  return <>{children}</>;
}
