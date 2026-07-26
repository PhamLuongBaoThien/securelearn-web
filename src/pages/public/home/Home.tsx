import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HorizontalStaggerContainer, HorizontalStaggerItem } from '@/components/animations/HorizontalStagger';
import { SectionReveal, SectionSequence, SectionSequenceItem } from '@/components/animations/SectionReveal';
import { CourseCarousel } from '@/components/ui/CourseCarousel';
import { buttonVariants } from '@/components/ui/button';
import { useCatalog } from '@/hooks/useCatalog';
import { usePublicCourseCategories } from '@/hooks/usePublicCourseCategories';
import { CourseCardSkeleton } from '@/pages/public/catalog/CourseCardSkeleton';
import { HomeBannerSlider } from './HomeBannerSlider';

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
  const shouldReduceMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState('');
  const { data: categoryTree = [] } = usePublicCourseCategories();
  const {
    data: featuredCoursesData,
    isLoading: isFeaturedCoursesLoading,
    isError: isFeaturedCoursesError,
    error: featuredCoursesError,
    refetch: refetchFeaturedCourses,
  } = useCatalog({
    page: 1,
    limit: 8,
    sort: 'top_rated',
    category: selectedCategory ? [selectedCategory] : undefined,
  });

  const featuredCourses = featuredCoursesData?.courses ?? [];
  const categoryTabs = [
    { id: 'all', name: 'Tất cả khóa học', slug: '' },
    ...categoryTree.map((category) => ({
      id: category._id,
      name: category.name,
      slug: category.slug,
    })),
  ];

  return (
    <>
      <HomeBannerSlider />

        {/* Dành cho bạn */}
        <section className="bg-secondary/10 px-6 py-16 md:py-24 overflow-hidden w-full flex items-center justify-center">
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
        <section className="mx-auto flex w-full max-w-[1340px] flex-col justify-center overflow-hidden px-6 py-16 md:py-24">
          <SectionReveal>
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <h2 className="mb-3 font-sans text-2xl font-bold tracking-tight md:text-3xl">Khóa Học Nổi Bật</h2>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  Khám phá các khóa học được đánh giá cao nhất. Nâng cấp kỹ năng của bạn ngay hôm nay với lộ trình bài bản từ cơ bản đến chuyên sâu.
                </p>
              </div>
              <Link to="/courses" className={buttonVariants({ variant: 'outline', className: "shrink-0 rounded-full border-primary/50 px-6 font-semibold hover:bg-primary/5 hover:text-primary" })}>
                Xem tất cả
              </Link>
            </div>
          </SectionReveal>
          
          <SectionReveal delay={0.08}>
            <div className="mb-4 flex gap-6 overflow-x-auto border-b border-border/30 pb-1 scrollbar-hide">
              {categoryTabs.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selectedCategory === category.slug}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`relative cursor-pointer pb-3 text-base font-bold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    selectedCategory === category.slug
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {category.name}
                  {selectedCategory === category.slug && (
                    <motion.div
                      layoutId="home-featured-category-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 500, damping: 36 }
                      }
                    />
                  )}
                </button>
              ))}
            </div>
            
            <div className="relative pt-1">
               {/* Background glowing effect */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />
               
               <AnimatePresence mode="wait" initial={false}>
                 <motion.div
                   key={selectedCategory || 'all'}
                   className="min-h-[440px]"
                   initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
                   transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
                   aria-live="polite"
                 >
               {isFeaturedCoursesLoading ? (
                 <div className="flex min-h-[440px] gap-4 overflow-hidden py-2" aria-label="Đang tải khóa học nổi bật">
                   {Array.from({ length: 4 }).map((_, index) => (
                     <div key={index} className="min-w-[240px] md:min-w-[260px] max-w-[280px] shrink-0">
                       <CourseCardSkeleton />
                     </div>
                   ))}
                 </div>
               ) : isFeaturedCoursesError ? (
                 <div className="flex min-h-[440px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-background/70 px-6 text-center">
                   <p className="text-muted-foreground">
                     {featuredCoursesError instanceof Error
                       ? featuredCoursesError.message
                       : 'Không thể tải khóa học nổi bật.'}
                   </p>
                   <button
                     type="button"
                     onClick={() => void refetchFeaturedCourses()}
                     className={buttonVariants({ variant: 'outline' })}
                   >
                     Thử lại
                   </button>
                 </div>
               ) : featuredCourses.length === 0 ? (
                 <div className="flex min-h-[440px] items-center justify-center rounded-xl border border-dashed border-border px-6 text-center text-muted-foreground">
                   Chưa có khóa học phù hợp trong danh mục này.
                 </div>
               ) : (
                 <CourseCarousel courses={featuredCourses} />
               )}
                 </motion.div>
               </AnimatePresence>
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

