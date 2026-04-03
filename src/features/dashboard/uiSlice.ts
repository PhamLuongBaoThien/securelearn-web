import { createSlice, type PayloadAction, type Reducer } from '@reduxjs/toolkit';

export interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  modalState: {
    isOpen: boolean;
    type: string | null;
  };
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: 'system',
  modalState: {
    isOpen: false,
    type: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      // Triggers theme change locally
    },
    setModal: (state, action: PayloadAction<{ isOpen: boolean; type?: string }>) => {
      state.modalState.isOpen = action.payload.isOpen;
      state.modalState.type = action.payload.type || null;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleTheme, setModal } = uiSlice.actions;

const uiReducer: Reducer<UiState> = uiSlice.reducer;
export default uiReducer;
