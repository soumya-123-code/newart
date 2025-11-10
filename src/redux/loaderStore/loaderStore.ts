/**
 * ✅ GLOBAL LOADER STORE
 * Similar to messageStore, manages loader state globally
 * 
 * Usage:
 * const { showLoader, hideLoader, isVisible, message } = useLoaderStore();
 * 
 * showLoader('Loading data...');
 * hideLoader();
 * setMessage('Processing...');
 */

import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export interface LoaderState {
  // State
  isVisible: boolean;
  message: string;
  
  // Actions
  showLoader: (message: string) => void;
  hideLoader: () => void;
  setMessage: (message: string) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useLoaderStore = create<LoaderState>((set) => ({
  // ✅ Initial State
  isVisible: false,
  message: '',

  // ✅ Show Loader with message
  showLoader: (message: string = 'Loading...') => {
    set({
      isVisible: true,
      message,
    });
  },

  // ✅ Hide Loader
  hideLoader: () => {
    set({
      isVisible: false,
      message: '',
    });
  },

  // ✅ Update message while visible
  setMessage: (message: string) => {
    set({ message });
  },
}));

// ============================================================================
// CONVENIENCE HOOK
// ============================================================================

export const useLoader = () => {
  const store = useLoaderStore();
  return {
    showLoader: store.showLoader,
    hideLoader: store.hideLoader,
    setMessage: store.setMessage,
    isVisible: store.isVisible,
    message: store.message,
  };
};