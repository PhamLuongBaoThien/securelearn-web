import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Star, PlayCircle, Check, ShieldCheck, ChevronDown, ChevronRight, MonitorPlay, Infinity as InfinityIcon, Smartphone, Award } from 'lucide-react';

export function CourseDetail() {
  // Theo dõi xem sidebar có đang ở trạng thái sticky hay không
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    // viewport là khu vực hiển thị của trình duyệt
    // Sentinel element nằm ngay trên sticky container.
    // Khi sentinel rời khỏi viewport (bị cuộn qua) → sidebar đang sticky.
    // Khi sentinel quay lại viewport (cuộn ngược lên) → sidebar không còn sticky.
    const sentinel = sentinelRef.current; 
    if (!sentinel) return;

    const observer = new IntersectionObserver( // IntersectionObserver là một API của trình duyệt cho phép bạn theo dõi sự thay đổi của vị trí một phần tử so với viewport.
      ([entry]) => {  // entry là một đối tượng chứa thông tin về sự thay đổi của vị trí phần tử so với viewport.
        // Khi sentinel KHÔNG còn trong viewport → sidebar đang sticky
        setIsSticky(!entry.isIntersecting); // thuộc tính isIntersecting trả về true nếu sentinel đang trong viewport, false nếu sentinel không còn trong viewport
      },
      { threshold: 0, rootMargin: '-88px 0px 0px 0px' } // 88px = chiều cao navbar + gap ()
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const course = {
    title: 'The Complete Full-Stack Web Development Bootcamp',
    subtitle: 'Học cách xây dựng các ứng dụng Web toàn diện với React, Node.js, Express và MongoDB từ con số không.',
    instructor: 'Tiến sĩ Angela Yu',
    rating: 4.8,
    reviews: 325120,
    students: 1450000,
    lastUpdate: '10/2026',
    price: 499000,
    originalPrice: 2490000,
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000'
  };

  return (
    <div className="bg-background min-h-screen pb-20 relative -mt-[88px]">
      {/* Dark Theme Header Banner — không có margin/padding top để sát header */}
      <FadeIn className="bg-zinc-900 text-zinc-50 pt-[120px] pb-8 lg:pt-[136px] lg:pb-12 px-6">
        <div className="max-w-[1340px] mx-auto flex flex-col lg:flex-row gap-8 relative">
          
          <FadeIn direction="up" delay={0.2} className="lg:w-2/3 pr-0 lg:pr-10 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-4">
              <span className="text-zinc-400">Phát triển phần mềm</span>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <span className="text-zinc-400">Phát triển Web</span>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <span>Full Stack</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold leading-tight font-serif">{course.title}</h1>
            <p className="text-lg md:text-xl text-zinc-300 leading-relaxed max-w-3xl">{course.subtitle}</p>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm pt-2">
              <div className="bg-[#eceb98] text-yellow-900 px-2.5 py-1 text-xs font-bold rounded-sm">Bestseller</div>
              <div className="flex items-center gap-1">
                <span className="text-[#f4c150] font-bold">{course.rating}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#f4c150] text-[#f4c150]" />
                  ))}
                </div>
              </div>
              <span className="text-[#c0c4fc] underline cursor-pointer">({course.reviews.toLocaleString()} đánh giá)</span>
              <span>{course.students.toLocaleString()} học viên</span>
            </div>
            
            <p className="text-sm pt-2">Được tạo bởi <span className="text-[#c0c4fc] underline cursor-pointer">{course.instructor}</span></p>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Cập nhật lần cuối {course.lastUpdate}</span>
              <span>• Tiếng Việt</span>
            </div>
          </FadeIn>
        </div>
      </FadeIn>

      {/* Main Content Area — lg:items-stretch giúp cột phải kéo dài bằng cột trái, tạo không gian cho sticky */}
      <div className="max-w-[1340px] mx-auto px-6 relative flex flex-col-reverse lg:flex-row gap-12 lg:pt-0 pt-8 lg:items-stretch items-start">
        
        {/* Left Column - Details */}
        <StaggerContainer className="w-full lg:w-2/3 space-y-12">
          
          {/* What you'll learn */}
          <StaggerItem className="border border-border p-6 lg:p-8 bg-card shadow-sm rounded-none">
            <h2 className="text-2xl font-bold font-serif mb-6">Bạn sẽ học được gì</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Xây dựng 16 dự án web portfolio để khoe với nhà tuyển dụng',
                'Nắm vững hệ sinh thái MERN (MongoDB, Express, React, Node)',
                'Học thuật toán, tối ưu code và xử lý luồng dữ liệu bất đồng bộ',
                'Quy trình làm việc chuyên nghiệp với Git, GitHub và CI/CD'
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </StaggerItem>

          {/* Curriculum Accordion (Mock UI) */}
          <StaggerItem>
            <h2 className="text-2xl font-bold font-serif mb-6">Nội dung khóa học</h2>
            <p className="text-sm text-muted-foreground mb-4">42 phần • 385 bài giảng • Tổng thời lượng 65 giờ 30 phút</p>
            
            <div className="border border-border">
              {[
                { title: "Giới thiệu về Khóa học", lectures: 5, duration: "45 phút", active: true },
                { title: "Thiết lập môi trường làm việc", lectures: 3, duration: "25 phút", active: false },
                { title: "HTML5 - Cơ bản đến Nâng cao", lectures: 24, duration: "3 giờ 15 phút", active: false },
                { title: "Master CSS3 và Flexbox", lectures: 38, duration: "5 giờ 40 phút", active: false },
                { title: "JavaScript ES6+ Toàn tập", lectures: 65, duration: "12 giờ 20 phút", active: false }
              ].map((section, idx) => (
                <div key={idx} className="border-b border-border last:border-0">
                  <button className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary transition-colors text-left font-bold">
                    <span className="flex items-center gap-4">
                      <ChevronDown className={`w-5 h-5 transition-transform ${section.active ? 'rotate-180' : ''}`} />
                      Mục {idx + 1}: {section.title}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground hidden sm:inline-block">
                      {section.lectures} bài giảng • {section.duration}
                    </span>
                  </button>
                  
                  {section.active && (
                     <div className="p-4 bg-background">
                       {[1,2,3,4,5].map((_, i) => (
                         <div key={i} className="flex items-center justify-between py-2 text-sm">
                           <span className="flex items-center gap-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                             <PlayCircle className="w-4 h-4" /> 
                             <span className={i === 0 ? "text-primary underline" : "text-foreground"}>Bài {i+1}: Khai giảng và định hướng</span>
                           </span>
                           <span className="text-muted-foreground">0{i+2}:45</span>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              ))}
            </div>
          </StaggerItem>

          {/* Requirements & Description */}
          <StaggerItem>
             <h2 className="text-2xl font-bold font-serif mb-4">Yêu cầu khóa học</h2>
             <ul className="list-disc pl-5 space-y-2 mb-8 text-sm md:text-base">
               <li>Không yêu cầu kinh nghiệm lập trình. Bạn sẽ học mọi thứ từ con số 0.</li>
               <li>Một chiếc máy tính Mac hoặc PC kết nối Internet.</li>
               <li>Sự kiên nhẫn và sẵn sàng học hỏi những điều mới!</li>
             </ul>

             <h2 className="text-2xl font-bold font-serif mb-4">Mô tả chi tiết</h2>
             <div className="prose dark:prose-invert max-w-none text-sm md:text-base mb-8">
               <p className="mb-4">Chào mừng bạn đến với khóa học Phát triển Web toàn diện nhất trên SecureLearn. 
               Chúng tôi đã thiết kế chương trình học này thay cho hàng loạt Bootcamp đắt đỏ ngoài kia với nội dung 
               thậm chí còn chi tiết và cập nhật hơn.</p>
               <p>Khóa học liên tục được cập nhật công nghệ mới nhất trong năm 2026. Bao gồm React 19, Next.js, 
               và cách tích hợp AI vào úng dụng của bạn.</p>
             </div>
          </StaggerItem>

        </StaggerContainer>

        {/* Right Column — cột này kéo dài bằng cột trái nhờ items-stretch,
            bên trong có sticky div sẽ bám theo viewport khi cuộn */}
        <div className="w-full lg:w-1/3 lg:-mt-72 z-20" ref={sidebarRef}>
          {/* Sentinel: phần tử vô hình đánh dấu vị trí gốc của sidebar.
              Khi nó rời khỏi viewport → sidebar đã ở trạng thái sticky */}
          <div ref={sentinelRef} className="h-0 w-full" />
          <div className="lg:sticky lg:top-[88px]">
            <FadeIn direction="left" distance={60} delay={0.4}>
              <div className="bg-card w-full shadow-2xl border border-border">
                {/* Hình ảnh đại diện khóa học — ẩn khi đang sticky, hiện khi ở vị trí gốc */}
                <div 
                  className={`relative aspect-video bg-black overflow-hidden transition-all duration-300 ease-in-out ${
                    isSticky ? 'lg:max-h-0 lg:opacity-0 max-h-[300px] opacity-100' : 'max-h-[300px] opacity-100'
                  }`}
                >
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover" 
                  />
                </div>

                <div className="p-6">
                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <span className="text-3xl font-extrabold">{course.price.toLocaleString('vi-VN')} ₫</span>
                      {course.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">{course.originalPrice.toLocaleString('vi-VN')} ₫</span>
                      )}
                    </div>
                    {course.originalPrice && (
                      <div className="text-sm font-medium text-amber-600">Giảm 80%</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 mb-4">
                    <Button variant="udemy_dark" className="w-full py-6 font-bold text-lg rounded-none">Thêm vào giỏ hàng</Button>
                    <Button variant="outline" className="w-full py-6 font-bold border-foreground rounded-none">Mua ngay</Button>
                  </div>
                  <p className="text-center text-xs text-muted-foreground mb-6">Cam kết hoàn tiền trong 30 ngày</p>

                  {/* Includes */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm mb-2">Khóa học này bao gồm:</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground"><MonitorPlay className="w-4 h-4 text-foreground" /> 65 giờ video theo yêu cầu</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground"><InfinityIcon className="w-4 h-4 text-foreground" /> Truy cập trọn đời</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground"><Smartphone className="w-4 h-4 text-foreground" /> Truy cập trên mobile và TV</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground"><Award className="w-4 h-4 text-foreground" /> Chứng nhận hoàn thành</div>
                  </div>

                  <div className="flex justify-between mt-6 pt-6 border-t font-semibold text-sm text-foreground underline decoration-solid underline-offset-4 cursor-pointer">
                    <span className="hover:text-primary">Chia sẻ</span>
                    <span className="hover:text-primary">Tặng tin</span>
                    <span className="hover:text-primary">Áp dụng Coupon</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

      </div>
    </div>
  );
}
