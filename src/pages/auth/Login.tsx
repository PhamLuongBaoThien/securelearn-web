// ========================
// Trang Đăng nhập — Dùng React Query useMutation
// ========================
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Input } from '@/components/ui/input';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppSelector } from '@/app/hooks';
import { useLogin } from '@/hooks/useAuth';
import { googleLogin } from '@/services/authApi';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Vui lòng nhập email');
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError('Email không đúng định dạng');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      isValid = false;
    }

    return isValid;
  };

  // Lấy URL trước đó để redirect sau khi đăng nhập (giữ nguyên query param và hash)
  const state = location.state as any // để lưu URL trước đó
  let from = '/';
  if (state?.from) {
    if (typeof state.from === 'string') {
      from = state.from;
    } else if (state.from.pathname) {
      from = `${state.from.pathname}${state.from.search || ''}${state.from.hash || ''}`;
    }
  }
  
  if (from.startsWith('/auth/')) {
    from = '/';
  }

  // Nếu đã đăng nhập → redirect đi
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Hiển thị toast khi có error
  useEffect(() => {
    if (loginMutation.error) {
      toast.error(loginMutation.error.message);
    }
  }, [loginMutation.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          navigate(from, { replace: true });
        },
      }
    );
  };

  const handleGoogleLogin = () => {
    googleLogin(); // Redirect tới backend OAuth
  };

  return (
    <StaggerContainer>
      <StaggerItem className="text-center md:text-left mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Đăng nhập tài khoản</h2>
        <p className="text-muted-foreground text-sm">
          Nhập email và mật khẩu để tiếp tục lộ trình học
        </p>
      </StaggerItem>



      <form onSubmit={handleSubmit} className="space-y-4">
        <StaggerItem className="space-y-2 relative">
          <label className={`text-sm font-medium leading-none ${emailError ? 'text-destructive' : 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'}`}>
            Email của bạn
          </label>
          <div className="relative">
            <Mail className={`absolute left-3 top-3 h-4 w-4 ${emailError ? 'text-destructive' : 'text-muted-foreground'}`} />
            <Input 
              type="email" 
              placeholder="name@example.com" 
              className={`pl-10 h-10 ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              required 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              disabled={loginMutation.isPending}
            />
          </div>
          {emailError && <p className="text-xs text-destructive mt-1 animate-in fade-in slide-in-from-top-1">{emailError}</p>}
        </StaggerItem>

        <StaggerItem className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium leading-none ${passwordError ? 'text-destructive' : 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'}`}>
              Mật khẩu
            </label>
            <Link to="/auth/forgot-password" className="text-xs font-semibold text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className={`absolute left-3 top-3 h-4 w-4 ${passwordError ? 'text-destructive' : 'text-muted-foreground'}`} />
            <Input 
              type="password" 
              placeholder="••••••••" 
              className={`pl-10 h-10 ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              required 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              disabled={loginMutation.isPending}
            />
          </div>
          {passwordError && <p className="text-xs text-destructive mt-1 animate-in fade-in slide-in-from-top-1">{passwordError}</p>}
        </StaggerItem>

        <StaggerItem>
          <Button 
          type="submit" 
          disabled={loginMutation.isPending}
          variant="udemy_dark" 
          className="w-full mt-6 py-6 text-md flex items-center gap-2"
        >
          {loginMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Đang xác thực...
            </>
          ) : (
            <>
              Đăng nhập <LogIn className="h-4 w-4" />
            </>
          )}
        </Button>
        </StaggerItem>
      </form>

      <StaggerItem className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Hoặc đăng nhập bằng
          </span>
        </div>
      </StaggerItem>

      <StaggerItem className="flex flex-col gap-3">
        <Button 
          variant="outline" 
          className="w-full h-12 flex items-center gap-2"
          onClick={handleGoogleLogin}
          disabled={loginMutation.isPending}
        >
          <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
          Google
        </Button>
      </StaggerItem>

      <StaggerItem>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
        <Link to="/auth/signup" className="font-semibold text-primary hover:underline">
          Đăng ký ngay
        </Link>
        </p>
      </StaggerItem>
    </StaggerContainer>
  );
}
