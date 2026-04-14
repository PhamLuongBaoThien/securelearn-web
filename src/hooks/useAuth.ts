// ========================
// React Query Hooks: Authentication (User)
// Thay thế createAsyncThunk — dùng useMutation/useQuery cho server state.
// Redux chỉ còn giữ sync state (user, token, isAuthenticated).
// ========================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/app/hooks';
import { setUser, clearUser } from '@/features/auth/authSlice';
import { setAccessToken } from '@/services/apiClient';
import {
  loginUser, registerUser, logoutUser, getMe, refreshToken, 
  updateProfile, deleteAccount, changePassword,
  forgotPasswordRequest, resetPasswordRequest, verifyOTPRequest,
  switchToInstructor,
} from '@/services/authApi';
import type { LoginPayload, RegisterPayload, ForgotPasswordPayload, VerifyOTPPayload, ResetPasswordPayload } from '@/types/auth.types';

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

// ===== useUpdateProfile =====
export function useUpdateProfile() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await updateProfile(formData);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data!;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authKeys.profile, updatedUser);
      // Sync Redux state để UI phản ánh thay đổi ngay
      const currentSession = queryClient.getQueryData(authKeys.session) as any;
      if (currentSession?.accessToken) {
        dispatch(setUser({ user: updatedUser, accessToken: currentSession.accessToken }));
      }
    },
  });
}

// ===== useDeleteAccount =====
export function useDeleteAccount() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await deleteAccount();
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      setAccessToken(null);
      dispatch(clearUser());
      queryClient.removeQueries({ queryKey: authKeys.session });
      queryClient.removeQueries({ queryKey: authKeys.profile });
    },
  });
}

// ===== useChangePassword =====
export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { oldPassword?: string; newPassword?: string }) => {
      const response = await changePassword(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response;
    },
  });
}

// ===== useForgotPassword =====
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      const response = await forgotPasswordRequest(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response;
    },
  });
}

// ===== useVerifyOTP =====
export function useVerifyOTP() {
  return useMutation({
    mutationFn: async (payload: VerifyOTPPayload) => {
      const response = await verifyOTPRequest(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response;
    },
  });
}

// ===== useResetPassword =====
export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      const response = await resetPasswordRequest(payload);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response;
    },
  });
}

// ===== useSwitchToInstructor =====
export function useSwitchToInstructor() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await switchToInstructor();
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data!; // The updated User profile
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authKeys.profile, updatedUser);
      // Sync Redux state
      const currentSession = queryClient.getQueryData(authKeys.session) as any;
      if (currentSession?.accessToken) {
        dispatch(setUser({ user: updatedUser, accessToken: currentSession.accessToken }));
      }
    },
  });
}
