// ========================
// React Query Hooks: Admin Authentication
// Thay thế createAsyncThunk cho admin auth flows.
// ========================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/app/hooks';
import { setAdminUser, clearAdminUser } from '@/features/auth/adminAuthSlice';
import { setAccessToken } from '@/services/apiClient';
import { loginAdmin, getAdminMe, logoutAdmin, refreshAdminToken } from '@/services/adminAuthApi';
import type { LoginPayload } from '@/types/auth.types';

// ===== Query Keys =====
export const adminAuthKeys = {
  session: ['adminAuth', 'session'] as const,
  profile: ['adminAuth', 'profile'] as const,
};

// ===== useAdminLogin =====
export function useAdminLogin() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await loginAdmin(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }

      setAccessToken(response.data!.access_token, 'admin');

      const profileRes = await getAdminMe();
      return {
        user: profileRes.data!,
        accessToken: response.data!.access_token,
        message: response.message,
      };
    },
    onSuccess: (data) => {
      dispatch(setAdminUser({ user: data.user, accessToken: data.accessToken }));
      queryClient.setQueryData(adminAuthKeys.profile, data.user);
    },
  });
}

// ===== useAdminLogout =====
export function useAdminLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await logoutAdmin();
        return response;
      } finally {
        setAccessToken(null, 'admin');
      }
    },
    onSuccess: () => {
      dispatch(clearAdminUser());
      queryClient.removeQueries({ queryKey: adminAuthKeys.session });
      queryClient.removeQueries({ queryKey: adminAuthKeys.profile });
    },
  });
}

// ===== useInitializeAdminAuth =====
// Component sử dụng hook này cần tự sync data vào Redux qua useEffect.
export function useInitializeAdminAuth() {
  return useQuery({
    queryKey: adminAuthKeys.session,
    queryFn: async () => {
      const refreshRes = await refreshAdminToken();
      if (refreshRes.status === 'ERR' || !refreshRes.access_token) {
        throw new Error('Không có session admin.');
      }

      setAccessToken(refreshRes.access_token, 'admin');

      const profileRes = await getAdminMe();
      return {
        user: profileRes.data!,
        accessToken: refreshRes.access_token,
      };
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
