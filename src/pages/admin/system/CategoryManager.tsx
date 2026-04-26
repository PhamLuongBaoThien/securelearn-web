import React, { useMemo, useState } from 'react';
import {
  Plus,
  ChevronRight,
  Pencil,
  Trash2,
  Tag,
  Save,
  Hash,
  Folder,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ICategory } from '@/types/admin.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  useAdminCategories,
  useCreateAdminCategory,
  useSetAdminCategoryStatus,
  useUpdateAdminCategory,
} from '@/hooks/useAdminCategories';

const inputCls = 'w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

interface FormState {
  name: string;
  description: string;
  parentId: string | null;
}

const MAX_CATEGORY_DEPTH = 4;

const autoSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const flattenCategories = (categories: ICategory[]): ICategory[] => {
  const result: ICategory[] = [];

  const visit = (items: ICategory[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children?.length) visit(item.children);
    }
  };

  visit(categories);
  return result;
};

const getCategoryDepthMap = (categories: ICategory[]) => {
  const depthMap = new Map<string, number>();

  const visit = (items: ICategory[], depth: number) => {
    for (const item of items) {
      depthMap.set(item._id, depth);
      if (item.children?.length) visit(item.children, depth + 1);
    }
  };

  visit(categories, 1);
  return depthMap;
};

const getSubtreeHeight = (category: ICategory): number => {
  if (!category.children?.length) return 1;
  return 1 + Math.max(...category.children.map((child) => getSubtreeHeight(child)));
};

const getCategoryTrailMap = (categories: ICategory[]) => {
  const trailMap = new Map<string, string>();

  const visit = (items: ICategory[], parentTrail = '') => {
    for (const item of items) {
      const trail = parentTrail ? `${parentTrail} > ${item.name}` : item.name;
      trailMap.set(item._id, trail);
      if (item.children?.length) visit(item.children, trail);
    }
  };

  visit(categories);
  return trailMap;
};

const getDescendantIds = (category: ICategory): string[] => {
  const collected: string[] = [];

  const visit = (node: ICategory) => {
    for (const child of node.children || []) {
      collected.push(child._id);
      visit(child);
    }
  };

  visit(category);
  return collected;
};

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Partial<ICategory>;
  categories: ICategory[];
  onSave: (data: FormState) => void;
}

const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({
  open,
  onOpenChange,
  initial,
  categories,
  onSave,
}) => {
  const [form, setForm] = useState<FormState>({
    name: initial.name || '',
    description: initial.description || '',
    parentId: initial.parentId ?? null,
  });

  React.useEffect(() => {
    setForm({
      name: initial.name || '',
      description: initial.description || '',
      parentId: initial.parentId ?? null,
    });
  }, [initial._id, open]);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
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

    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      parentId: form.parentId || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial._id ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục'}</DialogTitle>
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
              onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value || null }))}
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

