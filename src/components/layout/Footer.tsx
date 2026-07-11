import { Link } from 'react-router-dom';
import { Facebook, Github, Linkedin, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { usePublicWebsiteConfig, WEBSITE_CONFIG_FALLBACK } from '@/hooks/useWebsiteConfig';
import { BrandLogo } from '@/components/branding/BrandLogo';

const socialClass = 'p-2.5 bg-zinc-900 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors border border-zinc-800 hover:border-primary';
const safeExternal = (url?: string) => url && url.startsWith('https://') ? url : undefined;

export const Footer = () => {
  const { data } = usePublicWebsiteConfig();
  const config = data || WEBSITE_CONFIG_FALLBACK;
  const phone = config.contactPhone || WEBSITE_CONFIG_FALLBACK.contactPhone;
  const email = config.contactEmail || WEBSITE_CONFIG_FALLBACK.contactEmail;
  const address = config.address;
  const facebookUrl = safeExternal(config.facebookUrl);
  const youtubeUrl = safeExternal(config.youtubeUrl);
  const githubUrl = safeExternal(config.githubUrl);
  const linkedinUrl = safeExternal(config.linkedinUrl);

  return (
    <footer className="bg-zinc-950 text-zinc-400 pt-20 pb-8 px-6 text-sm mt-16 font-sans border-t border-zinc-800">
      <div className="max-w-[1340px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          <div className="lg:col-span-2 flex flex-col items-center gap-6">
             <Link to="/" className="inline-block">
               <BrandLogo className="h-24 w-auto object-contain" />
             </Link>
             <div className="flex items-center gap-4 mt-2">
               <a href={facebookUrl || '#'} target={facebookUrl ? '_blank' : undefined} rel={facebookUrl ? 'noopener noreferrer' : undefined} aria-label="Facebook" className={`${socialClass} ${!facebookUrl ? 'pointer-events-none opacity-50' : ''}`}><Facebook className="h-5 w-5" /></a>
               <a href={youtubeUrl || '#'} target={youtubeUrl ? '_blank' : undefined} rel={youtubeUrl ? 'noopener noreferrer' : undefined} aria-label="YouTube" className={`${socialClass} ${!youtubeUrl ? 'pointer-events-none opacity-50' : ''}`}><Youtube className="h-5 w-5" /></a>
               <a href={githubUrl || '#'} target={githubUrl ? '_blank' : undefined} rel={githubUrl ? 'noopener noreferrer' : undefined} aria-label="GitHub" className={`${socialClass} ${!githubUrl ? 'pointer-events-none opacity-50' : ''}`}><Github className="h-5 w-5" /></a>
               <a href={linkedinUrl || '#'} target={linkedinUrl ? '_blank' : undefined} rel={linkedinUrl ? 'noopener noreferrer' : undefined} aria-label="LinkedIn" className={`${socialClass} ${!linkedinUrl ? 'pointer-events-none opacity-50' : ''}`}><Linkedin className="h-5 w-5" /></a>
             </div>
             <p className="text-zinc-400 leading-relaxed max-w-sm">
               Nền tảng học trực tuyến an toàn và bảo mật, hỗ trợ bảo vệ bản quyền nội dung và mang lại trải nghiệm học tập mượt mà, nhanh chóng.
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
            <Link to="/policies" className="hover:text-white transition-colors">Chính sách & Điều khoản</Link>
            <Link to="/sitemap" className="hover:text-white transition-colors">Sơ đồ trang web</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold text-base mb-2">Liên hệ nhanh</h4>
            {phone && <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors flex items-center gap-2 w-fit"><Phone className="h-4 w-4" /> {phone}</a>}
            {email && <a href={`mailto:${email}`} className="hover:text-white transition-colors flex items-center gap-2 w-fit"><Mail className="h-4 w-4" /> {email}</a>}
            {address && <p className="flex items-start gap-2 text-zinc-400"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> <span>{address}</span></p>}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-800">
          <div className="text-zinc-500 text-xs text-center md:text-left mb-4 md:mb-0 flex items-center gap-2">
            © {new Date().getFullYear()} SecureLearn. Được phát triển bởi sinh viên CTU.
          </div>
          <div className="flex gap-6 text-xs text-zinc-500">
             <Link to="/policies" className="hover:text-zinc-300 transition-colors">Điều khoản</Link>
             <Link to="/policies" className="hover:text-zinc-300 transition-colors">Bảo mật</Link>
             <Link to="/cookie-settings" className="hover:text-zinc-300 transition-colors">Cài đặt Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
