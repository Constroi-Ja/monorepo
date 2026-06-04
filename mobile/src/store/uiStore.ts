import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UiState {
  toasts: Toast[];
  pendingVerificationSheetShown: boolean;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  markPendingVerificationSheetShown: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  pendingVerificationSheetShown: false,

  addToast: (message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  markPendingVerificationSheetShown: () =>
    set({ pendingVerificationSheetShown: true }),
}));
