import React, { useMemo, useState } from 'react';
import { Plus, Tag, Loader2 } from 'lucide-react';
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
import { flattenCategories, findSiblingContext } from './category.utils';
import type { FormState } from './category.utils';
import { CategoryFormDialog } from './CategoryFormDialog';
import { CategoryRow } from './CategoryRow';

export const CategoryManager: React.FC = () => {
  const { data: categories = [], isLoading, error } = useAdminCategories();
  const createMutation = useCreateAdminCategory();
  const updateMutation = useUpdateAdminCategory();
  const statusMutation = useSetAdminCategoryStatus();
  const deleteMutation = useDeleteAdminCategory();
  const queryClient = useQueryClient();

  const [expandedIds, setExpandedIds] = useState<string[]>([]); // State này dùng để lưu trữ ID của các danh mục đang được mở rộng, danh mục mở rộng là các danh mục cha đang hiển thị danh mục con 
  const [dialogOpen, setDialogOpen] = useState(false); // State này dùng để kiểm soát trạng thái mở/đóng của dialog
  const [editItem, setEditItem] = useState<Partial<ICategory>>({}); // State này dùng để lưu trữ thông tin của danh mục đang được chỉnh sửa
  const [statusTarget, setStatusTarget] = useState<ICategory | null>(null); // State này dùng để lưu trữ thông tin của danh mục đang được thay đổi trạng thái
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null); // State này lưu thông tin danh mục cần xóa
  const [movingId, setMovingId] = useState<string | null>(null); // State này dùng để lưu trữ ID của danh mục đang được di chuyển

  React.useEffect(() => {
    if (categories.length > 0 && expandedIds.length === 0) { // lý do thêm điều kiện expandedIds.length === 0 là để khi component render lần đầu tiên hoặc khi danh mục thay đổi thì sẽ hiển thị 4 danh mục đầu tiên, các dunh mục còn lại thì muốn nhìn thấy cần
      setExpandedIds(categories.slice(0, 4).map((category) => category._id)); // slice(0, 4) là để lấy 4 danh mục đầu tiên, map((category) => category._id) là để lấy ID của 4 danh mục đầu tiên
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
        sortOrder: Number(data.sortOrder),
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

    // giúp giao diện cập nhật trước, server chạy ngầm bên dưới, nếu server có lỗi thì sẽ lấy lại dữ liệu cũ
    queryClient.setQueryData(adminCategoryKeys.all, (oldData: ICategory[] | undefined) => {
      if (!oldData) return oldData;
      const cloneTree = (nodes: ICategory[]): ICategory[] => // tạo một cây mới để tránh ảnh hưởng đến dữ liệu cũ
        nodes.map((node) => ({
          ...node,
          children: node.children ? cloneTree(node.children) : undefined,
        }));
      const newTree = cloneTree(oldData);
      const newContext = findSiblingContext(newTree, category._id); // tìm lại danh mục cần di chuyển trong cây mới
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
    } catch (err: any) {
      if (previousCategories) {
        queryClient.setQueryData(adminCategoryKeys.all, previousCategories);
      }
      toast.error(err.message || 'Không thể cập nhật thứ tự danh mục.');
    } finally {
      setMovingId(null);
    }
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

  const handleDelete = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success(`Đã xóa danh mục "${deleteTarget.name}".`);
        setDeleteTarget(null);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Không thể xóa danh mục.');
        setDeleteTarget(null);
      },
    });
  };

  return (
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
        description={`Danh mục "${statusTarget?.name}" sẽ không còn được chọn cho khóa học mới. Bạn có muốn tiếp tục?`}
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Quản lý Danh mục</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Thiết lập và phân loại các lĩnh vực học tập.</p>
        </div>
        <Button
          id="btn-add-category"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
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

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="font-semibold text-zinc-900 dark:text-white text-sm">Cấu trúc danh mục</span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400 ml-2" />}
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
  );
};
