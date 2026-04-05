// ========================
// React Query Hooks: Authentication (User)
// Thay thế createAsyncThunk — dùng useMutation/useQuery cho server state.
// Redux chỉ còn giữ sync state (user, token, isAuthenticated).
// ========================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/app/hooks';
import { setUser, clearUser } from '@/features/auth/authSlice';
import { setAccessToken } from '@/services/apiClient';
import { loginUser, registerUser, logoutUser, getMe, refreshToken } from '@/services/authApi';
import type { LoginPayload, RegisterPayload } from '@/types/auth.types';

// ===== Query Keys =====
export const authKeys = {
  session: ['auth', 'session'] as const,
  profile: ['auth', 'profile'] as const,
};

// ===== useLogin =====
// Gọi API login + lấy profile → sync vào Redux
export function useLogin() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await loginUser(payload); // payload ở đây là email và password
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }

      // Cập nhật token vào apiClient
      setAccessToken(response.data!.access_token);

      // Lấy profile đầy đủ
      const profileRes = await getMe();
      return {
        user: profileRes.data!,
        accessToken: response.data!.access_token,
        message: response.message,
      };
    },
    onSuccess: (data) => {
      dispatch(setUser({ user: data.user, accessToken: data.accessToken }));
      queryClient.setQueryData(authKeys.profile, data.user);
    },
  });
}

// ===== useRegister =====
// Gọi API đăng ký — không tự động đăng nhập
export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await registerUser(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response;
    },
  });
}

// ===== useLogout =====
// Gọi API logout + xóa state
export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await logoutUser();
        return response;
      } finally {
        setAccessToken(null);
      }
    },
    onSuccess: () => {
      dispatch(clearUser());
      // Xóa toàn bộ cache React Query liên quan auth
      queryClient.removeQueries({ queryKey: authKeys.session });
      queryClient.removeQueries({ queryKey: authKeys.profile });
    },
  });
}

// ===== useInitializeAuth =====
// Khôi phục session khi app khởi động — dùng refresh token cookie.
// Component sử dụng hook này cần tự sync data vào Redux qua useEffect.
export function useInitializeAuth() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: async () => {
      // Thử refresh token — cookie tự gửi
      const refreshRes = await refreshToken();
      if (refreshRes.status === 'ERR' || !refreshRes.access_token) {
        throw new Error('Không có session.');
      }

      // Cập nhật token mới
      setAccessToken(refreshRes.access_token);

      // Lấy profile
      const profileRes = await getMe();
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
