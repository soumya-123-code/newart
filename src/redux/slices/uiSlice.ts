import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilterOptions {
  priority: string[];
  currency?: string[];
  status?: string[];
}

interface UIState {
  filterOptions: FilterOptions;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  filterOptions: {
    priority: [],
    currency: [],
    status: []
  },
  sidebarOpen: false,
  theme: 'light'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFilterOptions: (state, action: PayloadAction<FilterOptions>) => {
      state.filterOptions = action.payload;
    },
    resetFilterOptions: (state) => {
      state.filterOptions = initialState.filterOptions;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    }
  }
});

export const {
  setFilterOptions,
  resetFilterOptions,
  toggleSidebar,
  setSidebarOpen,
  setTheme
} = uiSlice.actions;

export default uiSlice.reducer;