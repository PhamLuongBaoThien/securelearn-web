import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-zinc-900 text-white pt-16 pb-8 px-6 text-sm mt-16 font-sans">
      <div className="max-w-[1340px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="flex flex-col gap-3">
            <Link to="/business" className="hover:underline text-zinc-300 hover:text-white transition-colors">SecureLearn Doanh nghiệp</Link>
            <Link to="/teach" className="hover:underline text-zinc-300 hover:text-white transition-colors">Giảng dạy trên SecureLearn</Link>
            <Link to="/app" className="hover:underline text-zinc-300 hover:text-white transition-colors">Tải ứng dụng</Link>
            <Link to="/about" className="hover:underline text-zinc-300 hover:text-white transition-colors">Về chúng tôi</Link>
            <Link to="/contact" className="hover:underline text-zinc-300 hover:text-white transition-colors">Liên hệ</Link>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/careers" className="hover:underline text-zinc-300 hover:text-white transition-colors">Tuyển dụng</Link>
            <Link to="/blog" className="hover:underline text-zinc-300 hover:text-white transition-colors">Blog</Link>
            <Link to="/help" className="hover:underline text-zinc-300 hover:text-white transition-colors">Trợ giúp và Hỗ trợ</Link>
            <Link to="/affiliate" className="hover:underline text-zinc-300 hover:text-white transition-colors">Tiếp thị liên kết</Link>
            <Link to="/investors" className="hover:underline text-zinc-300 hover:text-white transition-colors">Nhà đầu tư</Link>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/terms" className="hover:underline text-zinc-300 hover:text-white transition-colors">Điều khoản</Link>
            <Link to="/privacy" className="hover:underline text-zinc-300 hover:text-white transition-colors">Chính sách bảo mật</Link>
            <Link to="/cookie-settings" className="hover:underline text-zinc-300 hover:text-white transition-colors">Cài đặt Cookie</Link>
            <Link to="/sitemap" className="hover:underline text-zinc-300 hover:text-white transition-colors">Sơ đồ trang web</Link>
            <Link to="/accessibility" className="hover:underline text-zinc-300 hover:text-white transition-colors">Trợ năng</Link>
          </div>
          <div className="md:col-span-1 lg:col-span-2 flex justify-start lg:justify-end">
            <button className="flex items-center gap-2 border border-zinc-500 hover:border-white px-6 py-2 h-10 transition-colors">
              <Globe className="h-4 w-4" />
              <span>Tiếng Việt</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-800">
          <Link to="/" className="text-2xl font-extrabold tracking-tight mb-4 md:mb-0">
            SecureLearn
          </Link>
          <div className="text-zinc-400 text-xs text-center md:text-right">
            © {new Date().getFullYear()} SecureLearn, Inc.
          </div>
        </div>
      </div>
    </footer>
  );
};
