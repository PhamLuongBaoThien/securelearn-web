import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Input } from '@/components/ui/input';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useState } from 'react';

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Fake login delay
    setTimeout(() => {
      setLoading(false);
      navigate('/student/dashboard');
    }, 1000);
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
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Email của bạn
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              type="email" 
              placeholder="name@example.com" 
              className="pl-10" 
              required 
            />
          </div>
        </StaggerItem>

        <StaggerItem className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Mật khẩu
            </label>
            <Link to="/auth/forgot-password" className="text-xs font-semibold text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="pl-10" 
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
          {loading ? 'Đang xác thực...' : (
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
        <Button variant="outline" className="w-full h-12 flex items-center gap-2">
          {/* Note: Dummy Google logo in Lucide style doesn't exist natively, using generic logic */}
          <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
          Google
        </Button>
        <Button variant="outline" className="w-full h-12 flex items-center gap-2">
          <svg className="h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
          GitHub
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
