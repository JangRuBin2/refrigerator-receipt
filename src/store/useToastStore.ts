import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 3000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Helper functions for convenience
export const toast = {
  success: (message: string, title?: string) => {
    return useToastStore.getState().addToast({ type: 'success', message, title });
  },
  error: (message: string, title?: string) => {
    return useToastStore.getState().addToast({ type: 'error', message, title });
  },
  warning: (message: string, title?: string) => {
    return useToastStore.getState().addToast({ type: 'warning', message, title });
  },
  info: (message: string, title?: string) => {
    return useToastStore.getState().addToast({ type: 'info', message, title });
  },
};
