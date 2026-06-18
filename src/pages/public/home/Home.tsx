import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { HorizontalStaggerContainer, HorizontalStaggerItem } from '@/components/animations/HorizontalStagger';
import { SectionReveal, SectionSequence, SectionSequenceItem } from '@/components/animations/SectionReveal';
import { CourseCarousel } from '@/components/ui/CourseCarousel';
import { buttonVariants } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CopyrightIllustration = () => (
  <svg className="h-20 w-20 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="docGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#818CF8" />
      </linearGradient>
      <linearGradient id="shieldGrad" x1="10" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="laserGrad" x1="10" y1="50" x2="90" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F43F5E" stopOpacity="0" />
        <stop offset="50%" stopColor="#F43F5E" stopOpacity="1" />
        <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
      </linearGradient>
    </defs>
    
    {/* Vòng tròn quỹ đạo quét bảo mật ở hậu cảnh */}
    <circle cx="50" cy="50" r="42" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 6" />
    <circle cx="50" cy="50" r="35" stroke="url(#shieldGrad)" strokeWidth="1.5" strokeDasharray="10 5" opacity="0.3" />

    {/* Tài liệu bản quyền (Document) phối cảnh nghiêng */}
    <g transform="translate(10, 10)">
      {/* Tài liệu bóng đổ */}
      <rect x="23" y="13" width="34" height="46" rx="3" fill="#000" fillOpacity="0.05" />
      {/* Tài liệu chính */}
      <rect x="20" y="10" width="34" height="46" rx="3" fill="white" stroke="url(#docGrad)" strokeWidth="2.5" />
      {/* Góc gấp tài liệu */}
      <path d="M46 10H54V18H46V10Z" fill="#EEF2F6" />
      <path d="M46 18L54 18L46 10V18Z" fill="url(#docGrad)" />
      {/* Các dòng text tượng trưng */}
      <line x1="26" y1="24" x2="44" y2="24" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26" y1="32" x2="38" y2="32" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26" y1="40" x2="48" y2="40" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
      {/* Ký hiệu chữ C Bản Quyền ở góc tài liệu */}
      <circle cx="43" cy="48" r="5" stroke="url(#docGrad)" strokeWidth="1.5" />
      <path d="M44.5 46.5A2 2 0 1 0 44.5 49.5" stroke="url(#docGrad)" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Khiên Hologram bảo vệ ở tiền cảnh, che phủ một phần tài liệu */}
    <path d="M50 78C50 78 80 64 80 38V20L50 8L20 20V38C20 64 50 78 50 78Z" fill="url(#shieldGrad)" fillOpacity="0.15" stroke="url(#shieldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

    {/* Đường Laser Quét Bảo Mật thời gian thực nằm ngang qua khiên */}
    <line x1="15" y1="46" x2="85" y2="46" stroke="url(#laserGrad)" strokeWidth="3" strokeLinecap="round" />
    {/* Điểm phát sáng laser ở hai đầu */}
    <circle cx="16" cy="46" r="2" fill="#F43F5E" />
    <circle cx="84" cy="46" r="2" fill="#F43F5E" />
  </svg>
);

const FastLearningIllustration = () => (
  <svg className="h-20 w-20 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="laptopGrad" x1="10" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="speedGrad" x1="20" y1="20" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    {/* Laptop thân dưới */}
    <path d="M15 68H85L88 74H12L15 68Z" fill="#E5E7EB" stroke="url(#laptopGrad)" strokeWidth="2" />
    <path d="M45 74H55" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
    {/* Màn hình laptop */}
    <rect x="22" y="22" width="56" height="42" rx="4" fill="url(#laptopGrad)" fillOpacity="0.1" stroke="url(#laptopGrad)" strokeWidth="2" />
    {/* Nút Play phát sóng */}
    <polygon points="45,35 63,43 45,51" fill="url(#laptopGrad)" />
    {/* Các tia sét/sóng tốc độ mượt mà bay ra khỏi màn hình */}
    <path d="M10 30L25 35L20 42" stroke="url(#speedGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M90 45L75 50L80 57" stroke="url(#speedGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Ngôi sao lấp lánh */}
    <path d="M30 15L32 20L37 22L32 24L30 29L28 24L23 22L28 20L30 15Z" fill="#F59E0B" opacity="0.8" />
    <path d="M72 12L73 15L76 16L73 17L72 20L71 17L68 16L71 15L72 12Z" fill="#F59E0B" opacity="0.8" />
  </svg>
);

