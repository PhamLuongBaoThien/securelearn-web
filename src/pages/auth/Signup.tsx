import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useState } from 'react';

export function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Fake signup delay
    setTimeout(() => {
      setLoading(false);
      navigate('/student/dashboard');
    }, 1000);
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
          <label className="text-sm font-medium leading-none">
            Họ và tên
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Ví dụ: Nguyễn Văn A" 
              className="pl-10 h-10" 
              required 
            />
          </div>
        </StaggerItem>

        <StaggerItem className="space-y-2 relative">
          <label className="text-sm font-medium leading-none">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              type="email" 
              placeholder="name@example.com" 
              className="pl-10 h-10" 
              required 
            />
          </div>
        </StaggerItem>

        <StaggerItem className="space-y-2 relative">
          <label className="text-sm font-medium leading-none">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="pl-10 h-10" 
              required 
            />
          </div>
        </StaggerItem>

        <StaggerItem>
        <Button 
          type="submit" 
          disabled={loading}
          variant="udemy_dark" 
          className="w-full mt-6 py-6 text-md flex items-center gap-2"
        >
          {loading ? 'Đang tạo tài khoản...' : (
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
