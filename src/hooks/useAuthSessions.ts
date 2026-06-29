import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveSessions, revokeActiveSession, revokeOtherSessions } from '@/services/authApi';

export const authSessionKeys = {
  all: ['auth', 'sessions'] as const,
};

export const useActiveSessions = () =>
  useQuery({
    queryKey: authSessionKeys.all,
    queryFn: async () => {
      const response = await getActiveSessions();
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải các phiên đăng nhập.');
      }
      return response.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await revokeActiveSession(sessionId);
      if (response.status === 'ERR') throw new Error(response.message);
      return response;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authSessionKeys.all }),
  });
};

export const useRevokeOtherSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await revokeOtherSessions();
      if (response.status === 'ERR') throw new Error(response.message);
      return response.data?.revokedCount ?? 0;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authSessionKeys.all }),
  });
};