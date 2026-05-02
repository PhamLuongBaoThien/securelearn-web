import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getRolePermissions, createRole, updateRolePermissions, deleteRole } from '@/services/adminApi';

export const useAdminRoles = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['role_permissions'],
    queryFn: getRolePermissions,
  });

  const createMut = useMutation({
    mutationFn: ({ roleKey, label, color }: { roleKey: string; label: string; color: string }) =>
      createRole({ roleKey, label, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
    },
    // Các xử lý toast cụ thể được giữ lại để xử lý linh hoạt ở nơi gọi hook, hoặc gộp luôn ở đây nếu muốn đồng nhất.
  });

  const updateMut = useMutation({
    mutationFn: ({ roleKey, data }: { roleKey: string; data: { label?: string; color?: string; permissions?: string[] } }) =>
      updateRolePermissions(roleKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (roleKey: string) => deleteRole(roleKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
      toast.success('Đã xóa vai trò.');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    roles: query.data?.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    response: query.data,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['role_permissions'] }),
    createMut,
    updateMut,
    deleteMut,
  };
};