const PaymentIllustration = () => (
  <svg className="h-20 w-20 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cardGrad" x1="10" y1="30" x2="80" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
      <linearGradient id="coinGrad" x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Thẻ tín dụng phía sau */}
    <rect x="25" y="20" width="50" height="32" rx="4" fill="url(#cardGrad)" fillOpacity="0.2" stroke="url(#cardGrad)" strokeWidth="2" transform="rotate(-8 50 36)" />
    <line x1="28" y1="28" x2="72" y2="22" stroke="url(#cardGrad)" strokeWidth="6" />
    
    {/* Thẻ tín dụng phía trước bay phối cảnh */}
    <rect x="18" y="38" width="52" height="34" rx="5" fill="white" stroke="url(#cardGrad)" strokeWidth="2.5" />
    <rect x="18" y="44" width="52" height="8" fill="url(#cardGrad)" />
    <rect x="24" y="58" width="10" height="7" rx="1" fill="#F59E0B" />
    <circle cx="58" cy="61" r="4" fill="#EF4444" fillOpacity="0.8" />
    <circle cx="63" cy="61" r="4" fill="#F59E0B" fillOpacity="0.8" />

    {/* Các đồng xu vàng lơ lửng */}
    <circle cx="82" cy="55" r="7" fill="url(#coinGrad)" stroke="#F59E0B" strokeWidth="1" />
    <path d="M82 51V59M80 53H84M80 57H84" stroke="white" strokeWidth="1" />
    
    <circle cx="12" cy="65" r="5" fill="url(#coinGrad)" stroke="#F59E0B" strokeWidth="1" />
    <circle cx="78" cy="22" r="4" fill="url(#coinGrad)" stroke="#F59E0B" strokeWidth="1" />
  </svg>
);

const TrustIllustration = () => (
  <svg className="h-20 w-20 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heartGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="checkGrad" x1="30" y1="35" x2="70" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Trái tim / Khiên lớn cách điệu */}
    <path d="M50 82C50 82 82 60 82 38C82 23.5 70.5 15 58 15C50 15 45 20 43 22C41 20 36 15 28 15C15.5 15 4 23.5 4 38C4 60 36 82 50 82Z" fill="url(#heartGrad)" fillOpacity="0.1" stroke="url(#heartGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Các vòng tròn sóng bảo mật */}
    <path d="M22 35C22 20 35 18 50 18" stroke="url(#heartGrad)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
    <path d="M78 35C78 20 65 18 50 18" stroke="url(#heartGrad)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />

    {/* Quả cầu hoặc huy hiệu bảo mật hình tròn nổi bật */}
    <circle cx="50" cy="46" r="20" fill="white" stroke="url(#heartGrad)" strokeWidth="2.5" />
    
    {/* Dấu check an toàn màu xanh lục */}
    <path d="M40 46L47 53L60 38" stroke="url(#checkGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

    {/* Dải ruy băng/lá chắn phía dưới */}
    <path d="M25 65C35 72 65 72 75 65" stroke="url(#heartGrad)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
  </svg>
);

const bannerSlides = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000',
    title: 'Học tập không giới hạn',
    subtitle: 'Kỹ năng cho hiện tại và tương lai của bạn. Bắt đầu cùng chúng tôi.',
    link: '/courses',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=2000',
    title: 'Lập trình thực chiến',
    subtitle: 'Hàng trăm khóa học từ cơ bản đến nâng cao, do chuyên gia hàng đầu giảng dạy.',
    link: '/category/development',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000',
    title: 'An toàn thông tin',
    subtitle: 'Nắm vững Cybersecurity với lộ trình bài bản và chứng chỉ quốc tế.',
    link: '/category/it-software',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=2000',
    title: 'Công nghệ AI & Machine Learning',
    subtitle: 'Khám phá trí tuệ nhân tạo và ứng dụng vào thực tế ngay hôm nay.',
    link: '/category/development',
  },
];
import type { ICourse } from '@/services/courseApi';

