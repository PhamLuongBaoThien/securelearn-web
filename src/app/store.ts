import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/dashboard/uiSlice';
import cartReducer from '@/features/courses/cartSlice';
import adminAuthReducer from '@/features/auth/adminAuthSlice';
import streakReducer from '@/features/dashboard/streakSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
    ui: uiReducer,
    cart: cartReducer,
    streak: streakReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>; 
export type AppDispatch = typeof store.dispatch; // Lấy dispatch
