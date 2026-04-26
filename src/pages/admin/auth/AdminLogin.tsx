import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useAdminLogin } from '@/hooks/useAdminAuth';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import brandLogo from '@/assets/logoweb.png';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.adminAuth);
  const loginMutation = useAdminLogin();

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Hiển thị toast khi có error từ backend
  useEffect(() => {
    if (loginMutation.error) {
      toast.error(loginMutation.error.message);
    }
  }, [loginMutation.error]);

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Vui lòng nhập admin email');
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError('Email không đúng định dạng');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          navigate('/admin/dashboard', { replace: true });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex flex-col justify-center items-center p-4 selection:bg-primary/30 transition-colors duration-300">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/10 blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl mb-6 shadow-xl dark:shadow-2xl transition-colors">
            <img src={brandLogo} alt="SecureLearn Admin" className="w-10 h-10 object-contain drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight transition-colors">Cổng Quản Trị Hệ Thống</h1>
          <p className="text-zinc-500 dark:text-zinc-400 transition-colors">Chỉ dành cho nhân sự được cấp phép</p>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl transition-colors">


          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className={`text-sm font-medium ${emailError ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'} ml-1 transition-colors`}>Địa chỉ Email</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${emailError ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500 group-focus-within:text-primary'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  className={`w-full bg-zinc-50 dark:bg-zinc-950/50 border ${emailError ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-zinc-300 dark:border-zinc-800 focus:ring-primary/50 focus:border-primary'} text-zinc-900 dark:text-white text-sm rounded-2xl focus:ring-2 block p-3.5 pl-11 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none`}
                  placeholder="admin@securelearn.com"
                  required
                />
              </div>
              {emailError && <p className="text-xs text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{emailError}</p>}
            </div>

            <div className="space-y-1.5">
              <label className={`text-sm font-medium ${passwordError ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'} ml-1 transition-colors`}>Mật khẩu</label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${passwordError ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500 group-focus-within:text-primary'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  className={`w-full bg-zinc-50 dark:bg-zinc-950/50 border ${passwordError ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-zinc-300 dark:border-zinc-800 focus:ring-primary/50 focus:border-primary'} text-zinc-900 dark:text-white text-sm rounded-2xl focus:ring-2 block p-3.5 pl-11 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {passwordError && <p className="text-xs text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{passwordError}</p>}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-2xl text-sm px-5 py-4 text-center transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    Đăng nhập hạng quản trị viên
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
            </Button>
          </form>
        </div>
        
        <div className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-600 flex flex-col items-center gap-2 transition-colors">
          <p>© {new Date().getFullYear()} Nền tảng quản trị SecureLearn.</p>
          <p>Mọi hoạt động truy cập đều được giám sát nghiêm ngặt.</p>
        </div>
      </div>
    </div>
  );
};
