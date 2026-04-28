// ========================
// MegaMenuColumn: Một cột trong mega menu desktop
// ========================
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ICourseCategoryNode } from '@/services/courseApi';

interface MegaMenuColumnProps {
  title?: string;
  items: ICourseCategoryNode[];
  activeId?: string | null;
  onHover: (item: ICourseCategoryNode) => void;
}

export const MegaMenuColumn = ({
  title,
  items,
  activeId,
  onHover,
}: MegaMenuColumnProps) => {
  if (items.length === 0) return null;

  return (
    <div className="w-[260px] border-r border-border last:border-r-0 shrink-0 py-2 animate-in fade-in slide-in-from-left-4 duration-200 ease-out">
      {title ? (
        <div className="px-5 pt-3 pb-2 text-base font-bold text-foreground">
          {title}
        </div>
      ) : null}
      <ul>
        {items.map((item) => {
          const isActive = activeId === item._id;
          const hasChildren = (item.children || []).length > 0;

          return (
            <li key={item._id}>
              <Link
                to={`/courses?category=${encodeURIComponent(item.slug)}`}
                onMouseEnter={() => onHover(item)}
                className={`flex items-center justify-between gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-secondary text-primary font-medium'
                    : 'text-foreground/80 hover:text-primary hover:bg-secondary/40'
                }`}
              >
                <span className="line-clamp-1">{item.name}</span>
                {hasChildren ? (
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
