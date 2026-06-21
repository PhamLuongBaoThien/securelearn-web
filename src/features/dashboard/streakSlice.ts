import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LearnerActivitySummary } from '@/services/progressApi';

export interface StreakState {
  streakData: LearnerActivitySummary | null;
}

const STREAK_STORAGE_KEY = 'sl_streak_data';

// Load từ localStorage để hiển thị tức thì khi refresh trang
const loadStreakFromStorage = (): LearnerActivitySummary | null => {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    
    if (parsed && parsed.dailyGoalSeconds !== 30) {
      localStorage.removeItem(STREAK_STORAGE_KEY);
      return null;
    }

    if (typeof parsed?.currentStreakDays === 'number') {
      return parsed as LearnerActivitySummary;
    }
    return null;
  } catch {
    return null;
  }
};

const initialState: StreakState = {
  streakData: loadStreakFromStorage(),
};

const streakSlice = createSlice({
  name: 'streak',
  initialState,
  reducers: {
    setStreak: (state, action: PayloadAction<LearnerActivitySummary>) => {
      state.streakData = action.payload;
      try {
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(action.payload));
      } catch {
        // bỏ qua khi ở chế độ ẩn danh
      }
    },
    clearStreak: (state) => {
      state.streakData = null;
      try {
        localStorage.removeItem(STREAK_STORAGE_KEY);
      } catch {
        // bỏ qua
      }
    },
  },
});

export const { setStreak, clearStreak } = streakSlice.actions;
export default streakSlice.reducer;
