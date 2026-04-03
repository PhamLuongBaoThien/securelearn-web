import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

export interface CourseSnippet {
  id: string;
  title: string;
  instructor: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  badge?: string;
}

export const CourseCard = ({ course }: { course: CourseSnippet }) => {
  return (
    <Link to={`/course/${course.id}`} className="group flex flex-col cursor-pointer transition-transform duration-200 h-full">
      <div className="w-full aspect-video rounded-md overflow-hidden bg-secondary relative mb-2 border border-border shrink-0">
        {course.badge && (
          <div className="absolute top-2 left-2 bg-[#eceb98] text-yellow-900 text-xs font-bold px-2 py-1 rounded-sm z-10 shadow-sm">
            {course.badge}
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
      </div>
      
      <h3 className="font-bold text-base leading-tight line-clamp-2 mb-1 group-hover:underline text-foreground">{course.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{course.instructor}</p>
      
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-amber-600 font-bold text-sm">{course.rating.toFixed(1)}</span>
        <div className="flex mr-1">
          {[1,2,3,4,5].map(i => (
             <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(course.rating) ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground fill-none'}`} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">({course.reviews.toLocaleString()})</span>
      </div>
      
      <div className="flex items-center gap-2 mt-auto">
        <span className="font-bold text-base text-foreground">{course.price.toLocaleString('vi-VN')} ₫</span>
        {course.originalPrice && (
          <span className="text-sm text-muted-foreground line-through">{course.originalPrice.toLocaleString('vi-VN')} ₫</span>
        )}
      </div>
    </Link>
  );
};
