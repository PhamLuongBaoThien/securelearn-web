import { useRef } from 'react';
import { CourseCard, type CourseSnippet } from './CourseCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CourseCarousel = ({ courses }: { courses: CourseSnippet[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollRef.current.clientWidth + 50, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth - 50, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={scrollLeft}
        className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 bg-background border border-border shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary focus:opacity-100 disabled:opacity-0"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-4 hide-scrollbar"
        style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {courses.map(course => (
          <div key={course.id} className="min-w-[240px] md:min-w-[260px] max-w-[280px] snap-start shrink-0 flex">
            <CourseCard course={course} />
          </div>
        ))}
      </div>

      <button 
        onClick={scrollRight}
        className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 bg-background border border-border shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary focus:opacity-100 disabled:opacity-0"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};
