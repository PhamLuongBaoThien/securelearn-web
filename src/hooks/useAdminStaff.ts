import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createAdminStaff,
  deleteAdminStaff,
  getAdminStaff,
  updateAdminStaff,
  type AdminStaffPayload,
} from '@/services/adminApi';
import type { IAdminStaff } from '@/types/admin.types';

export const adminStaffKeys = {
  all: ['admin_staff'] as const,
};

const ensureOk = <T>(response: { status: 'OK' | 'ERR'; message?: string; data?: T }) => {
  if (response.status === 'ERR') {
    throw new Error(response.message || 'Thao tác nhân viên thất bại.');
  }

  return response.data;
};

export function useAdminStaff() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminStaffKeys.all,
    queryFn: async () => {
      const response = await getAdminStaff();
      return ensureOk<IAdminStaff[]>(response) || [];
    },
  });

  return {
    staff: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    invalidate: () => queryClient.invalidateQueries({ queryKey: adminStaffKeys.all }),
  };
}

export function useCreateAdminStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdminStaffPayload) => {
      const response = await createAdminStaff(payload);
      return ensureOk<IAdminStaff>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminStaffKeys.all });
      toast.success('Đã tạo tài khoản nhân viên thành công.');
    },
    onError: (error: unknown) => toast.error((error as Error).message || 'Lỗi khi tạo nhân viên'),
  });
}

export function useUpdateAdminStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AdminStaffPayload }) => {
      const response = await updateAdminStaff(id, data);
      return ensureOk<IAdminStaff>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminStaffKeys.all });
      toast.success('Đã cập nhật thông tin nhân viên.');
    },
    onError: (error: unknown) => toast.error((error as Error).message || 'Lỗi khi cập nhật nhân viên'),
  });
}

export function useDeleteAdminStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteAdminStaff(id);
      ensureOk(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminStaffKeys.all });
      toast.success('Đã xóa tài khoản nhân viên.');
    },
    onError: (error: unknown) => toast.error((error as Error).message || 'Lỗi khi xóa nhân viên'),
  });
}
