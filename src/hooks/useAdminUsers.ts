import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUsers, lockUser, unlockUser } from '@/services/adminApi';
import { getEffectiveUserStatus } from '@/pages/admin/users/userList/constants';

export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const useAdminUsers = (filters: UserFilters = {}) => {
  const queryClient = useQueryClient();
  const queryKey = ['admin_users', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => getUsers(filters),
    placeholderData: (prev) => prev,
  });

  const lockMut = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => lockUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Đã khóa tài khoản.');
    },
    onError: (e: unknown) => toast.error((e as Error).message || 'Lỗi khóa tài khoản'),
  });

  const unlockMut = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) => unlockUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Đã mở khóa tài khoản.');
    },
    onError: (e: unknown) => toast.error((e as Error).message || 'Lỗi mở khóa tài khoản'),
  });

  const users = (query.data?.data?.users ?? []).map((user) => ({
    ...user,
    status: getEffectiveUserStatus(user),
  }));
  const total = query.data?.data?.total ?? 0;
  const totalPages = query.data?.data?.totalPages ?? 1;

  return {
    users,
    total,
    totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['admin_users'] }),
    lockMut,
    unlockMut,
  };
};
