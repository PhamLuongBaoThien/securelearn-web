import { useState } from 'react';
import { CourseCard } from '@/components/ui/CourseCard';
import { FadeIn } from '@/components/animations/FadeIn';
import { SlideUp } from '@/components/animations/SlideUp';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Button } from '@/components/ui/button';
import { Filter, ChevronDown, Check } from 'lucide-react';

const mockCatalog = Array(12).fill(0).map((_, i) => ({
  id: `c${i}`,
  title: i % 2 === 0 ? 'React 18 & TypeScript - Phát triển Web chuyên nghiệp' : 'Thiết kế hệ thống System Design Interview',
  instructor: i % 3 === 0 ? 'Alice Smith' : 'Bob Johnson',
  rating: 4.8 - (i * 0.1),
  reviews: 1200 + i * 500,
  price: 399000 + i * 10000,
  originalPrice: 1999000,
  thumbnail: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&q=80&w=500`,
  badge: i === 0 ? 'Bestseller' : (i === 1 ? 'Mới' : undefined)
}));

export function Catalog() {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  return (
    <div className="max-w-[1340px] mx-auto px-4 md:px-6">
      {/* Header */}
      <SlideUp className="py-8">
        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-4">Kết quả tìm kiếm khóa học</h1>
        <p className="text-muted-foreground text-lg">Khám phá 10,000+ khóa học chất lượng cao từ các chuyên gia.</p>
      </SlideUp>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 font-bold"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          >
            <Filter className="h-4 w-4" /> BỘ LỌC
          </Button>
          <span className="text-muted-foreground font-semibold">12 kết quả</span>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-bold whitespace-nowrap hidden sm:block">Sắp xếp theo:</span>
          <select className="flex-1 md:w-60 h-12 px-4 bg-background border border-input rounded-none font-bold outline-none focus:ring-2 focus:ring-ring">
            <option>Được đề xuất nhiều nhất</option>
            <option>Đánh giá cao nhất</option>
            <option>Mới nhất</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <FadeIn direction="left" distance={30} className={`w-full md:w-64 shrink-0 space-y-8 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
          {/* Category Filter */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center justify-between border-b pb-2">Danh mục <ChevronDown className="h-4 w-4" /></h3>
            <div className="space-y-3">
              {['Phát triển phần mềm', 'Marketing', 'Kinh doanh', 'Thiết kế'].map((cat, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 border-2 border-muted-foreground rounded-sm group-hover:border-primary flex items-center justify-center transition-colors">
                    {i === 0 && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <span className="text-foreground text-base group-hover:text-primary transition-colors">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center justify-between border-b pb-2">Đánh giá <ChevronDown className="h-4 w-4" /></h3>
            <div className="space-y-3">
              {[4.5, 4.0, 3.5].map((rating, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 border-2 border-muted-foreground rounded-full group-hover:border-primary flex items-center justify-center transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-transparent'}`}></div>
                  </div>
                  <span className="text-foreground text-base flex items-center gap-1">
                    {rating} <span className="text-amber-500">★</span> trở lên
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center justify-between border-b pb-2">Giá <ChevronDown className="h-4 w-4" /></h3>
            <div className="space-y-3">
              {['Có phí', 'Miễn phí'].map((price, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 border-2 border-muted-foreground rounded-sm group-hover:border-primary flex items-center justify-center transition-colors"></div>
                  <span className="text-foreground text-base group-hover:text-primary transition-colors">{price}</span>
                </label>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Main Grid */}
        <div className="flex-1">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockCatalog.map((course) => (
               <StaggerItem key={course.id}>
                 <CourseCard course={course} />
               </StaggerItem>
            ))}
          </StaggerContainer>
          
          <div className="mt-12 flex justify-center">
            <Button variant="outline" className="w-full md:w-auto px-8 py-6 font-bold border-2">Xem thêm kết quả</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
