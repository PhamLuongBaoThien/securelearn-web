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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface CategoryRowProps {
  cat: ICategory;
  depth?: number;
  expandedIds: string[];
  siblingIndex: number;
  siblingCount: number;
  isMoving: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
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
  selectedIds,
  onToggleSelect,
  onToggleExpand,
  onEdit,
  onMove,
  onToggleStatus,
  onDelete,
}) => {
  const isExpanded = expandedIds.includes(cat._id);
  const isSelected = selectedIds.includes(cat._id);
  const hasChildren = (cat.children || []).length > 0;
  const hasCourses = (cat.courseCount || 0) > 0;
  const canDelete = !hasChildren && !hasCourses;
  const canMoveUp = siblingIndex > 0;
  const canMoveDown = siblingIndex < siblingCount - 1;
  const deleteTooltip = canDelete
    ? 'Xóa danh mục này'
    : hasChildren
      ? 'Không thể xóa vì danh mục này có danh mục con.'
      : 'Không thể xóa vì danh mục này đang có khóa học.';

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
            style={{ left: `calc(${i * 2.5 + 1.75}rem - 1px)` }}
          />
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(cat._id)}
              className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700"
              aria-label={`Chọn danh mục ${cat.name}`}
            />
          </TooltipTrigger>
          <TooltipContent>{isSelected ? 'Bỏ chọn danh mục này' : 'Chọn danh mục này'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => hasChildren && onToggleExpand(cat._id)}
              className={`p-1 rounded-lg transition-colors ${hasChildren ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer' : 'opacity-0 cursor-default'}`}
              aria-label={isExpanded ? 'Thu gọn danh mục con' : 'Mở danh mục con'}
            >
              <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          </TooltipTrigger>
          {hasChildren && <TooltipContent>{isExpanded ? 'Thu gọn danh mục con' : 'Mở danh mục con'}</TooltipContent>}
        </Tooltip>

        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <Folder className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{cat.name}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300">
                  STT {cat.sortOrder}
                </span>
              </TooltipTrigger>
              <TooltipContent>Thứ tự hiển thị trong cùng cấp</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  Cấp {depth + 1}
                </span>
              </TooltipTrigger>
              <TooltipContent>Cấp vị trí trong cây danh mục</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`px-2 py-0.5 rounded-full text-xs ${cat.isActive ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                  {cat.isActive ? 'Hoạt động' : 'Tắt'}
                </span>
              </TooltipTrigger>
              <TooltipContent>{cat.isActive ? 'Danh mục đang có thể được chọn cho khóa học mới' : 'Danh mục đang bị ẩn khỏi luồng tạo khóa học'}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 text-xs text-zinc-400"><Hash className="w-3 h-3" />{cat.slug}</span>
              </TooltipTrigger>
              <TooltipContent>Slug dùng cho URL và bộ lọc</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-zinc-400">{cat.courseCount || 0} khóa học</span>
              </TooltipTrigger>
              <TooltipContent>Số khóa học đang thuộc danh mục này và danh mục con</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button
                  onClick={() => onMove(cat, 'up')}
                  disabled={!canMoveUp || isMoving}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
                  aria-label="Đưa danh mục lên trước"
                >
                  <ArrowUp className="w-4 h-4 text-zinc-500" />
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{canMoveUp ? 'Đưa lên trước trong cùng cấp' : 'Danh mục đã ở vị trí đầu trong cùng cấp'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button
                  onClick={() => onMove(cat, 'down')}
                  disabled={!canMoveDown || isMoving}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
                  aria-label="Đưa danh mục xuống sau"
                >
                  <ArrowDown className="w-4 h-4 text-zinc-500" />
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{canMoveDown ? 'Đưa xuống sau trong cùng cấp' : 'Danh mục đã ở vị trí cuối trong cùng cấp'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onToggleStatus(cat)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label={cat.isActive ? 'Vô hiệu hóa danh mục' : 'Kích hoạt danh mục'}
              >
                {cat.isActive
                  ? <ToggleRight className="w-4 h-4 text-primary" />
                  : <ToggleLeft className="w-4 h-4 text-zinc-400" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{cat.isActive ? 'Vô hiệu hóa danh mục' : 'Kích hoạt danh mục'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onEdit(cat)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors" aria-label="Chỉnh sửa danh mục">
                <Pencil className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Chỉnh sửa danh mục</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button
                  onClick={() => canDelete && onDelete(cat)}
                  disabled={!canDelete}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Xóa danh mục"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{deleteTooltip}</TooltipContent>
          </Tooltip>
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
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
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
