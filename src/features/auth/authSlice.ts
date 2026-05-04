// ========================
// Redux Slice: Auth — Thin Client State Only
// Chỉ giữ sync reducers. Mọi API call giờ do React Query hooks xử lý.
// ========================
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser } from '@/types/auth.types';

// ===== localStorage helpers =====
// Chỉ lưu user profile (public info), KHÔNG lưu accessToken (bảo mật)
const AUTH_USER_KEY = 'sl_auth_user';
const AUTH_STATUS_KEY = 'sl_auth_status';

type PersistedAuthUser = Pick<AuthUser, '_id' | 'email' | 'fullName' | 'role'> &
  Partial<Pick<AuthUser, 'subscriptionStatus' | 'profile'>>;

/**
 * Đọc trạng thái khởi đầu từ localStorage một cách đồng bộ.
 *
 * Trả về:
 *  - { user, status: 'authenticated' } — đã đăng nhập, có data → render avatar ngay
 *  - { user: null, status: 'guest'  } — đã đăng xuất chủ động → render nút đăng nhập ngay
 *  - null                             — lần đầu vào web / chưa xác định → cần gọi API check
 */
function loadAuthFromStorage(): { user: PersistedAuthUser | null; status: 'authenticated' | 'guest' } | null {
  try {
    const status = localStorage.getItem(AUTH_STATUS_KEY) as 'authenticated' | 'guest' | null;
    if (!status) return null; // Chưa từng đăng nhập/đăng xuất — unknown state

    if (status === 'guest') {
      return { user: null, status: 'guest' };
    }

    // status === 'authenticated' → đọc user data
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuthUser;
    if (!parsed?._id || !parsed?.email || !parsed?.fullName || !parsed?.role) return null;
    return {
      user: {
        _id: parsed._id,
        email: parsed.email,
        fullName: parsed.fullName,
        role: parsed.role,
        ...(parsed.subscriptionStatus && { subscriptionStatus: parsed.subscriptionStatus }),
        ...(parsed.profile?.avatarUrl && { profile: { avatarUrl: parsed.profile.avatarUrl } }),
      },
      status: 'authenticated',
    };
  } catch {
    return null;
  }
}

function saveAuthToStorage(user: AuthUser): void {
  try {
    const persistedUser: PersistedAuthUser = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      ...(user.subscriptionStatus && { subscriptionStatus: user.subscriptionStatus }),
      ...(user.profile?.avatarUrl && { profile: { avatarUrl: user.profile.avatarUrl } }),
    };

    localStorage.setItem(AUTH_STATUS_KEY, 'authenticated');
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(persistedUser));
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
  user: persisted?.user ?? null,
  isAuthenticated: persisted?.status === 'authenticated',
  authResolved: persisted?.status === 'guest',
};

// ===== Slice =====
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Set user khi React Query mutation thành công (login, OAuth, session recovery) */
    setUser: (state, action: PayloadAction<{ user: AuthUser }>) => {
      state.user            = action.payload.user;
      state.isAuthenticated = true;
      state.authResolved    = true;
      // Persist user vào localStorage để lần load sau render ngay
      saveAuthToStorage(action.payload.user);
    },

    /** Xóa auth state khi logout hoặc session expired */
    clearUser: (state) => {
      state.user            = null;
      state.isAuthenticated = false;
      state.authResolved    = true;
      // Đánh dấu 'guest' → lần load sau biết ngay, render nút đăng nhập không cần chờ API
      clearAuthFromStorage();
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
