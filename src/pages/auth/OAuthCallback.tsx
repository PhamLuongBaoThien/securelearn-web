// ========================
// OAuth Callback: Xử lý redirect từ Google OAuth
// URL pattern: /oauth-callback?token=<access_token>
// ========================
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { setUser } from '@/features/auth/authSlice';
import { setCartItems, setWishlistItems } from '@/features/courses/cartSlice';
import { setAccessToken } from '@/services/apiClient';
import { getMe } from '@/services/authApi';
import { mergeGuestCart } from '@/services/cartApi';
import { mergeGuestWishlist } from '@/services/wishlistApi';
import { useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/hooks/useAuth';
import { cartKeys } from '@/hooks/useCart';
import { wishlistKeys } from '@/hooks/useWishlist';
import { clearGuestCart, getGuestCartCourseIds } from '@/features/courses/cartStorage';
import { clearGuestWishlist, getGuestWishlistCourseIds } from '@/features/courses/wishlistStorage';
import { toast } from 'sonner';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    // Chặn chạy 2 lần trong StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleOAuth = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error || !token) {
        toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
        navigate('/auth/login', { replace: true });
        return;
      }

      try {
        // Lưu access token vào apiClient
        setAccessToken(token);

        // Lấy profile user
        const profileRes = await getMe();
        if (profileRes.status === 'OK' && profileRes.data) {
          const guestCourseIds = getGuestCartCourseIds();
          const guestWishlistCourseIds = getGuestWishlistCourseIds();
          const mergedCart = guestCourseIds.length > 0
            ? await mergeGuestCart(guestCourseIds)
            : null;
          const mergedWishlist = guestWishlistCourseIds.length > 0
            ? await mergeGuestWishlist(guestWishlistCourseIds)
            : null;

          dispatch(setUser({ user: profileRes.data }));
          queryClient.setQueryData(authKeys.session, { user: profileRes.data });
          queryClient.setQueryData(authKeys.profile, profileRes.data);
          if (mergedCart?.status === 'OK' && mergedCart.data) {
            clearGuestCart();
            dispatch(setCartItems(mergedCart.data.items));
            queryClient.setQueryData(cartKeys.items, mergedCart.data);
          }
          if (mergedWishlist?.status === 'OK' && mergedWishlist.data) {
            clearGuestWishlist();
            dispatch(setWishlistItems(mergedWishlist.data.items));
            queryClient.setQueryData(wishlistKeys.items, mergedWishlist.data);
          }
          toast.success(profileRes.message || `Chào mừng ${profileRes.data.fullName}!`);
          navigate('/', { replace: true });
        } else {
          throw new Error(profileRes.message || 'Không lấy được thông tin profile.');
        }
      } catch (err: unknown) {
        setAccessToken(null);
        toast.error((err as Error).message || 'Xảy ra lỗi khi xác thực. Vui lòng thử lại.');
        navigate('/auth/login', { replace: true });
      }
    };

    handleOAuth();
  }, [searchParams, navigate, dispatch, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Đang xác thực với Google...</p>
      </div>
    </div>
  );
}
