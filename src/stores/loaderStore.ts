import { create } from 'zustand';

export interface LoaderState {
  isVisible: boolean;
  message: string;
  showLoader: (message: string) => void;
  hideLoader: () => void;
  setMessage: (message: string) => void;
}

export const useLoaderStore = create<LoaderState>((set) => ({
  isVisible: false,
  message: '',

  showLoader: (message: string = 'Loading...') => {
    set({
      isVisible: true,
      message,
    });
  },

  hideLoader: () => {
    set({
      isVisible: false,
      message: '',
    });
  },

  setMessage: (message: string) => {
    set({ message });
  },
}));

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
