import { Outlet, Link } from 'react-router-dom';
import { FadeIn } from '@/components/animations/FadeIn';

export function AuthLayout() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* Left side - Branding / Image */}
      <FadeIn direction="right" distance={40} className="hidden md:flex flex-col justify-between p-10 bg-zinc-900 text-white relative overflow-hidden h-full">
        <div className="relative z-10">
          <Link to="/" className="text-3xl font-extrabold tracking-tight">SecureLearn.</Link>
          <p className="mt-4 text-zinc-400 text-lg max-w-md">
            Nền tảng học tập trực tuyến kết nối bạn với những kiến thức bảo mật và công nghệ hàng đầu, được bảo vệ bởi hệ thống DRM tiên tiến.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium italic">
              "Giao diện tinh gọn, tập trung hoàn toàn vào trải nghiệm học tập và bảo mật tuyệt đối nội dung của giảng viên."
            </p>
            <footer className="text-sm text-zinc-400">— SecureLearn Team</footer>
          </blockquote>
        </div>
      </FadeIn>

      {/* Right side - Form Portal */}
      <div className="flex items-center justify-center p-8 sm:p-12 relative">
        <FadeIn direction="up" distance={30} delay={0.2} className="w-full max-w-md space-y-8">
          <Outlet />
        </FadeIn>
      </div>
    </div>
  );
}
