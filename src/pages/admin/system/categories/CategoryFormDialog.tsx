
import React, { useMemo, useState } from 'react';
import { Save, Hash } from 'lucide-react';
import { toast } from 'sonner';
import type { ICategory } from '@/types/admin.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  MAX_CATEGORY_DEPTH,
  inputCls,
  autoSlug,
  flattenCategories,
  getCategoryDepthMap,
  getCategoryTrailMap,
  getSubtreeHeight,
  getDescendantIds,
} from './category.utils';
import type { FormState } from './category.utils';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Partial<ICategory>;
  categories: ICategory[];
  onSave: (data: FormState) => void;
}

export const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({
  open,
  onOpenChange,
  initial,
  categories,
  onSave,
}) => {
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const getNextOrderForParent = React.useCallback((parentId: string | null, currentId?: string) => {
    const siblings = flatCategories.filter(
      (item) => (item.parentId ?? null) === parentId && item._id !== currentId
    );

    if (siblings.length === 0) return 0;
    return Math.max(...siblings.map((item) => item.order ?? 0)) + 1;
  }, [flatCategories]);

  const [form, setForm] = useState<FormState>({
    name: initial.name || '',
    description: initial.description || '',
    parentId: initial.parentId ?? null,
    order: String(initial.order ?? getNextOrderForParent(initial.parentId ?? null, initial._id)),
  });
  const [orderTouched, setOrderTouched] = useState(false);

  React.useEffect(() => {
    setForm({
      name: initial.name || '',
      description: initial.description || '',
      parentId: initial.parentId ?? null,
      order: String(initial.order ?? getNextOrderForParent(initial.parentId ?? null, initial._id)),
    });
    setOrderTouched(false);
  }, [getNextOrderForParent, initial._id, initial.description, initial.name, initial.order, initial.parentId, open]);

  const depthMap = useMemo(() => getCategoryDepthMap(categories), [categories]);
  const trailMap = useMemo(() => getCategoryTrailMap(categories), [categories]);
  const blockedIds = useMemo(() => {
    if (!initial._id) return new Set<string>();
    const current = flatCategories.find((item) => item._id === initial._id);
    return new Set([initial._id, ...(current ? getDescendantIds(current) : [])] as string[]);
  }, [flatCategories, initial._id]);

  const currentSubtreeHeight = useMemo(() => {
    if (!initial._id) return 1;
    const current = flatCategories.find((item) => item._id === initial._id);
    return current ? getSubtreeHeight(current) : 1;
  }, [flatCategories, initial._id]);

  const availableParents = flatCategories.filter((item) => {
    if (blockedIds.has(item._id)) return false;
    const parentDepth = depthMap.get(item._id) || 1;
    return parentDepth + currentSubtreeHeight <= MAX_CATEGORY_DEPTH;
  });
  const slugPreview = autoSlug(form.name);

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục.');
      return;
    }

    const normalizedOrder = Number(form.order);
    if (!Number.isInteger(normalizedOrder) || normalizedOrder < 0) {
      toast.error('Thứ tự hiển thị phải là số nguyên từ 0 trở lên.');
      return;
    }

    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      parentId: form.parentId || null,
      order: String(normalizedOrder),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial._id
              ? `Chỉnh sửa: ${trailMap.get(initial._id) || initial.name}`
              : 'Thêm Danh mục'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tên danh mục</label>
            <Input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Tên danh mục..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Slug URL</label>
            <div className={`${inputCls} flex items-center gap-2 text-zinc-500 dark:text-zinc-400`}>
              <Hash className="w-4 h-4 shrink-0" />
              <span>{slugPreview || 'slug-se-duoc-tao-tu-dong'}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Mô tả</label>
            <textarea
              className={`${inputCls} resize-none h-20`}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Danh mục cha</label>
            <Select
              className={inputCls}
              value={form.parentId || ''}
              onChange={(e) => {
                const nextParentId = e.target.value || null;
                setForm((prev) => ({
                  ...prev,
                  parentId: nextParentId,
                  order: !initial._id && !orderTouched
                    ? String(getNextOrderForParent(nextParentId))
                    : prev.order,
                }));
              }}
            >
              <option value="">Danh mục gốc</option>
              {availableParents.map((category) => (
                <option key={category._id} value={category._id}>
                  {trailMap.get(category._id) || category.name}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-zinc-400">
              Danh mục chỉ được phép sâu tối đa {MAX_CATEGORY_DEPTH} cấp.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Thứ tự hiển thị</label>
            <Input
              className={inputCls}
              type="number"
              min={0}
              step={1}
              value={form.order}
              onChange={(e) => {
                setOrderTouched(true);
                setForm((prev) => ({ ...prev, order: e.target.value }));
              }}
              placeholder="0"
            />
            <p className="mt-1.5 text-xs text-zinc-400">
              Số nhỏ hơn sẽ xuất hiện trước trong cùng cấp danh mục.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Save className="w-4 h-4" /> Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
