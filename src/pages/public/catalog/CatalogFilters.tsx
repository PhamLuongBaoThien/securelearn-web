import { useState } from 'react';
import { ChevronDown, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ICourseCategoryNode } from '@/services/courseApi';
import type { PriceRangeValue } from '@/lib/courseUtils';
import { DURATION_OPTIONS, normalizeCategorySelection } from '@/lib/courseUtils';

export interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onSelect: (val: string) => void;
}

export function MultiSelectDropdown({ label, options, selected, onSelect }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const isActive = selected.length > 0;

  return (
    <div className="relative hidden md:block z-20">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-full transition-all ${
          isActive
            ? 'border-foreground bg-foreground text-background'
            : 'border-border hover:border-foreground bg-background text-foreground'
        }`}
      >
        {label} {isActive && `(${selected.length})`}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 min-w-[200px] max-h-72 overflow-y-auto bg-background border border-border rounded-lg shadow-lg py-1">
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => onSelect(opt.value)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-secondary transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <span className={isSelected ? 'font-medium' : ''}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Price Range Filter (Dual Slider — dùng trên top bar) ─────────────────────
const PRICE_MAX = 5_000_000;
const PRICE_STEP = 100_000;

function formatPrice(val: number) {
  if (val === 0) return '0 ₫';
  return `${(val / 1000).toLocaleString('vi-VN')}k`;
}

function DualRangeTrack({ min, max, valueMin, valueMax }: { min: number; max: number; valueMin: number; valueMax: number }) {
  const left = ((valueMin - min) / (max - min)) * 100;
  const right = 100 - ((valueMax - min) / (max - min)) * 100;
  return (
    <div className="w-full h-1.5 bg-secondary rounded-full relative">
      <div
        className="absolute h-1.5 bg-primary rounded-full"
        style={{ left: `${left}%`, right: `${right}%` }}
      />
    </div>
  );
}

export function PriceRangeFilter({
  value,
  onChange,
}: {
  value: PriceRangeValue;
  onChange: (v: PriceRangeValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<PriceRangeValue>(value);

  // Sync nếu value bị reset từ bên ngoài
  if (local.min !== value.min && value.min === 0 && value.max === PRICE_MAX) {
    setLocal({ min: 0, max: PRICE_MAX });
  }

  const isActive = value.min > 0 || value.max < PRICE_MAX;

  const handleApply = () => { onChange(local); setOpen(false); };
  const handleClear = () => { const reset = { min: 0, max: PRICE_MAX }; setLocal(reset); onChange(reset); setOpen(false); };

  return (
    <div className="relative hidden md:block z-20">
      <button
        onClick={() => { setLocal(value); setOpen((v) => !v); }}
        className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-full transition-all ${
          isActive ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground bg-background text-foreground'
        }`}
      >
        {isActive ? `${formatPrice(value.min)} – ${formatPrice(value.max)}` : 'Giá'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 w-76 bg-background border border-border rounded-lg shadow-lg p-5">
            <h4 className="font-semibold text-sm mb-4">Khoảng giá</h4>
            <div className="flex items-center justify-between text-sm font-medium mb-4">
              <span className="px-2.5 py-1 bg-secondary rounded text-xs">{formatPrice(local.min)}</span>
              <span className="text-muted-foreground text-xs">–</span>
              <span className="px-2.5 py-1 bg-secondary rounded text-xs">{local.max >= PRICE_MAX ? 'Không giới hạn' : formatPrice(local.max)}</span>
            </div>

            <DualRangeTrack min={0} max={PRICE_MAX} valueMin={local.min} valueMax={local.max} />
            <div className="dual-range-slider mt-1 mb-4">
              <input type="range" min={0} max={PRICE_MAX} step={PRICE_STEP} value={local.min}
                onChange={(e) => setLocal((p) => ({ ...p, min: Math.min(Number(e.target.value), p.max - PRICE_STEP) }))}
                style={{ zIndex: local.min > PRICE_MAX - PRICE_STEP ? 5 : 3 }}
              />
              <input type="range" min={0} max={PRICE_MAX} step={PRICE_STEP} value={local.max}
                onChange={(e) => setLocal((p) => ({ ...p, max: Math.max(Number(e.target.value), p.min + PRICE_STEP) }))}
                style={{ zIndex: 4 }}
              />
            </div>

            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleClear}>Xóa</Button>
              <Button size="sm" className="flex-1" onClick={handleApply}>Áp dụng</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Inline Price Range (dùng trong Drawer) ─────────────────────────────────────
export function InlinePriceRange({
  value,
  onChange,
}: {
  value: PriceRangeValue;
  onChange: (v: PriceRangeValue) => void;
}) {
  const isActive = value.min > 0 || value.max < PRICE_MAX;
  return (
    <div className="px-1">
      <div className="flex items-center justify-between text-sm font-medium mb-4">
        <span className="px-2.5 py-1 bg-secondary rounded text-xs">{formatPrice(value.min)}</span>
        <span className="text-muted-foreground text-xs">–</span>
        <span className="px-2.5 py-1 bg-secondary rounded text-xs">{value.max >= PRICE_MAX ? 'Không giới hạn' : formatPrice(value.max)}</span>
      </div>

      <DualRangeTrack min={0} max={PRICE_MAX} valueMin={value.min} valueMax={value.max} />
      <div className="dual-range-slider mt-1 mb-3">
        <input type="range" min={0} max={PRICE_MAX} step={PRICE_STEP} value={value.min}
          onChange={(e) => onChange({ ...value, min: Math.min(Number(e.target.value), value.max - PRICE_STEP) })}
          style={{ zIndex: value.min > PRICE_MAX - PRICE_STEP ? 5 : 3 }}
        />
        <input type="range" min={0} max={PRICE_MAX} step={PRICE_STEP} value={value.max}
          onChange={(e) => onChange({ ...value, max: Math.max(Number(e.target.value), value.min + PRICE_STEP) })}
          style={{ zIndex: 4 }}
        />
      </div>
      {isActive && (
        <button
          onClick={() => onChange({ min: 0, max: PRICE_MAX })}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Hủy lọc giá
        </button>
      )}
    </div>
  );
}

export function CategoryTreeDropdown({
  label,
  nodes,
  selected,
  onChange,
}: {
  label: string;
  nodes: ICourseCategoryNode[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = selected.length > 0;

  return (
    <div className="relative hidden md:block z-20">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-full transition-all ${
          isActive
            ? 'border-foreground bg-foreground text-background'
            : 'border-border hover:border-foreground bg-background text-foreground'
        }`}
      >
        {label} {isActive && `(${selected.length})`}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 min-w-[280px] max-h-[400px] overflow-y-auto bg-background border border-border rounded-lg shadow-lg py-3 px-3">
            <CategoryTreeFilter nodes={nodes} selected={selected} onChange={onChange} />
          </div>
        </>
      )}
    </div>
  );
}



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

    // Thu thập tất cả danh mục con của node được toggle
    const allDescendantSlugs: string[] = [];
    const gatherDescendants = (n: ICourseCategoryNode) => {
      allDescendantSlugs.push(n.slug);
      n.children?.forEach(gatherDescendants);
    };
    gatherDescendants(toggledNode);

    if (isSelecting) {
      // TICK: Thêm node + tất cả con vào set
      allDescendantSlugs.forEach(slug => nextSet.add(slug));
      
      // Bottom-up: Gọi hàm chuẩn hóa trên toàn cây (nó sẽ tự check cha)
      const normalized = normalizeCategorySelection(Array.from(nextSet), nodes);
      onChange(normalized);
      return;
    } else {
      // BỎ TICK: Xóa node + tất cả con khỏi set
      allDescendantSlugs.forEach(slug => nextSet.delete(slug));

      // Bỏ tick con thì tự động bỏ tick tất cả tổ tiên
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

function CategoryNode({ node, selected, onToggle, depth = 0, ancestors = [] }: { node: ICourseCategoryNode; selected: string[]; onToggle: (node: ICourseCategoryNode, isSelecting: boolean, ancestors: string[]) => void; depth?: number; ancestors?: string[] }) {
  // Check if any descendant is selected to auto-expand
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
          <button onClick={() => setOpen(!open)} className="p-1 text-muted-foreground hover:text-foreground shrink-0 flex items-center justify-center">
            <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
          </button>
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



// Inline (dùng trong Drawer)
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

// Dropdown (dùng trên top bar)
export function DurationDropdown({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = DURATION_OPTIONS.find((o) => o.key === selected);
  const isActive = !!current;

  return (
    <div className="relative hidden md:block z-20">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-full transition-all ${
          isActive ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground bg-background text-foreground'
        }`}
      >
        {isActive ? current.label : 'Thời lượng'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 min-w-[200px] bg-background border border-border rounded-lg shadow-lg py-1">
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selected === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => { onChange(isSelected ? '' : opt.key); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-secondary transition-colors"
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <span className={isSelected ? 'font-medium' : ''}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
