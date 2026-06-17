// ========================
// Trang Đăng ký — Dùng React Query useMutation
// Sau khi đăng ký thành công → redirect về trang login.
// ========================
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppSelector } from '@/app/hooks';
import { useRegister } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function Signup() {
  const navigate = useNavigate();
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.auth);
  const registerMutation = useRegister();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');

    if (!fullName.trim()) {
      setNameError('Vui lòng nhập họ và tên');
      isValid = false;
    }

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

  // Nếu đã đăng nhập → redirect đi
  useEffect(() => {
    if (authResolved && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authResolved, isAuthenticated, navigate]);

  // Hiển thị toast khi có error
  useEffect(() => {
    if (registerMutation.error) {
      toast.error(registerMutation.error.message);
    }
  }, [registerMutation.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phía client
    if (!validateForm()) return;

    registerMutation.mutate(
      { email, password, fullName },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          navigate('/auth/login', { replace: true });
        },
      }
    );
  };

  return (
    <StaggerContainer>
      <StaggerItem className="text-center md:text-left mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Đăng ký thành viên</h2>
        <p className="text-muted-foreground text-sm">
          Tham gia cộng đồng học thuật an toàn nhất
        </p>
      </StaggerItem>



      <form onSubmit={handleSubmit} className="space-y-4">
        <StaggerItem className="space-y-2 relative">
          <label className={`text-sm font-medium leading-none ${nameError ? 'text-destructive' : 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'}`}>
            Họ và tên
          </label>
          <div className="relative">
            <User className={`absolute left-3 top-3 h-4 w-4 ${nameError ? 'text-destructive' : 'text-muted-foreground'}`} />
            <Input 
              type="text" 
              placeholder="Ví dụ: Nguyễn Văn A" 
              className={`pl-10 h-10 ${nameError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              required 
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (nameError) setNameError('');
              }}
              disabled={registerMutation.isPending}
            />
          </div>
          {nameError && <p className="text-xs text-destructive mt-1 animate-in fade-in slide-in-from-top-1">{nameError}</p>}
        </StaggerItem>

        <StaggerItem className="space-y-2 relative">
          <label className={`text-sm font-medium leading-none ${emailError ? 'text-destructive' : 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'}`}>
            Email
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
              disabled={registerMutation.isPending}
            />
          </div>
          {emailError && <p className="text-xs text-destructive mt-1 animate-in fade-in slide-in-from-top-1">{emailError}</p>}
        </StaggerItem>

        <StaggerItem className="space-y-2 relative">
          <label className={`text-sm font-medium leading-none ${passwordError ? 'text-destructive' : 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'}`}>
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className={`absolute left-3 top-3 h-4 w-4 ${passwordError ? 'text-destructive' : 'text-muted-foreground'}`} />
            <Input 
              type="password" 
              placeholder="••••••••" 
              className={`pl-10 h-10 ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              required 
              minLength={6}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              disabled={registerMutation.isPending}
            />
          </div>
          {!passwordError && <p className="text-xs text-muted-foreground mt-1">Tối thiểu 6 ký tự</p>}
          {passwordError && <p className="text-xs text-destructive mt-1 animate-in fade-in slide-in-from-top-1">{passwordError}</p>}
        </StaggerItem>

        <StaggerItem>
        <Button 
          type="submit" 
          disabled={registerMutation.isPending}
          variant="udemy_dark" 
          className="w-full mt-6 py-6 text-md flex items-center gap-2"
        >
          {registerMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Đang tạo tài khoản...
            </>
          ) : (
            <>
              Đăng ký ngay <UserPlus className="h-4 w-4" />
            </>
          )}
        </Button>
        </StaggerItem>
      </form>

      <StaggerItem>
        <p className="mt-8 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-muted-foreground max-w-sm mx-auto">
        Bằng cách nhấp vào "Đăng ký ngay", bạn đồng ý với <Link to="/terms" className="underline">Điều khoản Dịch vụ</Link> và <Link to="/privacy" className="underline">Chính sách Bảo mật</Link> của chúng tôi.
      </p>
      </StaggerItem>
    </StaggerContainer>
  );
}
