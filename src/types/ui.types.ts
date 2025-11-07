// src/types/ui.types.ts

export interface FilterOptions {
  priority: string[];
  currency: string[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface UIState {
  sidebarCollapsed: boolean;
  filterOptions: FilterOptions;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}
