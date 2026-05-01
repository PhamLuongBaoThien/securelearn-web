// ========================
// Redux Slice: Admin Auth — Thin Client State Only
// Chỉ giữ sync reducers. Mọi API call giờ do React Query hooks xử lý.
// ========================
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AdminAuthState, IAdminUser } from '@/types/auth.types';

// ===== Initial State =====
const initialState: AdminAuthState = {
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
    setAdminUser: (state, action: PayloadAction<{ user: IAdminUser; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },

    /** Update admin user (chỉ cập nhật thông tin user, giữ nguyên token) */
    updateAdminUser: (state, action: PayloadAction<{ user: IAdminUser }>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload.user };
      }
    },

    /** Xóa admin auth state khi logout hoặc session expired */
    clearAdminUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAdminUser, updateAdminUser, clearAdminUser } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
