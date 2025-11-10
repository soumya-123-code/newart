/**
 * ✅ GLOBAL MESSAGE STORE - FIXED VERSION
 * 
 * Use this in any component without adding GlobalMessage everywhere
 * Just import hook and call showError/showSuccess
 * 
 * Auto-close is handled by GlobalMessage component, not the store
 * Store only manages visibility and message content
 */

import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  text: string;
  type: 'error' | 'success' | 'warning' | 'info';
  isVisible: boolean;
}

interface MessageStore {
  message: Message;

  // Methods
  showError: (text: string) => void;
  showSuccess: (text: string) => void;
  showWarning: (text: string) => void;
  showInfo: (text: string) => void;
  hideMessage: () => void;
}

// ============================================================================
// STORE
// ============================================================================

/**
 * ✅ FIXED: Removed all setTimeout logic from store
 * Auto-close is now handled by GlobalMessage component
 */
export const useMessageStore = create<MessageStore>((set) => ({
  message: {
    id: '',
    text: '',
    type: 'error',
    isVisible: false,
  },

  // ✅ Show Error (component handles 5 second auto-close)
  showError: (text: string) => {
    const id = Date.now().toString();
    // console.error('❌ Error:', text);
    set({
      message: {
        id,
        text,
        type: 'error',
        isVisible: true,
      },
    });
  },

  // ✅ Show Success (component handles 3 second auto-close)
  showSuccess: (text: string) => {
    const id = Date.now().toString();
    set({
      message: {
        id,
        text,
        type: 'success',
        isVisible: true,
      },
    });
  },

  // ✅ Show Warning (component handles 5 second auto-close)
  showWarning: (text: string) => {
    const id = Date.now().toString();
    set({
      message: {
        id,
        text,
        type: 'warning',
        isVisible: true,
      },
    });
  },

  // ✅ Show Info (component handles 3 second auto-close)
  showInfo: (text: string) => {
    const id = Date.now().toString();
    set({
      message: {
        id,
        text,
        type: 'info',
        isVisible: true,
      },
    });
  },

  // ✅ Hide Message (manual close)
  hideMessage: () => {
    set({
      message: {
        id: '',
        text: '',
        type: 'error',
        isVisible: false,
      },
    });
  },
}));