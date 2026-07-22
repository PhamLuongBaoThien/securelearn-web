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
  showExploreAll?: boolean;
}

export const MegaMenuColumn = ({
  title,
  items,
  activeId,
  onHover,
  showExploreAll = false,
}: MegaMenuColumnProps) => {
  if (items.length === 0 && !showExploreAll) return null;

  return (
    <div className="w-[260px] border-r border-border last:border-r-0 shrink-0 py-2 flex flex-col justify-between">
      <div>
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

      {showExploreAll ? (
        <div className="pt-1.5 mt-1.5 border-t border-border/60">
          <Link
            to="/courses"
            className="block px-5 py-2.5 text-sm font-semibold text-primary hover:bg-secondary/50 transition-colors"
          >
            Khám phá tất cả
          </Link>
        </div>
      ) : null}
    </div>
  );
};