const mockCourses: Partial<ICourse>[] = [
  { _id: '1', slug: '1', title: '100 Days of Code: The Complete Python Pro Bootcamp', instructorName: 'Dr. Angela Yu', rating: 4.7, reviews: 295000, price: 349000, originalPrice: 1999000, thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=500&q=80', badge: 'Bestseller' },
  { _id: '2', slug: '2', title: 'The Complete Python Bootcamp From Zero to Hero in Python', instructorName: 'Jose Portilla', rating: 4.6, reviews: 480000, price: 329000, originalPrice: 2490000, thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=500&q=80', badge: 'Bestseller' },
  { _id: '3', slug: '3', title: 'Python for Data Science and Machine Learning', instructorName: 'Jose Portilla', rating: 4.6, reviews: 135000, price: 429000, originalPrice: 2690000, thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80' },
  { _id: '4', slug: '4', title: 'Python Mega Course: Learn Python in 60 Days', instructorName: 'Ardit Sulce', rating: 4.7, reviews: 68000, price: 349000, originalPrice: 1999000, thumbnail: 'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?auto=format&fit=crop&w=500&q=80' },
  { _id: '5', slug: '5', title: 'Automate the Boring Stuff with Python', instructorName: 'Al Sweigart', rating: 4.6, reviews: 108000, price: 299000, originalPrice: 1290000, thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=500&q=80' },
];

const SLIDE_INTERVAL = 5000; // 5 giây mỗi slide

const PARTNER_LOGOS = [
  { id: 'ctu', node: <div className="text-2xl md:text-3xl font-black tracking-widest text-blue-700 select-none">CTU</div> },
  { id: 'ctump', node: <div className="text-2xl md:text-3xl font-black tracking-widest text-teal-600 select-none">CTUMP</div> },
  { id: 'vnpay', node: <div className="text-xl md:text-2xl font-black tracking-tight select-none"><span className="text-red-600">VN</span><span className="text-blue-800">PAY</span></div> },
  { id: 'momo', node: <div className="text-2xl md:text-3xl font-bold lowercase tracking-tighter text-pink-600 select-none">momo</div> },
  { id: 'google', node: <div className="text-xl md:text-2xl font-black tracking-tighter select-none">Google</div> }
];

const PartnerSlider = () => {
  const N = PARTNER_LOGOS.length;
  const [currentIndex, setCurrentIndex] = useState(N);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const transitionSpeed = 700;
  const autoPlayDelay = 3000;

  // Render 2 bộ logo nối tiếp để hỗ trợ trượt sang phải
  const extendedLogos = [...PARTNER_LOGOS, ...PARTNER_LOGOS];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
    }, autoPlayDelay);

    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (currentIndex === 0) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(N);
      }, transitionSpeed);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, N]);

  return (
    <div 
      className="relative w-full overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Fading Edge Overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-28 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-28 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div 
        className={`flex items-center ${
          isTransitioning ? 'transition-transform duration-700 ease-in-out' : 'transition-none'
        }`}
        style={{
          transform: `translateX(calc(-${currentIndex} * 100% / var(--partner-visible)))`,
        }}
      >
        {extendedLogos.map((logo, idx) => (
          <div key={`${logo.id}-${idx}`} className="partner-slider-item">
            <div className="opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-300 transform hover:scale-105 py-2">
              {logo.node}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  }, []);

  // Auto slide
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <>
      {/* Hero Banner Slider */}
      <section
        className="relative w-full h-screen -mt-[90px] z-0 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative w-full h-full">
          {/* Slides */}
          {bannerSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${
                  index === currentSlide ? 'scale-110' : 'scale-100'
                }`}
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          ))}

          {/* Text Content */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-[90px] max-w-[1440px] mx-auto w-full pointer-events-none">
            <SectionSequence key={currentSlide} className="max-w-2xl pointer-events-auto">
              <SectionSequenceItem>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-xl">
                  {bannerSlides[currentSlide].title}
                </h1>
              </SectionSequenceItem>
              <SectionSequenceItem>
                <p className="text-white/90 text-lg sm:text-xl md:text-2xl mb-8 drop-shadow-md">
                  {bannerSlides[currentSlide].subtitle}
                </p>
              </SectionSequenceItem>
              <SectionSequenceItem>
                <Link
                  to={bannerSlides[currentSlide].link}
                  className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-full hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] hover:scale-105"
                >
                  Khám phá ngay
                </Link>
              </SectionSequenceItem>
            </SectionSequence>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 hidden md:inline-flex p-3 rounded-full bg-black/30 text-white hover:bg-black/60 backdrop-blur-md transition-all hover:scale-110"
            aria-label="Slide trước"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 hidden md:inline-flex p-3 rounded-full bg-black/30 text-white hover:bg-black/60 backdrop-blur-md transition-all hover:scale-110"
            aria-label="Slide tiếp"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-white'
                    : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Đi đến slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

        {/* Dành cho bạn */}
        <section className="bg-secondary/10 px-6 overflow-hidden md:h-screen w-full flex items-center justify-center">
          <div className="max-w-[1340px] mx-auto">
            <SectionReveal>
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 font-sans tracking-tight">Hệ Sinh Thái Dành Cho Bạn</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Được thiết kế để mang lại trải nghiệm học tập hoàn hảo và bảo vệ tuyệt đối thành quả lao động của giảng viên.
                </p>
              </div>
            </SectionReveal>

            <HorizontalStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: CopyrightIllustration, title: "Bảo Vệ Bản Quyền", desc: "Nội dung khóa học luôn được an toàn, tự động ngăn chặn mọi hành vi sao chép hay quay lén trái phép." },
                { icon: FastLearningIllustration, title: "Học Tập Mượt Mà", desc: "Trải nghiệm xem video bài giảng với tốc độ cao, không giật lag kể cả khi có hàng ngàn người truy cập." },
                { icon: PaymentIllustration, title: "Thanh Toán Tiện Lợi", desc: "Đa dạng phương thức thanh toán an toàn, dễ dàng mua đứt từng khóa hoặc đăng ký học trọn gói theo tháng." },
                { icon: TrustIllustration, title: "An Tâm Tuyệt Đối", desc: "Hệ thống bảo mật thông tin chuẩn quốc tế, giúp bạn tập trung hoàn toàn vào việc giảng dạy và học tập." },
              ].map((feature, i) => (
                <HorizontalStaggerItem key={i}>
                  <div className="group h-full p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col items-center text-center">
                    <feature.icon />
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </HorizontalStaggerItem>
              ))}
            </HorizontalStaggerContainer>
          </div>
        </section>

        {/* Featured Courses */}
        <section className="px-6 py-20 max-w-[1340px] mx-auto">
          <SectionReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 font-sans tracking-tight">Khóa Học Nổi Bật</h2>
                <p className="text-lg md:text-xl text-muted-foreground">
                  Khám phá các khóa học được đánh giá cao nhất. Nâng cấp kỹ năng của bạn ngay hôm nay với lộ trình bài bản từ cơ bản đến chuyên sâu.
                </p>
              </div>
              <Link to="/courses" className={buttonVariants({ variant: 'outline', className: "rounded-full font-semibold px-8 shrink-0 border-primary/50 hover:bg-primary/5 hover:text-primary" })}>
                Xem tất cả
              </Link>
            </div>
          </SectionReveal>
          
          <SectionReveal delay={0.08}>
            {/* Category Tabs Array (Dễ dàng thay bằng dữ liệu API sau này) */}
            <div className="flex gap-8 mb-8 overflow-x-auto pb-1 scrollbar-hide border-b border-border/30">
              {[
                { id: 'all', name: 'Tất cả khóa học' },
                { id: 'programming', name: 'Lập trình Lõi' },
                { id: 'security', name: 'An toàn Thông tin' },
                { id: 'cloud', name: 'DevOps & Cloud' },
                { id: 'ai', name: 'Trí tuệ Nhân tạo' },
              ].map((cat, idx) => (
                <button 
                  key={cat.id}
                  className={`text-base font-bold pb-3 whitespace-nowrap border-b-2 transition-all ${
                    idx === 0 
                      ? 'text-primary border-primary' 
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            
            <div className="relative pt-4">
               {/* Background glowing effect */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />
               
               {/* Carousel Component */}
               <CourseCarousel courses={mockCourses as unknown as ICourse[]} />
            </div>
          </SectionReveal>
        </section>

        {/* CTA Section (Subscription Push) */}
        <section className="px-6 py-20 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 border-t border-border/30">
          <div className="max-w-[800px] mx-auto text-center">
            <SectionSequence>
              <SectionSequenceItem>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Học Tập Không Giới Hạn</h2>
              </SectionSequenceItem>
              <SectionSequenceItem>
                <p className="text-lg text-zinc-400 dark:text-zinc-600 mb-8">
                  Nâng cấp gói thuê bao ngay hôm nay để mở khóa toàn bộ hệ sinh thái khóa học. Tiết kiệm chi phí và chủ động định hình lộ trình phát triển của riêng bạn.
                </p>
              </SectionSequenceItem>
              <SectionSequenceItem>
                <Link to="/pricing" className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md">
                  Xem Bảng Giá Gói
                </Link>
              </SectionSequenceItem>
            </SectionSequence>
          </div>
        </section>

        {/* Partners & Integrations (Startup Friendly) */}
        <section className="pt-16 pb-0 max-w-[1340px] mx-auto mb-0 px-6">
          <SectionSequence className="text-center">
            <SectionSequenceItem>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-10">
                Đồng hành cùng các đối tác giáo dục và giải pháp công nghệ
              </p>
            </SectionSequenceItem>
            <SectionSequenceItem>
              <PartnerSlider />
            </SectionSequenceItem>
          </SectionSequence>
        </section>
    </>
  );
};
