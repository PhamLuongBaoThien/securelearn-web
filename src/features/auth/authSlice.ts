// ========================
// Redux Slice: Auth — Thin Client State Only
// Chỉ giữ sync reducers. Mọi API call giờ do React Query hooks xử lý.
// ========================
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, IUser } from '@/types/auth.types';

// ===== localStorage helpers =====
// Chỉ lưu user profile (public info), KHÔNG lưu accessToken (bảo mật)
const AUTH_USER_KEY   = 'sl_auth_user';
const AUTH_STATUS_KEY = 'sl_auth_status';

/**
 * Đọc trạng thái khởi đầu từ localStorage một cách đồng bộ.
 *
 * Trả về:
 *  - { user, status: 'authenticated' } — đã đăng nhập, có data → render avatar ngay
 *  - { user: null, status: 'guest'  } — đã đăng xuất chủ động → render nút đăng nhập ngay
 *  - null                             — lần đầu vào web / chưa xác định → cần gọi API check
 */
function loadAuthFromStorage(): { user: IUser | null; status: 'authenticated' | 'guest' } | null {
  try {
    const status = localStorage.getItem(AUTH_STATUS_KEY) as 'authenticated' | 'guest' | null;
    if (!status) return null; // Chưa từng đăng nhập/đăng xuất — unknown state

    if (status === 'guest') {
      return { user: null, status: 'guest' };
    }

    // status === 'authenticated' → đọc user data
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IUser;
    if (!parsed?._id || !parsed?.email) return null;
    return { user: parsed, status: 'authenticated' };
  } catch {
    return null;
  }
}

function saveAuthToStorage(user: IUser): void {
  try {
    localStorage.setItem(AUTH_STATUS_KEY, 'authenticated');
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch { /* bỏ qua lỗi private/incognito mode */ }
}

function clearAuthFromStorage(): void {
  try {
    // Giữ lại flag 'guest' để lần load sau biết ngay không cần check API
    localStorage.setItem(AUTH_STATUS_KEY, 'guest');
    localStorage.removeItem(AUTH_USER_KEY);
  } catch { /* bỏ qua */ }
}

// ===== Initial State =====
// Đọc đồng bộ từ localStorage → UI render đúng ngay lần đầu, không cần chờ API
const persisted = loadAuthFromStorage(); // loadAuthFromStorage() sẽ trả về null khi user chưa đăng nhập, đăng xuất hoặc chưa từng tương tác với web

const initialState: AuthState = {
  user:            persisted?.user ?? null,
  accessToken:     null, // Access token KHÔNG lưu localStorage (bảo mật)
  isAuthenticated: persisted?.status === 'authenticated',
};

// ===== Slice =====
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Set user + token khi React Query mutation thành công (login, OAuth, session recovery) */
    setUser: (state, action: PayloadAction<{ user: IUser; accessToken: string }>) => {
      state.user            = action.payload.user;
      state.accessToken     = action.payload.accessToken;
      state.isAuthenticated = true;
      // Persist user vào localStorage để lần load sau render ngay
      saveAuthToStorage(action.payload.user);
    },

    /** Xóa auth state khi logout hoặc session expired */
    clearUser: (state) => {
      state.user            = null;
      state.accessToken     = null;
      state.isAuthenticated = false;
      // Đánh dấu 'guest' → lần load sau biết ngay, render nút đăng nhập không cần chờ API
      clearAuthFromStorage();
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
