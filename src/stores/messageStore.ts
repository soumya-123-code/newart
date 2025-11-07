import { create } from 'zustand';

interface Message {
  id: string;
  text: string;
  type: 'error' | 'success' | 'warning' | 'info';
  isVisible: boolean;
}

interface MessageStore {
  message: Message;
  showError: (text: string) => void;
  showSuccess: (text: string) => void;
  showWarning: (text: string) => void;
  showInfo: (text: string) => void;
  hideMessage: () => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  message: {
    id: '',
    text: '',
    type: 'error',
    isVisible: false,
  },

  showError: (text: string) => {
    const id = Date.now().toString();
    set({
      message: {
        id,
        text,
        type: 'error',
        isVisible: true,
      },
    });
  },

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
