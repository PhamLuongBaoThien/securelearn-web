import React, { useMemo, useState } from 'react';
import { Plus, Tag, Loader2, RefreshCw, BookOpen, FolderOpen, Folder } from 'lucide-react';
import { toast } from 'sonner';
import type { ICategory } from '@/types/admin.types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAdminCategories,
  useCreateAdminCategory,
  useSetAdminCategoryStatus,
  useUpdateAdminCategory,
  useDeleteAdminCategory,
  adminCategoryKeys,
} from '@/hooks/useAdminCategories';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { flattenCategories, findSiblingContext } from './category.utils';
import type { FormState } from './category.utils';
import { CategoryFormDialog } from './CategoryFormDialog';
import { CategoryRow } from './CategoryRow';

const cardClass = 'rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

const KpiCard: React.FC<{
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, icon }) => (
  <div className={`${cardClass} p-5`}>
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        </p>
        {sub && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
      </div>
      <div className="shrink-0 self-center text-zinc-300 dark:text-zinc-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
    </div>
  </div>
);

export const CategoryManager: React.FC = () => {
  const categoriesQuery = useAdminCategories();
  const categories = categoriesQuery.data || [];
  const isLoading = categoriesQuery.isLoading;
  const isFetching = categoriesQuery.isFetching;
  const error = categoriesQuery.error;

  const createMutation = useCreateAdminCategory();
  const updateMutation = useUpdateAdminCategory();
  const statusMutation = useSetAdminCategoryStatus();
  const deleteMutation = useDeleteAdminCategory();
  const queryClient = useQueryClient();

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<ICategory>>({});
  const [statusTarget, setStatusTarget] = useState<ICategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (categories.length > 0 && expandedIds.length === 0) {
      setExpandedIds(categories.slice(0, 4).map((category) => category._id));
    }
  }, [categories, expandedIds.length]);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const totalCategories = flatCategories.length;
  const totalChildren = flatCategories.filter((category) => category.parentId).length;
  const totalRoots = flatCategories.filter((category) => !category.parentId).length;
  const totalCourses = categories.reduce((sum, category) => sum + (category.courseCount || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const handleOpenAdd = () => {
    const nextRootSortOrder = categories.length > 0
      ? Math.max(...categories.map((category) => category.sortOrder ?? 0)) + 1
      : 0;
    setEditItem({ sortOrder: nextRootSortOrder });
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
            sortOrder: Number(data.sortOrder),
          },
        },
        {
          onSuccess: () => {
            toast.success('Đã cập nhật danh mục.');
            setDialogOpen(false);
          },
          onError: (err: unknown) => toast.error((err as Error).message || 'Không thể cập nhật danh mục.'),
        }
      );
      return;
    }

    createMutation.mutate(
      {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        sortOrder: Number(data.sortOrder),
      },
      {
        onSuccess: (created) => {
          toast.success('Đã thêm danh mục.');
          setDialogOpen(false);
          if (!data.parentId) {
            setExpandedIds((prev) => prev.includes(created._id) ? prev : [...prev, created._id]);
          }
        },
        onError: (err: unknown) => toast.error((err as Error).message || 'Không thể tạo danh mục.'),
      }
    );
  };

  const handleMove = async (category: ICategory, direction: 'up' | 'down') => {
    const context = findSiblingContext(categories, category._id);
    if (!context) return;

    const nextIndex = direction === 'up' ? context.index - 1 : context.index + 1;
    if (nextIndex < 0 || nextIndex >= context.siblings.length) return;

    const reordered = [...context.siblings];
    const [moved] = reordered.splice(context.index, 1);
    reordered.splice(nextIndex, 0, moved);

    const updates = reordered
      .map((item, index) => ({ id: item._id, sortOrder: index, currentSortOrder: item.sortOrder ?? 0 }))
      .filter((item) => item.currentSortOrder !== item.sortOrder);

    if (updates.length === 0) {
      toast.info('Thứ tự hiện tại đã đúng.');
      return;
    }

    const previousCategories = queryClient.getQueryData<ICategory[]>(adminCategoryKeys.all);

    queryClient.setQueryData(adminCategoryKeys.all, (oldData: ICategory[] | undefined) => {
      if (!oldData) return oldData;
      const cloneTree = (nodes: ICategory[]): ICategory[] =>
        nodes.map((node) => ({
          ...node,
          children: node.children ? cloneTree(node.children) : undefined,
        }));
      const newTree = cloneTree(oldData);
      const newContext = findSiblingContext(newTree, category._id);
      if (newContext) {
        const [movedNode] = newContext.siblings.splice(newContext.index, 1);
        const newIdx = direction === 'up' ? newContext.index - 1 : newContext.index + 1;
        newContext.siblings.splice(newIdx, 0, movedNode);
        newContext.siblings.forEach((item, idx) => {
          item.sortOrder = idx;
        });
      }
      return newTree;
    });

    setMovingId(category._id);
    try {
      for (const update of updates) {
        await updateMutation.mutateAsync({
          id: update.id,
          payload: { sortOrder: update.sortOrder },
        });
      }
      toast.success(direction === 'up' ? 'Đã đưa danh mục lên trên.' : 'Đã đưa danh mục xuống dưới.');
    } catch (err: unknown) {
      if (previousCategories) {
        queryClient.setQueryData(adminCategoryKeys.all, previousCategories);
      }
      toast.error((err as Error).message || 'Không thể cập nhật thứ tự danh mục.');
    } finally {
      setMovingId(null);
    }
  };

  const handleToggleStatus = (category: ICategory) => {
    if (category.isActive) {
      setStatusTarget(category);
    } else {
      statusMutation.mutate(
        { id: category._id, isActive: true },
        {
          onSuccess: () => toast.success('Đã kích hoạt danh mục.'),
          onError: (err: unknown) => toast.error((err as Error).message || 'Không thể kích hoạt danh mục.'),
        }
      );
    }
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
        onError: (err: unknown) => {
          toast.error((err as Error).message || 'Không thể vô hiệu hóa danh mục.');
          setStatusTarget(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success(`Đã xóa danh mục "${deleteTarget.name}".`);
        setDeleteTarget(null);
      },
      onError: (err: unknown) => {
        toast.error((err as Error).message || 'Không thể xóa danh mục.');
        setDeleteTarget(null);
      },
    });
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
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
          description={
            statusTarget
              ? statusTarget.courseCount > 0
                ? `Danh mục "${statusTarget.name}" đang chứa ${statusTarget.courseCount} khóa học. Việc vô hiệu hóa sẽ ngăn cản việc tạo khóa học mới thuộc danh mục này, nhưng các khóa học hiện tại vẫn tiếp tục hoạt động. Bạn có chắc chắn muốn tắt?`
                : `Danh mục "${statusTarget.name}" sẽ không còn được chọn cho khóa học mới. Bạn có muốn tiếp tục?`
              : ''
          }
          confirmText="Vô hiệu hóa"
          isDestructive
          onConfirm={handleDisable}
        />

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          title="Xóa Danh mục vĩnh viễn?"
          description={`Bạn đang chuẩn bị xóa danh mục "${deleteTarget?.name}". Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?`}
          confirmText="Xóa"
          isDestructive
          onConfirm={handleDelete}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Quản lý Danh mục</h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">Thiết lập và phân loại các lĩnh vực học tập cho hệ thống khóa học.</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => categoriesQuery.refetch()}
                  disabled={isFetching}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Làm mới danh sách danh mục</p>
              </TooltipContent>
            </Tooltip>
            <Button
              id="btn-add-category"
              onClick={handleOpenAdd}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Thêm Danh mục
            </Button>
          </div>
        </div>

        {error ? (
          <div className="bg-white dark:bg-zinc-900/40 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 text-sm text-red-600 dark:text-red-400">
            {(error as Error).message || 'Không thể tải danh mục.'}
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label="Tổng danh mục"
            value={totalCategories}
            sub="Tổng tất cả các cấp"
            icon={<Tag className="h-5 w-5 text-blue-500" />}
          />
          <KpiCard
            label="Danh mục gốc"
            value={totalRoots}
            sub="Danh mục cấp cao nhất"
            icon={<FolderOpen className="h-5 w-5 text-amber-500" />}
          />
          <KpiCard
            label="Danh mục con"
            value={totalChildren}
            sub="Danh mục cấp 2, 3, 4"
            icon={<Folder className="h-5 w-5 text-indigo-500" />}
          />
          <KpiCard
            label="Tổng khóa học"
            value={totalCourses}
            sub="Thuộc tất cả danh mục"
            icon={<BookOpen className="h-5 w-5 text-emerald-500" />}
          />
        </div>

        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <span className="font-semibold text-zinc-900 dark:text-white text-sm">Cấu trúc danh mục</span>
            {(isLoading || isFetching) && <Loader2 className="w-4 h-4 animate-spin text-zinc-400 ml-2" />}
            <span className="ml-auto text-xs text-zinc-400">Dùng mũi tên để đổi vị trí trong cùng cấp</span>
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
                (() => {
                  const siblingContext = findSiblingContext(categories, category._id);
                  const siblingCount = siblingContext?.siblings.length ?? 0;
                  const siblingIndex = siblingContext?.index ?? 0;

                  return (
                    <CategoryRow
                      key={category._id}
                      cat={category}
                      expandedIds={expandedIds}
                      siblingIndex={siblingIndex}
                      siblingCount={siblingCount}
                      isMoving={movingId !== null}
                      onToggleExpand={toggleExpand}
                      onEdit={handleOpenEdit}
                      onMove={handleMove}
                      onToggleStatus={handleToggleStatus}
                      onDelete={(item) => setDeleteTarget(item)}
                    />
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
