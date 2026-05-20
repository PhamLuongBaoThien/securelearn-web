import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft, KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useForgotPassword, useVerifyOTP, useResetPassword } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function ForgotPassword() {
  const navigate = useNavigate();
  // State quản lý bước hiện tại:
  // 1 = Nhập Email
  // 2 = Nhập OTP
  // 3 = Đặt lại mật khẩu (Sau khi OTP đúng)
  // 4 = Thành công
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Data State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Call API Hooks
  const forgotPasswordMutation = useForgotPassword();
  const verifyOTPMutation = useVerifyOTP();
  const resetPasswordMutation = useResetPassword();

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }
    
    forgotPasswordMutation.mutate({ email }, {
      onSuccess: () => {
        toast.success(`Đã gửi OTP đến email ${email}. Vui lòng kiểm tra hộp thư.`);
        setStep(2); // Chuyển sang bước 2: nhập OTP
      },
      onError: (err: unknown) => {
        toast.error((err as Error).message || 'Lỗi gửi yêu cầu.');
      }
    });
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Vui lòng nhập đúng 6 số OTP');
      return;
    }

    verifyOTPMutation.mutate({ email, otp }, {
      onSuccess: () => {
        toast.success('Mã OTP chính xác. Vui lòng tạo mật khẩu mới.');
        setStep(3); // Đúng OTP thì tới bước 3
      },
      onError: (err: unknown) => {
        toast.error((err as Error).message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    resetPasswordMutation.mutate({
      email,
      otp, // Dùng lại OTP đã nhập xác thực ở step 3
      newPassword
    }, {
      onSuccess: () => {
        toast.success('Lấy lại mật khẩu thành công!');
        setStep(4); // Bước 4: thành công
      },
      onError: (err: unknown) => {
        // Trường hợp API lỗi, quay trở lại bước 2 để nhập OTP lấy lại từ đầu
        toast.error((err as Error).message || 'Lỗi hệ thống, vui lòng thử lại.');
      }
    });
  };

  return (
    <StaggerContainer key={step}>
      {/* ===== STEP 1: NHẬP EMAIL ===== */}
      {step === 1 && (
        <>
          <StaggerItem className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Khôi phục mật khẩu</h2>
            <p className="text-muted-foreground text-sm">
              Đừng lo, chúng tôi sẽ giúp bạn lấy lại quyền truy cập ngay
            </p>
          </StaggerItem>

          <form onSubmit={handleSendEmail} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={forgotPasswordMutation.isPending}
                />
              </div>
            </StaggerItem>

            <StaggerItem>
              <Button 
                type="submit" 
                disabled={forgotPasswordMutation.isPending}
                variant="udemy_dark" 
                className="w-full mt-6 py-6 text-md flex items-center gap-2"
              >
                {forgotPasswordMutation.isPending ? 'Đang gửi yêu cầu...' : 'Gửi liên kết khôi phục'}
              </Button>
            </StaggerItem>
          </form>

          <StaggerItem className="mt-8 flex justify-center text-sm">
            <Link to="/auth/login" className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Quay lại trang đăng nhập
            </Link>
          </StaggerItem>
        </>
      )}

      {/* ===== STEP 2: KIỂM TRA MÃ OTP ===== */}
      {step === 2 && (
        <>
          <StaggerItem className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Nhập mã xác nhận</h2>
            <p className="text-muted-foreground text-sm">
              Mã xác nhận (OTP) gồm 6 chữ số đã được gửi đến: <br/> <strong>{email}</strong>
            </p>
          </StaggerItem>

          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <StaggerItem className="space-y-2 relative">
              <label className="text-sm font-medium leading-none">
                Mã OTP (6 chữ số)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Ví dụ: 123456" 
                  className="pl-10 h-10 tracking-widest font-semibold text-center"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Chỉ cho nhập số
                  disabled={verifyOTPMutation.isPending}
                />
              </div>
            </StaggerItem>

            <StaggerItem>
              <Button 
                type="submit" 
                disabled={verifyOTPMutation.isPending || otp.length !== 6}
                variant="udemy_dark" 
                className="w-full mt-6 py-6 text-md flex items-center gap-2"
              >
                {verifyOTPMutation.isPending ? 'Đang kiểm tra...' : 'Xác thực OTP'}
              </Button>
            </StaggerItem>
          </form>

          <StaggerItem className="mt-8 flex justify-center text-sm">
            <button 
              type="button"
              onClick={() => setStep(1)} 
              className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Đổi email nhận mã
            </button>
          </StaggerItem>
        </>
      )}

      {/* ===== STEP 3: ĐẶT MẬT KHẨU MỚI ===== */}
      {step === 3 && (
        <>
          <StaggerItem className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Tạo mật khẩu mới</h2>
            <p className="text-muted-foreground text-sm">
              Mã OTP đã hợp lệ. Vui lòng tạo mật khẩu mới an toàn.
            </p>
          </StaggerItem>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <StaggerItem className="space-y-2 relative">
              <label className="text-sm font-medium leading-none">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="Tối thiểu 6 ký tự" 
                  className="pl-10 h-10" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={resetPasswordMutation.isPending}
                />
              </div>
            </StaggerItem>
            
            <StaggerItem className="space-y-2 relative pt-2">
              <label className="text-sm font-medium leading-none">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="Nhập lại mật khẩu mới" 
                  className="pl-10 h-10" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={resetPasswordMutation.isPending}
                />
              </div>
            </StaggerItem>

            <StaggerItem>
              <Button 
                type="submit" 
                disabled={resetPasswordMutation.isPending}
                variant="udemy_dark" 
                className="w-full mt-6 py-6 text-md flex items-center gap-2"
              >
                {resetPasswordMutation.isPending ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu mới'}
              </Button>
            </StaggerItem>
          </form>
        </>
      )}

      {/* ===== STEP 4: THÀNH CÔNG ===== */}
      {step === 4 && (
        <div className="text-center space-y-6">
          <StaggerItem className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </StaggerItem>
          <StaggerItem>
            <h2 className="text-3xl font-bold tracking-tight">Thành công!</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Mật khẩu của bạn đã được thay đổi thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
            </p>
          </StaggerItem>
          <StaggerItem>
            <Button 
              variant="udemy_dark" 
              className="w-full h-12 mt-6 py-6 text-md"
              onClick={() => navigate('/auth/login')}
            >
              Trở về trang đăng nhập
            </Button>
          </StaggerItem>
        </div>
      )}
    </StaggerContainer>
  );
}