const CategoryRow: React.FC<{
  cat: ICategory;
  depth?: number;
  expandedIds: string[];
  onToggleExpand: (id: string) => void;
  onEdit: (cat: ICategory) => void;
  onToggleStatus: (cat: ICategory) => void;
  onDelete: (cat: ICategory) => void;
}> = ({ cat, depth = 0, expandedIds, onToggleExpand, onEdit, onToggleStatus, onDelete }) => {
  const isExpanded = expandedIds.includes(cat._id);
  const hasChildren = (cat.children || []).length > 0;

  return (
    <>
      <div className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group ${depth > 0 ? 'pl-10 border-l-2 border-zinc-100 dark:border-zinc-800 ml-4' : ''}`}>
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

      {hasChildren && isExpanded && (cat.children || []).map((child) => (
        <CategoryRow
          key={child._id}
          cat={child}
          depth={depth + 1}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

export const CategoryManager: React.FC = () => {
  const { data: categories = [], isLoading, error } = useAdminCategories();
  const createMutation = useCreateAdminCategory();
  const updateMutation = useUpdateAdminCategory();
  const statusMutation = useSetAdminCategoryStatus();

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<ICategory>>({});
  const [statusTarget, setStatusTarget] = useState<ICategory | null>(null);

  React.useEffect(() => {
    if (categories.length > 0 && expandedIds.length === 0) {
      setExpandedIds(categories.slice(0, 4).map((category) => category._id));
    }
  }, [categories, expandedIds.length]);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const totalCategories = flatCategories.length;
  const totalChildren = flatCategories.filter((category) => category.parentId).length;
  const totalRoots = flatCategories.filter((category) => !category.parentId).length;
  const totalCourses = flatCategories.reduce((sum, category) => sum + (category.courseCount || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const handleOpenAdd = () => {
    setEditItem({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: ICategory) => {
    setEditItem(category);
    setDialogOpen(true);
  };

  const handleSave = (data: FormState) => {
    if (editItem._id) {
      updateMutation.mutate(
        {
          id: editItem._id,
          payload: {
            name: data.name,
            description: data.description,
            parentId: data.parentId,
          },
        },
        {
          onSuccess: () => toast.success('Đã cập nhật danh mục.'),
          onError: (err: any) => toast.error(err.message || 'Không thể cập nhật danh mục.'),
        }
      );
      return;
    }

    createMutation.mutate(
      {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
      },
      {
        onSuccess: (created) => {
          toast.success('Đã thêm danh mục.');
          if (!data.parentId) {
            setExpandedIds((prev) => prev.includes(created._id) ? prev : [...prev, created._id]);
          }
        },
        onError: (err: any) => toast.error(err.message || 'Không thể tạo danh mục.'),
      }
    );
  };

  const handleToggleStatus = (category: ICategory) => {
    statusMutation.mutate(
      { id: category._id, isActive: !category.isActive },
      {
        onSuccess: () => toast.success(category.isActive ? 'Đã vô hiệu hóa danh mục.' : 'Đã kích hoạt danh mục.'),
        onError: (err: any) => toast.error(err.message || 'Không thể cập nhật trạng thái danh mục.'),
      }
    );
  };

  const handleDisable = () => {
    if (!statusTarget) return;

    statusMutation.mutate(
      { id: statusTarget._id, isActive: false },
      {
        onSuccess: () => {
          toast.success(`Đã vô hiệu hóa danh mục "${statusTarget.name}".`);
          setStatusTarget(null);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Không thể vô hiệu hóa danh mục.');
          setStatusTarget(null);
        },
      }
    );
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out space-y-6">
      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editItem}
        categories={categories}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(open) => { if (!open) setStatusTarget(null); }}
        title="Vô hiệu hóa Danh mục?"
        description={`Danh mục "${statusTarget?.name}" sẽ không còn được chọn cho khóa học mới. Bạn có muốn tiếp tục?`}
        confirmText="Vô hiệu hóa"
        isDestructive
        onConfirm={handleDisable}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Quản lý Danh mục</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Thiết lập và phân loại các lĩnh vực học tập.</p>
        </div>
        <Button
          id="btn-add-category"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Thêm Danh mục
        </Button>
      </div>

      {error ? (
        <div className="bg-white dark:bg-zinc-900/40 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 text-sm text-red-600 dark:text-red-400">
          {(error as Error).message || 'Không thể tải danh mục.'}
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng danh mục', value: totalCategories },
          { label: 'Gốc', value: totalRoots },
          { label: 'Con', value: totalChildren },
          { label: 'Tổng khóa học', value: totalCourses },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="font-semibold text-zinc-900 dark:text-white text-sm">Cấu trúc danh mục</span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400 ml-2" />}
        </div>

        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 dark:text-zinc-400">
            Chưa có danh mục nào.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {categories.map((category) => (
              <CategoryRow
                key={category._id}
                cat={category}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onEdit={handleOpenEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={(item) => setStatusTarget(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
