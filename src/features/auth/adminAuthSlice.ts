// ========================
// Redux Slice: Admin Auth — Thin Client State Only
// Chỉ giữ sync reducers. Mọi API call giờ do React Query hooks xử lý.
// ========================
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, IUser } from '@/types/auth.types';

// ===== Initial State =====
const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

// ===== Slice =====
const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    /** Set admin user + token khi React Query mutation thành công */
    setAdminUser: (state, action: PayloadAction<{ user: IUser; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },

    /** Xóa admin auth state khi logout hoặc session expired */
    clearAdminUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAdminUser, clearAdminUser } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
