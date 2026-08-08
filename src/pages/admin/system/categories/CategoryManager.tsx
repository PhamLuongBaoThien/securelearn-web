import React, { useMemo, useState } from 'react';
import { Plus, Tag, Loader2, RefreshCw, BookOpen, FolderOpen, Folder, CheckCircle, XCircle, Trash2 } from 'lucide-react';
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
  useMultiSetAdminCategoryStatus,
  useMultiDeleteAdminCategories,
  adminCategoryKeys,
} from '@/hooks/useAdminCategories';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { flattenCategories, findSiblingContext, getDescendantIds } from './category.utils';
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
  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data]);
  const isLoading = categoriesQuery.isLoading;
  const isFetching = categoriesQuery.isFetching;
  const error = categoriesQuery.error;

  const createMutation = useCreateAdminCategory();
  const updateMutation = useUpdateAdminCategory();
  const statusMutation = useSetAdminCategoryStatus();
  const deleteMutation = useDeleteAdminCategory();
  const multiStatusMutation = useMultiSetAdminCategoryStatus();
  const multiDeleteMutation = useMultiDeleteAdminCategories();
  const queryClient = useQueryClient();

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<ICategory>>({});
  const [statusTarget, setStatusTarget] = useState<ICategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);
  const [multiDisableOpen, setMultiDisableOpen] = useState(false);
  const [multiDeleteOpen, setMultiDeleteOpen] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const {
    selectedIds,
    toggle: toggleSelected,
    toggleAllOnPage,
    isAllSelectedOnPage,
    isSomeSelectedOnPage,
    clear: clearSelection,
  } = useMultiSelect();

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
  const categoryIds = useMemo(() => flatCategories.map((category) => category._id), [flatCategories]);
  const selectedCategories = useMemo(
    () => flatCategories.filter((category) => selectedIds.includes(category._id)),
    [flatCategories, selectedIds]
  );
  const selectedActiveCategories = useMemo(
    () => selectedCategories.filter((category) => category.isActive),
    [selectedCategories]
  );
  const selectedInactiveCategories = useMemo(
    () => selectedCategories.filter((category) => !category.isActive),
    [selectedCategories]
  );
  const selectedActiveIds = useMemo(
    () => selectedActiveCategories.map((category) => category._id),
    [selectedActiveCategories]
  );
  const selectedInactiveIds = useMemo(
    () => selectedInactiveCategories.map((category) => category._id),
    [selectedInactiveCategories]
  );
  const disableAffectedCategories = useMemo(() => {
    const selectedActiveSet = new Set(selectedActiveIds);
    const affectedIds = new Set(selectedActiveIds);

    for (const category of selectedActiveCategories) {
      for (const descendantId of getDescendantIds(category)) {
        affectedIds.add(descendantId);
      }
    }

    return flatCategories
      .filter((category) => affectedIds.has(category._id) && category.isActive)
      .map((category) => ({
        category,
        source: selectedActiveSet.has(category._id) ? 'selected' as const : 'cascade' as const,
      }));
  }, [flatCategories, selectedActiveCategories, selectedActiveIds]);
  const deletableSelectedCategories = useMemo(
    () => selectedCategories
      .filter((category) => (category.children || []).length === 0 && (category.publishedCourseCount ?? category.courseCount ?? 0) === 0),
    [selectedCategories]
  );
  const skippedDeleteCategories = useMemo(
    () => selectedCategories
      .filter((category) => (category.children || []).length > 0 || (category.publishedCourseCount ?? category.courseCount ?? 0) > 0),
    [selectedCategories]
  );
  const deletableSelectedIds = useMemo(
    () => deletableSelectedCategories.map((category) => category._id),
    [deletableSelectedCategories]
  );
  const skippedDeleteCount = skippedDeleteCategories.length;
  const isAllSelected = isAllSelectedOnPage(categoryIds);
  const isPartiallySelected = isSomeSelectedOnPage(categoryIds);
  const isMultiPending = multiStatusMutation.isPending || multiDeleteMutation.isPending;

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


  const notifyMultiResult = (result: { success: number; failed: number; failures: Array<{ message: string }> }, successMessage: string) => {
    if (result.failed > 0) {
      toast.warning(`${successMessage} ${result.success} thành công, ${result.failed} thất bại.`, {
        description: result.failures.slice(0, 2).map((failure) => failure.message).join(' '),
      });
      return;
    }

    toast.success(successMessage);
  };

  const handleMultiEnable = () => {
    if (selectedInactiveIds.length === 0) return;

    multiStatusMutation.mutate(
      { ids: selectedInactiveIds, isActive: true },
      {
        onSuccess: (result) => {
          notifyMultiResult(result, `Đã kích hoạt ${result.success} danh mục.`);
          clearSelection();
        },
        onError: (err: unknown) => toast.error((err as Error).message || 'Không thể kích hoạt các danh mục đã chọn.'),
      }
    );
  };

  const handleMultiDisable = () => {
    if (selectedActiveIds.length === 0) return;

    multiStatusMutation.mutate(
      { ids: selectedActiveIds, isActive: false },
      {
        onSuccess: (result) => {
          notifyMultiResult(result, `Đã vô hiệu hóa ${result.success} danh mục.`);
          setMultiDisableOpen(false);
          clearSelection();
        },
        onError: (err: unknown) => {
          toast.error((err as Error).message || 'Không thể vô hiệu hóa các danh mục đã chọn.');
          setMultiDisableOpen(false);
        },
      }
    );
  };

  const handleMultiDelete = () => {
    if (deletableSelectedIds.length === 0) return;

    multiDeleteMutation.mutate(deletableSelectedIds, {
      onSuccess: (result) => {
        notifyMultiResult(result, `Đã xóa ${result.success} danh mục.`);
        setMultiDeleteOpen(false);
        clearSelection();
      },
      onError: (err: unknown) => {
        toast.error((err as Error).message || 'Không thể xóa các danh mục đã chọn.');
        setMultiDeleteOpen(false);
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


        <ConfirmDialog
          open={multiDisableOpen}
          onOpenChange={setMultiDisableOpen}
          title="Vô hiệu hóa nhiều danh mục?"
          description={(
            <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
              <p>
                Bạn đang chuẩn bị vô hiệu hóa {selectedActiveCategories.length} danh mục đang hoạt động. Nếu có danh mục cha, các danh mục con đang hoạt động cũng sẽ bị tắt theo.
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="font-semibold text-amber-800 dark:text-amber-200">Sẽ vô hiệu hóa</p>
                {disableAffectedCategories.length > 0 ? (
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1 text-amber-800 dark:text-amber-100">
                    {disableAffectedCategories.map(({ category, source }) => (
                      <li key={category._id} className="flex items-center justify-between gap-3 rounded-md bg-white/70 px-2 py-1 dark:bg-zinc-950/30">
                        <span className="truncate font-medium">{category.name}</span>
                        <span className="shrink-0 text-xs text-amber-600 dark:text-amber-200">
                          {source === 'selected' ? 'Đã chọn' : 'Theo danh mục cha'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-amber-700 dark:text-amber-100">Không có danh mục đang hoạt động nào để vô hiệu hóa.</p>
                )}
              </div>
              {selectedInactiveCategories.length > 0 && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-200">Bỏ qua</p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-1 text-zinc-500 dark:text-zinc-400">
                    {selectedInactiveCategories.map((category) => (
                      <li key={category._id} className="flex items-center justify-between gap-3 rounded-md bg-white px-2 py-1 dark:bg-zinc-950/30">
                        <span className="truncate font-medium">{category.name}</span>
                        <span className="shrink-0 text-xs">Đã tắt sẵn</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Danh mục bị vô hiệu hóa sẽ không còn được chọn cho khóa học mới; các khóa học hiện tại vẫn tiếp tục hoạt động.
              </p>
            </div>
          )}
          confirmText="Vô hiệu hóa"
          isDestructive
          isPending={multiStatusMutation.isPending}
          onConfirm={handleMultiDisable}
        />

        <ConfirmDialog
          open={multiDeleteOpen}
          onOpenChange={setMultiDeleteOpen}
          title="Xóa nhiều danh mục vĩnh viễn?"
          description={(
            <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
              <p>
                Bạn đang chuẩn bị xóa {deletableSelectedCategories.length} danh mục đủ điều kiện. Hành động này không thể hoàn tác.
              </p>
              <div className="rounded-lg border border-red-200 bg-red-50/70 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                <p className="font-semibold text-red-700 dark:text-red-300">Sẽ xóa</p>
                {deletableSelectedCategories.length > 0 ? (
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1 text-red-700 dark:text-red-200">
                    {deletableSelectedCategories.map((category) => (
                      <li key={category._id} className="flex items-center justify-between gap-3 rounded-md bg-white/70 px-2 py-1 dark:bg-zinc-950/30">
                        <span className="truncate font-medium">{category.name}</span>
                        <span className="shrink-0 text-xs text-red-500 dark:text-red-300">{category.slug}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-red-600 dark:text-red-200">Không có danh mục nào đủ điều kiện xóa.</p>
                )}
              </div>
              {skippedDeleteCategories.length > 0 && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-200">Bỏ qua</p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-1 text-zinc-500 dark:text-zinc-400">
                    {skippedDeleteCategories.map((category) => {
                      const reason = (category.children || []).length > 0
                        ? `Có ${(category.children || []).length} danh mục con`
                        : `Có ${category.publishedCourseCount ?? category.courseCount ?? 0} khóa học đã xuất bản`;

                      return (
                        <li key={category._id} className="flex items-center justify-between gap-3 rounded-md bg-white px-2 py-1 dark:bg-zinc-950/30">
                          <span className="truncate font-medium">{category.name}</span>
                          <span className="shrink-0 text-xs">{reason}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Điều kiện xóa: danh mục không có danh mục con và không có khóa học đã xuất bản. Khóa học chưa xuất bản sẽ được tự gỡ danh mục.
              </p>
            </div>
          )}
          confirmText="Xóa"
          isDestructive
          isPending={multiDeleteMutation.isPending}
          onConfirm={handleMultiDelete}
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
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => toggleAllOnPage(categoryIds)}
                  disabled={categoryIds.length === 0 || isMultiPending}
                  className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700"
                  aria-label={isPartiallySelected ? 'Bỏ chọn danh mục đang chọn' : 'Chọn tất cả danh mục'}
                />
              </TooltipTrigger>
              <TooltipContent>{isAllSelected ? 'Bỏ chọn tất cả danh mục' : 'Chọn tất cả danh mục đang hiển thị'}</TooltipContent>
            </Tooltip>
            <Tag className="w-4 h-4 text-primary" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-semibold text-zinc-900 dark:text-white text-sm">Cấu trúc danh mục</span>
              </TooltipTrigger>
              <TooltipContent>Quản lý cây danh mục tối đa 4 cấp</TooltipContent>
            </Tooltip>
            {(isLoading || isFetching) && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}

            {selectedIds.length > 0 ? (
              <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">Đã chọn {selectedIds.length} danh mục</span>
                  </TooltipTrigger>
                  <TooltipContent>Các thao tác hàng loạt chỉ áp dụng cho nhóm đủ điều kiện</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button size="sm" variant="outline" onClick={handleMultiEnable} disabled={selectedInactiveIds.length === 0 || isMultiPending} className="h-8 gap-2">
                        {multiStatusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        Kích hoạt {selectedInactiveIds.length}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Kích hoạt các danh mục đang tắt trong nhóm đã chọn</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button size="sm" variant="outline" onClick={() => setMultiDisableOpen(true)} disabled={selectedActiveIds.length === 0 || isMultiPending} className="h-8 gap-2">
                        <XCircle className="h-3.5 w-3.5" />
                        Vô hiệu hóa {selectedActiveIds.length}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Vô hiệu hóa danh mục đang hoạt động; danh mục con cũng sẽ bị tắt</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button size="sm" variant="destructive" onClick={() => setMultiDeleteOpen(true)} disabled={deletableSelectedIds.length === 0 || isMultiPending} className="h-8 gap-2">
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa {deletableSelectedIds.length} đủ điều kiện
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Điều kiện xóa: không có danh mục con và không có khóa học đã xuất bản. Khóa học chưa xuất bản sẽ được gỡ danh mục.</TooltipContent>
                </Tooltip>
                {skippedDeleteCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-zinc-400 underline decoration-dotted underline-offset-2">Bỏ qua {skippedDeleteCount}</span>
                    </TooltipTrigger>
                    <TooltipContent>{skippedDeleteCount} danh mục được chọn không thể xóa vì có danh mục con hoặc có khóa học đã xuất bản</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button size="sm" variant="ghost" onClick={clearSelection} disabled={isMultiPending} className="h-8">Bỏ chọn</Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Xóa lựa chọn hiện tại</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-auto text-xs text-zinc-400">Dùng mũi tên để đổi vị trí trong cùng cấp</span>
                </TooltipTrigger>
                <TooltipContent>Thứ tự chỉ đổi giữa các danh mục cùng cấp</TooltipContent>
              </Tooltip>
            )}
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
                      selectedIds={selectedIds}
                      onToggleSelect={toggleSelected}
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
