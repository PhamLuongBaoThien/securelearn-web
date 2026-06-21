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
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);
    const interactive = !readOnly && Boolean(onValueChange);

    const handleMouseLeave = () => {
      if (interactive) {
        setHoverValue(null);
      }
    };

    return (
      <div
        ref={ref}
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={`${value} trên ${max} sao`}
        className={cn('inline-flex items-center gap-1 text-amber-500', className)}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {Array.from({ length: max }).map((_, index) => {
          const ratingValue = index + 1;
          const currentValue = hoverValue !== null ? hoverValue : value;
          const diff = currentValue - (ratingValue - 1);
          
          let fillPercent = 0;
          if (diff >= 0.75) {
            fillPercent = 100;
          } else if (diff >= 0.25) {
            fillPercent = 50;
          } else {
            fillPercent = 0;
          }

          const starIcon = (fill: boolean) => (
            <Star
              className={cn(
                'h-4 w-4 transition-colors',
                fill ? 'fill-current' : 'text-zinc-300 fill-none dark:text-zinc-700',
                iconClassName
              )}
            />
          );

          let icon;
          if (fillPercent === 100) {
            icon = starIcon(true);
          } else if (fillPercent === 0) {
            icon = starIcon(false);
          } else {
            icon = (
              <div className="relative inline-block overflow-hidden">
                {starIcon(false)}
                <div className="absolute top-0 left-0 h-full w-1/2 overflow-hidden">
                  {starIcon(true)}
                </div>
              </div>
            );
          }

          if (!interactive) {
            return <span key={ratingValue} className="flex items-center">{icon}</span>;
          }

          const active = ratingValue <= currentValue;

          return (
            <button
              key={ratingValue}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${ratingValue} sao`}
              onMouseEnter={() => setHoverValue(ratingValue)}
              onClick={() => onValueChange?.(ratingValue)}
              className="rounded-sm p-1 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
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
