import { create } from 'zustand';
import { uid } from '@/lib/util';

export interface Toast {
  id: string;
  message: string;
  tone: 'info' | 'success' | 'error';
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: Toast['tone']) => void;
  dismiss: (id: string) => void;
}

/** Not persisted: toasts are ephemeral. */
export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, tone = 'info') => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
    setTimeout(() => get().dismiss(id), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  info: (m: string) => useToasts.getState().push(m, 'info'),
  success: (m: string) => useToasts.getState().push(m, 'success'),
  error: (m: string) => useToasts.getState().push(m, 'error'),
};
