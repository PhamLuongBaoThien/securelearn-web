import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  onValueChange?: (value: number) => void;
  readOnly?: boolean;
  iconClassName?: string;
}

const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  ({ value, max = 5, onValueChange, readOnly = false, className, iconClassName, ...props }, ref) => {
    const interactive = !readOnly && Boolean(onValueChange);

    return (
      <div
        ref={ref}
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={`${value} trên ${max} sao`}
        className={cn('inline-flex items-center gap-1 text-amber-500', className)}
        {...props}
      >
        {Array.from({ length: max }).map((_, index) => {
          const ratingValue = index + 1;
          const active = ratingValue <= value;
          const icon = (
            <Star
              className={cn(
                'h-4 w-4 transition-colors',
                active ? 'fill-current' : 'text-zinc-300 dark:text-zinc-700',
                iconClassName
              )}
            />
          );

          if (!interactive) {
            return <span key={ratingValue}>{icon}</span>;
          }

          return (
            <button
              key={ratingValue}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${ratingValue} sao`}
              onClick={() => onValueChange?.(ratingValue)}
              className="rounded-sm p-1 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {icon}
            </button>
          );
        })}
      </div>
    );
  }
);
Rating.displayName = 'Rating';

export { Rating };
