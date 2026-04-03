import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Fake signup delay
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
    }, 1500);
  };

  if (isSent) {
    return (
      <StaggerContainer className="text-center space-y-6">
        <StaggerItem className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8" />
        </StaggerItem>
        <StaggerItem>
          <h2 className="text-3xl font-bold tracking-tight">Kiểm tra email của bạn</h2>
        <p className="text-muted-foreground text-sm">
          Chúng tôi đã gửi một liên kết khôi phục mật khẩu vào hòm thư của bạn. Vui lòng làm theo hướng dẫn trong email.
        </p>
        </StaggerItem>
        <StaggerItem>
        <Button 
          variant="outline" 
          className="w-full h-12 mt-6"
          onClick={() => navigate('/auth/login')}
        >
          Trở về trang đăng nhập
        </Button>
        </StaggerItem>
      </StaggerContainer>
    );
  }

  return (
    <StaggerContainer>
      <StaggerItem className="text-center md:text-left mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Khôi phục mật khẩu</h2>
        <p className="text-muted-foreground text-sm">
          Đừng lo, chúng tôi sẽ giúp bạn lấy lại quyền truy cập ngay
        </p>
      </StaggerItem>

      <form onSubmit={handleSubmit} className="space-y-4">
        <StaggerItem className="space-y-2 relative">
          <label className="text-sm font-medium leading-none">
            Email đã đăng ký
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

        <StaggerItem>
        <Button 
          type="submit" 
          disabled={loading}
          variant="udemy_dark" 
          className="w-full mt-6 py-6 text-md flex items-center gap-2"
        >
          {loading ? 'Đang gửi yêu cầu...' : (
            <>
              Gửi liên kết khôi phục
            </>
          )}
        </Button>
        </StaggerItem>
      </form>

      <StaggerItem className="mt-8 flex justify-center text-sm">
        <Link to="/auth/login" className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Quay lại trang đăng nhập
        </Link>
      </StaggerItem>
    </StaggerContainer>
  );
}
