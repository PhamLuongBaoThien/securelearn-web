import { motion } from 'framer-motion';
import { PlayCircle, Clock, Star } from 'lucide-react';
import type { CourseSnippet } from '../../features/courses/cartSlice';

export const CourseCard = ({ course, delay = 0 }: { course: CourseSnippet; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group flex flex-col bg-card text-card-foreground rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <PlayCircle className="w-12 h-12 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          {course.price.toLocaleString('vi-VN')} ₫
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{course.instructor || 'Instructor Name'}</p>
        
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>12h 30m</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-medium text-foreground">4.8</span>
            <span className="text-muted-foreground">(120)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
