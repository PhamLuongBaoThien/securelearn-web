// ========================
// AuthInitializer: Khôi phục session khi app khởi động
// Dùng React Query useInitializeAuth() thay cho Redux createAsyncThunk.
// Lắng nghe event session-expired từ apiClient interceptor.
// ========================
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { setUser, clearUser } from '@/features/auth/authSlice';
import { setAdminUser, clearAdminUser } from '@/features/auth/adminAuthSlice';
import { setAccessToken } from '@/services/apiClient';
import { useInitializeAuth } from '@/hooks/useAuth';
import { useInitializeAdminAuth } from '@/hooks/useAdminAuth';
import { useCartSync, useMergeGuestCart } from '@/hooks/useCart';
import { useMergeGuestWishlist, useWishlistSync } from '@/hooks/useWishlist';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const userSession = useInitializeAuth({ enabled: !isAdminPath });
  const adminSession = useInitializeAdminAuth({ enabled: isAdminPath });
  const { mutate: mergeGuestCartAfterSessionRestore } = useMergeGuestCart();
  const { mutate: mergeGuestWishlistAfterSessionRestore } = useMergeGuestWishlist();
  const hasMergedGuestCart = useRef(false);
  const hasMergedGuestWishlist = useRef(false);
  useCartSync({ enabled: !isAdminPath });
  useWishlistSync({ enabled: !isAdminPath });

  // Khôi phục session user khi app khởi động ở nhánh user.
  useEffect(() => {
    if (userSession.status === 'success' && userSession.data) {
      dispatch(setUser({ user: userSession.data.user }));
      if (!hasMergedGuestCart.current) {
        hasMergedGuestCart.current = true;
        mergeGuestCartAfterSessionRestore();
      }
      if (!hasMergedGuestWishlist.current) {
        hasMergedGuestWishlist.current = true;
        mergeGuestWishlistAfterSessionRestore();
      }
    } else if (userSession.status === 'error' && !isAdminPath) {
      dispatch(clearUser());
    }
  }, [
    userSession.status,
    userSession.data,
    dispatch,
    isAdminPath,
    mergeGuestCartAfterSessionRestore,
    mergeGuestWishlistAfterSessionRestore,
  ]);

  // Khôi phục session admin khi app khởi động ở nhánh admin.
  useEffect(() => {
    if (adminSession.status === 'success' && adminSession.data) {
      dispatch(setAdminUser({ user: adminSession.data.user }));
    } else if (adminSession.status === 'error' && isAdminPath) {
      dispatch(clearAdminUser());
    }
  }, [adminSession.status, adminSession.data, dispatch, isAdminPath]);

  // Lắng nghe event khi refresh token cũng hết hạn (session expired hoàn toàn)
  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ context?: 'user' | 'admin' }>;
      const context = customEvent.detail?.context ?? 'user';

      setAccessToken(null, context);

      if (context === 'admin') {
        dispatch(clearAdminUser());
        return;
      }

      dispatch(clearUser());
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [dispatch]);

  return <>{children}</>;
}

