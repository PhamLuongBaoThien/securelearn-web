import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Input } from '@/components/ui/input';
import { Lock, Mail, User, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRegister, useVerifyRegistration } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function Signup() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const verifyMutation = useVerifyRegistration();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!countdown) return;
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const requestOtp = () => {
    const trimmedName = fullName.trim().normalize('NFC');
    if (!trimmedName) return toast.error('Vui lòng nhập họ và tên.');
    if (trimmedName.length < 2) return toast.error('Họ và tên phải có tối thiểu 2 ký tự.');
    if (/\d/.test(trimmedName)) return toast.error('Họ và tên không được chứa số.');

    if (!email.trim()) return toast.error('Vui lòng nhập email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Email không đúng định dạng.');

    if (!password) return toast.error('Vui lòng nhập mật khẩu.');
    if (password.length < 6) return toast.error('Mật khẩu phải có tối thiểu 6 ký tự.');
    if (password !== confirmPassword) return toast.error('Mật khẩu nhập lại không khớp.');

    registerMutation.mutate({ fullName: trimmedName, email, password, confirmPassword }, {
      onSuccess: (response) => { toast.success(response.message); setStep('otp'); setCountdown(30); },
      onError: (error) => toast.error(error.message),
    });
  };

  const verify = () => {
    if (!/^\d{6}$/.test(otp)) return toast.error('OTP phải gồm 6 chữ số.');
    verifyMutation.mutate({ email, otp }, {
      onSuccess: (response) => { toast.success(response.message); navigate('/auth/login', { replace: true }); },
      onError: (error) => toast.error(error.message),
    });
  };

  const pending = registerMutation.isPending || verifyMutation.isPending;

  return (
    <StaggerContainer key={step}>
      {step === 'form' ? (
        <>
          <StaggerItem className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Đăng ký thành viên</h2>
            <p className="text-muted-foreground text-sm">Tạo tài khoản SecureLearn của bạn</p>
          </StaggerItem>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); requestOtp(); }}>
            <StaggerItem className="space-y-2 relative">
              <label className="text-sm font-medium leading-none">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" className="pl-10 h-10" disabled={pending} />
              </div>
            </StaggerItem>
            <StaggerItem className="space-y-2 relative">
              <label className="text-sm font-medium leading-none">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="pl-10 h-10" disabled={pending} />
              </div>
            </StaggerItem>
            <StaggerItem className="space-y-2 relative">
              <label className="text-sm font-medium leading-none">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="Tối thiểu 6 ký tự" className="pl-10 h-10" disabled={pending} />
              </div>
            </StaggerItem>
            <StaggerItem className="space-y-2 relative">
              <label className="text-sm font-medium leading-none">Nhập lại mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} placeholder="Nhập lại mật khẩu" className="pl-10 h-10" disabled={pending} />
              </div>
            </StaggerItem>
            <StaggerItem>
              <Button className="w-full mt-6 py-6 text-md flex items-center gap-2" variant="udemy_dark" disabled={pending}>
                Gửi mã xác nhận <UserPlus className="ml-2 h-4 w-4" />
              </Button>
            </StaggerItem>
          </form>

          <StaggerItem className="mt-8 flex justify-center text-sm">
            <p>Đã có tài khoản? <Link className="font-semibold underline" to="/auth/login">Đăng nhập</Link></p>
          </StaggerItem>
        </>
      ) : (
        <>
          <StaggerItem className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Nhập mã xác nhận</h2>
            <p className="text-muted-foreground text-sm">
              Mã xác nhận (OTP) gồm 6 chữ số đã được gửi đến: <br/> <strong>{email}</strong>
            </p>
          </StaggerItem>

          <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="space-y-4">
            <StaggerItem className="space-y-2 relative">
              <label className="text-sm font-medium leading-none">Mã OTP (6 chữ số)</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ví dụ: 123456"
                  className="pl-10 h-10 tracking-widest font-semibold text-center"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  disabled={verifyMutation.isPending}
                />
              </div>
            </StaggerItem>

            <StaggerItem>
              <Button
                type="submit"
                disabled={pending || otp.length !== 6}
                variant="udemy_dark"
                className="w-full mt-6 py-6 text-md flex items-center gap-2"
              >
                {verifyMutation.isPending ? 'Đang kiểm tra...' : 'Xác nhận và tạo tài khoản'}
              </Button>
            </StaggerItem>
          </form>

          <StaggerItem className="mt-8 flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('form')}
              className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors h-auto p-0 focus-visible:ring-0"
            >
              <ArrowLeft className="h-4 w-4" /> Sửa thông tin
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={countdown > 0 || pending}
              onClick={requestOtp}
              className="font-medium text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors h-auto p-0 focus-visible:ring-0 disabled:opacity-50"
            >
              {countdown ? `Gửi lại sau ${countdown}s` : 'Gửi lại OTP'}
            </Button>
          </StaggerItem>
        </>
      )}
    </StaggerContainer>
  );
}