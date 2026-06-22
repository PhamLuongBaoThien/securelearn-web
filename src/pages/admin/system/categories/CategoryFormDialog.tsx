import React, { useMemo, useState } from 'react';
import { Save, Hash, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { ICategory } from '@/types/admin.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
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

const Field: React.FC<{ label: string; children: React.ReactNode; helpText?: string }> = ({ label, children, helpText }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
    {children}
    {helpText && <p className="text-xs text-zinc-400 dark:text-zinc-500">{helpText}</p>}
  </div>
);

export const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({
  open,
  onOpenChange,
  initial,
  categories,
  onSave,
}) => {
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const getNextSortOrderForParent = React.useCallback((parentId: string | null, currentId?: string) => {
    const siblings = flatCategories.filter(
      (item) => (item.parentId ?? null) === parentId && item._id !== currentId
    );

    if (siblings.length === 0) return 0;
    return Math.max(...siblings.map((item) => item.sortOrder ?? 0)) + 1;
  }, [flatCategories]);

  const [form, setForm] = useState<FormState>({
    name: initial.name || '',
    description: initial.description || '',
    parentId: initial.parentId ?? null,
    sortOrder: String(initial.sortOrder ?? getNextSortOrderForParent(initial.parentId ?? null, initial._id)),
  });
  const [sortOrderTouched, setSortOrderTouched] = useState(false);

  React.useEffect(() => {
    setForm({
      name: initial.name || '',
      description: initial.description || '',
      parentId: initial.parentId ?? null,
      sortOrder: String(initial.sortOrder ?? getNextSortOrderForParent(initial.parentId ?? null, initial._id)),
    });
    setSortOrderTouched(false);
  }, [getNextSortOrderForParent, initial._id, initial.description, initial.name, initial.parentId, initial.sortOrder, open]);

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

  // Tạo cấu trúc cây đã lọc bỏ các danh mục không hợp lệ
  const filteredTree = useMemo(() => {
    const buildTree = (nodes: ICategory[]): ICategory[] => {
      return nodes
        .filter((node) => {
          if (blockedIds.has(node._id)) return false;
          const parentDepth = depthMap.get(node._id) || 1;
          return parentDepth + currentSubtreeHeight <= MAX_CATEGORY_DEPTH;
        })
        .map((node) => ({
          ...node,
          children: node.children ? buildTree(node.children) : [],
        }));
    };
    return buildTree(categories);
  }, [categories, blockedIds, depthMap, currentSubtreeHeight]);

  const slugPreview = autoSlug(form.name);

  const selectedParentLabel = useMemo(() => {
    if (form.parentId === null) return 'Danh mục gốc (Cấp cao nhất)';
    return trailMap.get(form.parentId) || 'Chọn danh mục cha';
  }, [form.parentId, trailMap]);

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục.');
      return;
    }

    const normalizedSortOrder = Number(form.sortOrder);
    if (!Number.isInteger(normalizedSortOrder) || normalizedSortOrder < 0) {
      toast.error('Thứ tự hiển thị phải là số nguyên từ 0 trở lên.');
      return;
    }

    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      parentId: form.parentId || null,
      sortOrder: String(normalizedSortOrder),
    });
    onOpenChange(false);
  };

  const renderCategoryItems = (items: ICategory[]) =>
    items.map((category) => {
      const hasChildren = Boolean(category.children?.length);
      const isSelected = form.parentId === category._id;
      const labelContent = (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate">{category.name}</span>
          {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </span>
      );

      if (hasChildren) {
        return (
          <DropdownMenuSub key={category._id}>
            <DropdownMenuSubTrigger
              className="min-w-56 cursor-pointer rounded-lg px-3 py-2 text-sm"
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  parentId: category._id,
                  sortOrder: !initial._id && !sortOrderTouched
                    ? String(getNextSortOrderForParent(category._id))
                    : prev.sortOrder,
                }));
              }}
            >
              {labelContent}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-56 rounded-xl p-1">
              {renderCategoryItems(category.children || [])}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }

      return (
        <DropdownMenuItem
          key={category._id}
          className="min-w-56 cursor-pointer rounded-lg px-3 py-2 text-sm"
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              parentId: category._id,
              sortOrder: !initial._id && !sortOrderTouched
                ? String(getNextSortOrderForParent(category._id))
                : prev.sortOrder,
            }));
          }}
        >
          {labelContent}
        </DropdownMenuItem>
      );
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial._id ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </DialogTitle>
          <DialogDescription>
            {initial._id
              ? `Cập nhật thông tin chi tiết cho danh mục "${initial.name}".`
              : 'Tạo danh mục mới để phân loại các khóa học trên hệ thống.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="Tên danh mục *">
            <Input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Tên danh mục, VD: Lập trình Website"
              autoFocus
            />
          </Field>

          <Field label="Slug URL">
            <div className={`${inputCls} flex items-center gap-2 text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/50 cursor-not-allowed select-none`}>
              <Hash className="w-4 h-4 shrink-0" />
              <span>{slugPreview || 'slug-se-duoc-tao-tu-dong'}</span>
            </div>
          </Field>

          <Field label="Mô tả">
            <textarea
              className={`${inputCls} resize-none h-20`}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả chi tiết hoặc ngắn gọn về danh mục..."
            />
          </Field>

          <Field label="Danh mục cha" helpText={`Danh mục chỉ được phép sâu tối đa ${MAX_CATEGORY_DEPTH} cấp.`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-between rounded-xl border-zinc-200 bg-background px-3 text-left text-sm font-normal dark:border-zinc-800"
                >
                  <span className="truncate text-zinc-900 dark:text-zinc-100">
                    {selectedParentLabel}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-[420px] min-w-[280px] overflow-y-auto rounded-xl p-1">
                <DropdownMenuItem
                  className="min-w-56 cursor-pointer rounded-lg px-3 py-2 text-sm border-b border-zinc-100 dark:border-zinc-800 mb-1"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      parentId: null,
                      sortOrder: !initial._id && !sortOrderTouched
                        ? String(getNextSortOrderForParent(null))
                        : prev.sortOrder,
                    }));
                  }}
                >
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3 font-medium">
                    <span className="truncate">Danh mục gốc (Cấp cao nhất)</span>
                    {form.parentId === null && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </span>
                </DropdownMenuItem>

                {filteredTree.length > 0 ? renderCategoryItems(filteredTree) : (
                  <DropdownMenuItem disabled className="rounded-lg px-3 py-2 text-sm text-zinc-400">
                    Không có danh mục cha hợp lệ
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>

          <Field label="Thứ tự hiển thị" helpText="Số nhỏ hơn sẽ xuất hiện trước trong cùng cấp danh mục.">
            <Input
              className={inputCls}
              type="number"
              min={0}
              step={1}
              value={form.sortOrder}
              onChange={(e) => {
                setSortOrderTouched(true);
                setForm((prev) => ({ ...prev, sortOrder: e.target.value }));
              }}
              placeholder="0"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {initial._id ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
