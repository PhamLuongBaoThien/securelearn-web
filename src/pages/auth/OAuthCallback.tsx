// ========================
// OAuth Callback: Xử lý redirect từ Google OAuth
// URL pattern: /oauth-callback?token=<access_token>
// ========================
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { setUser } from '@/features/auth/authSlice';
import { setAccessToken } from '@/services/apiClient';
import { getMe } from '@/services/authApi';
import { toast } from 'sonner';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
          dispatch(setUser({ user: profileRes.data, accessToken: token }));
          toast.success(profileRes.message || `Chào mừng ${profileRes.data.fullName}!`);
          navigate('/', { replace: true });
        } else {
          throw new Error(profileRes.message || 'Không lấy được thông tin profile.');
        }
      } catch (err: any) {
        setAccessToken(null);
        toast.error(err.message || 'Xảy ra lỗi khi xác thực. Vui lòng thử lại.');
        navigate('/auth/login', { replace: true });
      }
    };

    handleOAuth();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Đang xác thực với Google...</p>
      </div>
    </div>
  );
}
