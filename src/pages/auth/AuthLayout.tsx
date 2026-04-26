import { Outlet, Link } from 'react-router-dom';
import { FadeIn } from '@/components/animations/FadeIn';
import brandLogo from '@/assets/logoweb.png';

export function AuthLayout() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* Left side - Branding / Image */}
      <FadeIn direction="right" distance={40} className="hidden md:flex flex-col items-center justify-center p-10 bg-zinc-950 text-white relative overflow-hidden h-full">
        
        {/* Decorative elements - Glowing Orbs & Grid */} 
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* 
          HIỆU ỨNG LƯỚI CARO (GEOMETRIC GRID PATTERN) BẰNG CSS THUẦN
          - bg-[linear-gradient...]: Vẽ các nét ngang và dọc (mỏng 1px, màu trắng mờ 3%).
          - bg-[size:40px_40px]: Bắt buộc 2 nét này lặp lại liên tục mỗi 40px, đan chéo nhau tạo thành các ô vuông caro.
          - mask-image: radial-gradient(...): Tạo mặt nạ hình tròn. Ở tâm (40%) hiển thị rõ nhất, càng ra rìa (đến 80%) càng mờ dần thành trong suốt, tạo cảm giác không gian sâu thẳm.
        */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>

        {/* Center Content */}
        <Link to="/" className="relative z-10 flex flex-col items-center group cursor-pointer">
          <div className="relative flex items-center justify-center w-40 h-40 mb-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-white/10 group-hover:shadow-primary/20">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent rounded-[2.5rem] opacity-50"></div>
            <img 
              src={brandLogo} 
              alt="SecureLearn Logo" 
              className="w-28 h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105"
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white drop-shadow-md">
            SecureLearn
          </h1>
          <p className="text-zinc-400 text-center max-w-md text-[15px] leading-relaxed">
            Học tập không giới hạn.<br/>Trải nghiệm an toàn, bảo vệ bản quyền nội dung.
          </p>
        </Link>
      </FadeIn>

      {/* Right side - Form Portal */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 relative min-h-screen md:min-h-0">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="md:hidden flex flex-col items-center w-full max-w-md mb-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-primary/10 rounded-xl">
              <img 
                src={brandLogo} 
                alt="SecureLearn Logo" 
                className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              SecureLearn
            </span>
          </Link>
        </div>

        <FadeIn direction="up" distance={30} delay={0.2} className="w-full max-w-md space-y-8">
          <Outlet />
        </FadeIn>
      </div>
    </div>
  );
}
