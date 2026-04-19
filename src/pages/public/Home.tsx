import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { FadeIn } from '../../components/animations/FadeIn';
import { SlideUp } from '../../components/animations/SlideUp';
import { StaggerContainer, StaggerItem } from '../../components/animations/Stagger';
import { CourseCarousel } from '../../components/ui/CourseCarousel';
import { buttonVariants } from '../../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ========================
// Banner Slides Data
// Sau này admin sẽ quản lý danh sách này từ backend (thêm/xóa/sửa hình, tiêu đề, link)
// ========================
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

const mockCourses = [
  { id: '1', title: '100 Days of Code: The Complete Python Pro Bootcamp', instructor: 'Dr. Angela Yu', rating: 4.7, reviews: 295000, price: 349000, originalPrice: 1999000, thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=500&q=80', badge: 'Bestseller' },
  { id: '2', title: 'The Complete Python Bootcamp From Zero to Hero in Python', instructor: 'Jose Portilla', rating: 4.6, reviews: 480000, price: 329000, originalPrice: 2490000, thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=500&q=80', badge: 'Bestseller' },
  { id: '3', title: 'Python for Data Science and Machine Learning', instructor: 'Jose Portilla', rating: 4.6, reviews: 135000, price: 429000, originalPrice: 2690000, thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80' },
  { id: '4', title: 'Python Mega Course: Learn Python in 60 Days', instructor: 'Ardit Sulce', rating: 4.7, reviews: 68000, price: 349000, originalPrice: 1999000, thumbnail: 'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?auto=format&fit=crop&w=500&q=80' },
  { id: '5', title: 'Automate the Boring Stuff with Python', instructor: 'Al Sweigart', rating: 4.6, reviews: 108000, price: 299000, originalPrice: 1290000, thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=500&q=80' },
];

const SLIDE_INTERVAL = 5000; // 5 giây mỗi slide

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
        className="relative px-0 md:px-6 max-w-[1340px] mx-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative w-full aspect-[21/9] md:aspect-[3/1] md:rounded-2xl overflow-hidden">
          {/* Slides */}
          {bannerSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          ))}

          {/* Text Content */}
          <div className="absolute inset-0 z-20 flex items-end pb-10 md:pb-14 px-6 md:px-12 lg:px-16">
            <FadeIn key={currentSlide} delay={0.1} direction="up" distance={30}>
              <div className="max-w-xl">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
                  {bannerSlides[currentSlide].title}
                </h1>
                <p className="text-white/80 text-sm sm:text-base md:text-lg mb-5 drop-shadow-md">
                  {bannerSlides[currentSlide].subtitle}
                </p>
                <Link
                  to={bannerSlides[currentSlide].link}
                  className="inline-flex items-center px-6 py-2.5 bg-white text-black font-semibold text-sm rounded-full hover:bg-white/90 transition-colors shadow-lg"
                >
                  Khám phá ngay
                </Link>
              </div>
            </FadeIn>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-colors"
            aria-label="Slide trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-colors"
            aria-label="Slide tiếp"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-6 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Đi đến slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

        {/* Trusted By */}
        <section className="bg-secondary/20 py-16 px-6 mt-16 text-center">
          <SlideUp>
            <p className="text-xl text-muted-foreground font-semibold mb-8">Được tin cậy bởi các tổ chức công nghệ và chuyên gia giáo dục hàng đầu</p>
          </SlideUp>
          <StaggerContainer className="flex flex-wrap justify-center gap-12 sm:gap-16 items-center opacity-60">
            {/* Fake startup tech partners */}
            <StaggerItem><span className="text-2xl font-bold font-serif">CTU</span></StaggerItem>
            <StaggerItem><span className="text-2xl font-bold font-sans tracking-tighter">CTUM</span></StaggerItem>
            <StaggerItem><span className="text-2xl font-bold font-mono tracking-widest">VNG</span></StaggerItem>
            <StaggerItem><span className="text-2xl font-bold font-serif italic">MoMo</span></StaggerItem>
            <StaggerItem><span className="text-2xl font-bold">VNPT</span></StaggerItem>
            <StaggerItem><span className="text-2xl font-bold font-sans hidden md:block">Tiki</span></StaggerItem>
          </StaggerContainer>
        </section>

        {/* Broad Selection of Courses */}
        <section className="px-6 py-16 max-w-[1340px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Nội dung chất lượng, Bản quyền 100%</h2>
          <p className="text-xl text-muted-foreground mb-8">Hơn 500+ khóa học công nghệ sâu được bảo vệ bằng chuẩn mã hóa DRM AES-128. Quyền lợi của người dạy và người học luôn được đặt lên hàng đầu.</p>
          
          <div className="flex gap-6 mb-0 overflow-x-auto pb-0 scrollbar-hide border-b border-border/50">
            <button className="text-base font-bold text-foreground border-b-2 border-foreground pb-2 whitespace-nowrap">Lập trình lõi</button>
            <button className="text-base font-bold text-muted-foreground hover:text-foreground transition-colors pb-2 whitespace-nowrap">Bảo mật (Cybersec)</button>
            <button className="text-base font-bold text-muted-foreground hover:text-foreground transition-colors pb-2 whitespace-nowrap">DevOps & Cloud</button>
            <button className="text-base font-bold text-muted-foreground hover:text-foreground transition-colors pb-2 whitespace-nowrap">AI / Machine Learning</button>
            <button className="text-base font-bold text-muted-foreground hover:text-foreground transition-colors pb-2 whitespace-nowrap">Thiết kế hệ thống</button>
          </div>
          
          <div className="border border-border p-8 bg-card shadow-sm pt-8">
             <h3 className="text-2xl font-bold mb-3">Làm chủ Công nghệ và An toàn thông tin</h3>
             <p className="text-muted-foreground mb-6 max-w-3xl leading-relaxed">Nâng cấp kỹ năng chuyên sâu với các khóa thực chiến từ những kỹ sư cấp cao. Mọi video bài giảng đều được stream độc quyền, không bao giờ lo gián đoạn hay bị thất thoát sao chép trái phép.</p>
             <Link to="/explore/security" className={buttonVariants({ variant: 'udemy_outline', className: "mb-8 rounded-none font-bold" })}>
               Khám phá Chương trình đào tạo
             </Link>
             
             {/* Carousel Component */}
             <CourseCarousel courses={mockCourses} />
          </div>
        </section>

        {/* Top Categories */}
        <section className="px-6 py-12 max-w-[1340px] mx-auto mb-16">
          <SlideUp>
            <h2 className="text-2xl lg:text-3xl font-bold mb-8 font-serif">Danh mục hàng đầu</h2>
          </SlideUp>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {[
               { id: "design", name: "Thiết kế", img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=500" },
               { id: "development", name: "Phát triển Phần mềm", img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=500" },
               { id: "marketing", name: "Marketing", img: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80&w=500" },
               { id: "it-and-software", name: "CNTT và Phần mềm", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=500" },
               { id: "personal-development", name: "Phát triển cá nhân", img: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=500" },
               { id: "business", name: "Kinh doanh", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=500" },
               { id: "photography", name: "Nhiếp ảnh", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=500" },
               { id: "music", name: "Âm nhạc", img: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=500" }
             ].map((cat, i) => (
               <StaggerItem key={i}>
                 <Link to={`/category/${cat.id}`} className="group cursor-pointer block">
                   <div className="w-full aspect-square md:aspect-[4/3] bg-secondary/30 mb-3 overflow-hidden rounded bg-muted">
                     <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                   </div>
                   <h3 className="font-bold group-hover:text-primary transition-colors text-lg">{cat.name}</h3>
                 </Link>
               </StaggerItem>
             ))}
          </StaggerContainer>
        </section>
      {/* End */}
    </>
  );
};
