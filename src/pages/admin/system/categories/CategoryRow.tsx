import React from 'react';
import {
  ChevronRight,
  Pencil,
  Trash2,
  Hash,
  Folder,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { ICategory } from '@/types/admin.types';

export interface CategoryRowProps {
  cat: ICategory;
  depth?: number;
  expandedIds: string[];
  siblingIndex: number;
  siblingCount: number;
  isMoving: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (cat: ICategory) => void;
  onMove: (cat: ICategory, direction: 'up' | 'down') => void;
  onToggleStatus: (cat: ICategory) => void;
  onDelete: (cat: ICategory) => void;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  cat,
  depth = 0,
  expandedIds,
  siblingIndex,
  siblingCount,
  isMoving,
  onToggleExpand,
  onEdit,
  onMove,
  onToggleStatus,
  onDelete,
}) => {
  const isExpanded = expandedIds.includes(cat._id);
  const hasChildren = (cat.children || []).length > 0;
  const canMoveUp = siblingIndex > 0;
  const canMoveDown = siblingIndex < siblingCount - 1;

  return (
    <>
      <div 
        className="flex items-center gap-3 pr-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group relative"
        style={{ paddingLeft: `${depth * 2.5 + 1}rem` }}
      >
        {Array.from({ length: depth }).map((_, i) => (
          <div 
            key={i} 
            className="absolute top-0 bottom-0 border-l-2 border-zinc-100 dark:border-zinc-800/50 pointer-events-none"
            style={{ left: `calc(${i * 2.5 + 1.75}rem - 1px)` }} // Khoảng cách lề: $2.5rem cho mỗi cấp + $1.75rem cho icon + $1px cho độ dày đường viền
          />
        ))}
        <button
          onClick={() => hasChildren && onToggleExpand(cat._id)}
          className={`p-1 rounded-lg transition-colors ${hasChildren ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer' : 'opacity-0 cursor-default'}`}
        >
          <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <Folder className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{cat.name}</p>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300">
              STT {cat.order}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              Cấp {depth + 1}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${cat.isActive ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
              {cat.isActive ? 'Hoạt động' : 'Tắt'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-zinc-400"><Hash className="w-3 h-3" />{cat.slug}</span>
            <span className="text-xs text-zinc-400">{cat.courseCount || 0} khóa học</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMove(cat, 'up')}
            disabled={!canMoveUp || isMoving}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
            title="Đưa lên trước"
          >
            <ArrowUp className="w-4 h-4 text-zinc-500" />
          </button>
          <button
            onClick={() => onMove(cat, 'down')}
            disabled={!canMoveDown || isMoving}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
            title="Đưa xuống sau"
          >
            <ArrowDown className="w-4 h-4 text-zinc-500" />
          </button>
          <button
            onClick={() => onToggleStatus(cat)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={cat.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
          >
            {cat.isActive
              ? <ToggleRight className="w-4 h-4 text-primary" />
              : <ToggleLeft className="w-4 h-4 text-zinc-400" />}
          </button>
          <button onClick={() => onEdit(cat)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(cat)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (cat.children || []).map((child, index, siblings) => (
        <CategoryRow
          key={child._id}
          cat={child}
          depth={depth + 1}
          expandedIds={expandedIds}
          siblingIndex={index}
          siblingCount={siblings.length}
          isMoving={isMoving}
          onToggleExpand={onToggleExpand}
          onEdit={onEdit}
          onMove={onMove}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};
