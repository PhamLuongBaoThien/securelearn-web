import { Link } from 'react-router-dom';
import { Facebook, Twitter, Youtube, Github, Phone, Mail } from 'lucide-react';
import logo from '../../assets/logoweb.png';

export const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 pt-20 pb-8 px-6 text-sm mt-16 font-sans border-t border-zinc-800">
      <div className="max-w-[1340px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          <div className="lg:col-span-2 flex flex-col items-center gap-6">
             <Link to="/" className="inline-block">
               <img src={logo} alt="SecureLearn Logo" className="h-24 w-auto object-contain" />
             </Link>
             <div className="flex items-center gap-4 mt-2">
               <a href="#" className="p-2.5 bg-zinc-900 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors border border-zinc-800 hover:border-primary"><Facebook className="h-5 w-5" /></a>
               <a href="#" className="p-2.5 bg-zinc-900 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors border border-zinc-800 hover:border-primary"><Twitter className="h-5 w-5" /></a>
               <a href="#" className="p-2.5 bg-zinc-900 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors border border-zinc-800 hover:border-primary"><Youtube className="h-5 w-5" /></a>
               <a href="#" className="p-2.5 bg-zinc-900 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors border border-zinc-800 hover:border-primary"><Github className="h-5 w-5" /></a>
             </div>
             <p className="text-zinc-400 leading-relaxed max-w-sm">
               Nền tảng học trực tuyến hàng đầu tích hợp công nghệ bảo vệ bản quyền số DRM và kiến trúc phân tán Microservices, mang lại trải nghiệm an toàn và tốc độ nhanh nhất.
             </p>
             
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-base mb-2">SecureLearn</h4>
            <Link to="/about" className="hover:text-white transition-colors">Giới thiệu</Link>
            <Link to="/careers" className="hover:text-white transition-colors">Tuyển dụng</Link>
            <Link to="/blog" className="hover:text-white transition-colors">Tin tức & Blog</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Liên hệ</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-base mb-2">Hệ sinh thái</h4>
            <Link to="/courses" className="hover:text-white transition-colors">Khám phá khóa học</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Gói Hội viên</Link>
            <Link to="/teach" className="hover:text-white transition-colors">Trở thành Giảng viên</Link>
            <Link to="/business" className="hover:text-white transition-colors">Dành cho Doanh nghiệp</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-base mb-2">Hỗ trợ</h4>
            <Link to="/help" className="hover:text-white transition-colors">Trung tâm trợ giúp</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Điều khoản sử dụng</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
            <Link to="/sitemap" className="hover:text-white transition-colors">Sơ đồ trang web</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-base mb-2">Liên hệ nhanh</h4>
            <a href="tel:19001234" className="hover:text-white transition-colors flex items-center gap-2 w-fit">
              <Phone className="h-4 w-4" /> +84 343613222
            </a>
            <a href="mailto:plbthien2004@gmail.com" className="hover:text-white transition-colors flex items-center gap-2 w-fit">
              <Mail className="h-4 w-4" /> plbthien2004@gmail.com
            </a>
            <a href="mailto:thienb2204969@ctu.edu.vn" className="hover:text-white transition-colors flex items-center gap-2 w-fit">
              <Mail className="h-4 w-4" /> thienb2204969@ctu.edu.vn
            </a>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-800">
          <div className="text-zinc-500 text-xs text-center md:text-left mb-4 md:mb-0 flex items-center gap-2">
            © {new Date().getFullYear()} SecureLearn. Được phát triển bởi sinh viên CTU.
          </div>
          <div className="flex gap-6 text-xs text-zinc-500">
             <Link to="/terms" className="hover:text-zinc-300 transition-colors">Điều khoản</Link>
             <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Bảo mật</Link>
             <Link to="/cookie-settings" className="hover:text-zinc-300 transition-colors">Cài đặt Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
