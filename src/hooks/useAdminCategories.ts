import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  createCategory,
  updateCategory,
  setCategoryStatus,
  deleteCategory,
} from '@/services/adminApi';
import { categoryKeys } from '@/hooks/usePublicCourseCategories';
import type { ICategory } from '@/types/admin.types';

export const adminCategoryKeys = {
  all: ['admin', 'categories'] as const,
};

export function useAdminCategories() {
  return useQuery({
    queryKey: adminCategoryKeys.all,
    queryFn: async () => {
      const response = await getCategories();
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data || [];
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      parentId?: string | null;
      sortOrder?: number;
    }) => {
      const response = await createCategory(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: {
      id: string;
      payload: {
        name?: string;
        description?: string;
        parentId?: string | null;
        sortOrder?: number;
        isActive?: boolean;
      };
    }) => {
      const response = await updateCategory(id, payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useSetAdminCategoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await setCategoryStatus(id, isActive);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data as ICategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteCategory(id);
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Xóa danh mục thất bại');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
