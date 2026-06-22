import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { HorizontalStaggerContainer, HorizontalStaggerItem } from '@/components/animations/HorizontalStagger';
import { SectionReveal, SectionSequence, SectionSequenceItem } from '@/components/animations/SectionReveal';
import { CourseCarousel } from '@/components/ui/CourseCarousel';
import { buttonVariants } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CopyrightIllustration = () => (
  <svg className="h-20 w-20 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 text-zinc-400 dark:text-zinc-500 group-hover:text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Page border */}
    <path d="M30 15H65L75 25V85H30V15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Folded corner */}
    <path d="M65 15V25H75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Document lines */}
    <line x1="38" y1="35" x2="62" y2="35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="45" x2="54" y2="45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    
    {/* Shield outline */}
    <path d="M50 78C50 78 70 68 70 50V38L50 30L30 38V50C30 68 50 78 50 78Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Circular copyright mark inside shield */}
    <circle cx="50" cy="51" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M52 48.5A2.5 2.5 0 1 0 52 53.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const FastLearningIllustration = () => (
  <svg className="h-20 w-20 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1 text-zinc-400 dark:text-zinc-500 group-hover:text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Laptop screen */}
    <rect x="22" y="25" width="56" height="38" rx="4" stroke="currentColor" strokeWidth="1.5" />
    {/* Laptop base */}
    <path d="M15 63H85L88 70H12L15 63Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    
    {/* Play icon in the screen */}
    <polygon points="46,38 58,44 46,50" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    
    {/* Speed waves / wind arcs */}
    <path d="M14 33C8 38 8 46 14 51" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M86 33C92 38 92 46 86 51" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    
    {/* Star / Spark */}
    <path d="M74 15L76 20L81 22L76 24L74 29L72 24L67 22L72 20L74 15Z" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

const PaymentIllustration = () => (
  <svg className="h-20 w-20 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2 text-zinc-400 dark:text-zinc-500 group-hover:text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Card in background (tilted) */}
    <rect x="30" y="20" width="48" height="30" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" transform="rotate(-10 54 35)" />
    
    {/* Card in foreground */}
    <rect x="22" y="40" width="52" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" />
    {/* Magnetic strip */}
    <line x1="22" y1="48" x2="74" y2="48" stroke="currentColor" strokeWidth="1.5" />
    {/* Chip */}
    <rect x="30" y="55" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Fast check / curved arrow for easy/instant pay */}
    <path d="M60 62L64 66L72 58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Small floating coin */}
    <circle cx="82" cy="38" r="5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const TrustIllustration = () => (
  <svg className="h-20 w-20 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1 text-zinc-400 dark:text-zinc-500 group-hover:text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Shield body */}
    <path d="M50 80C50 80 75 66 75 40V24L50 15L25 24V40C25 66 50 80 50 80Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Heart in the center */}
    <path d="M50 52C50 52 60 45 60 37C60 31.5 55.5 28 50 33.5C44.5 28 40 31.5 40 37C40 45 50 52 50 52Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Checkmark inside heart or overlapping bottom right of the shield */}
    <circle cx="70" cy="65" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M66 65L69 68L75 61" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                { icon: FastLearningIllustration, title: "Học Tập Mượt Mà", desc: "Trải nghiệm xem video bài học với tốc độ cao, không giật lag kể cả khi có hàng ngàn người truy cập." },
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

