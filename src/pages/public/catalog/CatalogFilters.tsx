import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { ICourseCategoryNode } from '@/services/courseApi';
import type { PriceRangeValue } from '@/lib/courseUtils';
import { DURATION_OPTIONS, normalizeCategorySelection } from '@/lib/courseUtils';

const PRICE_MAX = 5_000_000;
const PRICE_STEP = 100_000;

function formatPrice(val: number) {
  if (val === 0) return '0 ₫';
  return `${(val / 1000).toLocaleString('vi-VN')}k`;
}

// ── Inline Price Range (dùng trong Drawer & Sidebar) ──────────────────────────
export function InlinePriceRange({
  value,
  onChange,
}: {
  value: PriceRangeValue;
  onChange: (v: PriceRangeValue) => void;
}) {
  const isActive = value.min > 0 || value.max < PRICE_MAX;
  return (
    <div className="px-1 space-y-3.5">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="px-2.5 py-1 bg-secondary text-foreground rounded-lg text-xs font-semibold">{formatPrice(value.min)}</span>
        <span className="text-muted-foreground text-xs">–</span>
        <span className="px-2.5 py-1 bg-secondary text-foreground rounded-lg text-xs font-semibold">{value.max >= PRICE_MAX ? 'Không giới hạn' : formatPrice(value.max)}</span>
      </div>

      <div className="py-2">
        <Slider
          value={[value.min, value.max]}
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          onValueChange={([min, max]) => {
            onChange({ min, max });
          }}
        />
      </div>

      {isActive && (
        <Button
          variant="link"
          size="sm"
          onClick={() => onChange({ min: 0, max: PRICE_MAX })}
          className="p-0 h-auto text-xs text-muted-foreground underline hover:text-foreground font-normal"
        >
          Hủy lọc giá
        </Button>
      )}
    </div>
  );
}

// ── Category Tree Filter (Cây danh mục inline) ────────────────────────────────
export function CategoryTreeFilter({
  nodes,
  selected,
  onChange,
}: {
  nodes: ICourseCategoryNode[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
}) {
  const handleToggleNode = (
    toggledNode: ICourseCategoryNode,
    isSelecting: boolean,
    ancestors: string[],
  ) => {
    const nextSet = new Set(selected);

    const allDescendantSlugs: string[] = [];
    const gatherDescendants = (n: ICourseCategoryNode) => {
      allDescendantSlugs.push(n.slug);
      n.children?.forEach(gatherDescendants);
    };
    gatherDescendants(toggledNode);

    if (isSelecting) {
      allDescendantSlugs.forEach(slug => nextSet.add(slug));
      const normalized = normalizeCategorySelection(Array.from(nextSet), nodes);
      onChange(normalized);
      return;
    } else {
      allDescendantSlugs.forEach(slug => nextSet.delete(slug));
      ancestors.forEach(slug => nextSet.delete(slug));
    }

    onChange(Array.from(nextSet));
  };

  return (
    <div className="space-y-1">
      {nodes.map(node => (
        <CategoryNode key={node.slug} node={node} selected={selected} onToggle={handleToggleNode} />
      ))}
    </div>
  );
}

function CategoryNode({
  node,
  selected,
  onToggle,
  depth = 0,
  ancestors = [],
}: {
  node: ICourseCategoryNode;
  selected: string[];
  onToggle: (node: ICourseCategoryNode, isSelecting: boolean, ancestors: string[]) => void;
  depth?: number;
  ancestors?: string[];
}) {
  const isDescendantSelected = (n: ICourseCategoryNode): boolean => {
    if (selected.includes(n.slug)) return true;
    if (n.children) return n.children.some(isDescendantSelected);
    return false;
  };

  const [open, setOpen] = useState(isDescendantSelected(node));
  const isSelected = selected.includes(node.slug);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggleClick = () => {
    onToggle(node, !isSelected, ancestors);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 group py-1.5" style={{ paddingLeft: `${depth * 1.25}rem` }}>
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent shrink-0"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
          </Button>
        ) : (
          <div className="w-6 shrink-0" />
        )}
        
        <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
          <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border group-hover:border-primary'}`}>
            {isSelected && <Check className="w-3.5 h-3.5" />}
          </div>
          <span className={`text-sm ${isSelected ? 'font-medium' : 'text-foreground'}`}>{node.name}</span>
          <input type="checkbox" className="hidden" checked={isSelected} onChange={handleToggleClick} />
        </label>
      </div>

      {hasChildren && open && (
        <div className="mt-0.5 space-y-0.5">
          {node.children.map(child => (
            <CategoryNode key={child.slug} node={child} selected={selected} onToggle={onToggle} depth={depth + 1} ancestors={[...ancestors, node.slug]} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Duration Filter (Inline Thời lượng) ──────────────────────────────────────
export function DurationFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="space-y-3">
      {DURATION_OPTIONS.map((opt) => {
        const isSelected = selected === opt.key;
        return (
          <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border group-hover:border-primary'
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
            </div>
            <span className={`text-sm ${isSelected ? 'font-medium' : 'text-foreground'}`}>{opt.label}</span>
            <input
              type="radio"
              name="duration"
              className="hidden"
              checked={isSelected}
              onChange={() => onChange(isSelected ? '' : opt.key)}
            />
          </label>
        );
      })}
    </div>
  );
}
