// ========================
// Redux Slice: Auth — Thin Client State Only
// Chỉ giữ sync reducers. Mọi API call giờ do React Query hooks xử lý.
// ========================
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, IUser } from '@/types/auth.types';

// ===== Initial State =====
const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true, // để khi F5 header không bị giật
};

// ===== Slice =====
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Set initialized = false khi không có auth state (lỗi refresh token)  */
    setInitialized: (state) => {
      state.isInitializing = false;
    },

    /** Set user + token khi React Query mutation thành công (login, OAuth, session recovery) */
    setUser: (state, action: PayloadAction<{ user: IUser; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isInitializing = false;
    },

    /** Xóa auth state khi logout hoặc session expired */
    clearUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
    },
  },
});

export const { setUser, clearUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;
