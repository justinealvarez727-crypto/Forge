import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LapsePolicy, TargetStyle } from '@/types';

export type Theme = 'system' | 'light' | 'dark';

interface SettingsState {
  theme: Theme;
  /** Default layout for newly generated prompts. */
  defaultStyle: TargetStyle;
  lapsePolicy: LapsePolicy;
  /** Cards per review session. */
  sessionSize: number;
  setTheme: (t: Theme) => void;
  setDefaultStyle: (s: TargetStyle) => void;
  setLapsePolicy: (p: LapsePolicy) => void;
  setSessionSize: (n: number) => void;
}

/** Resolve a theme choice to a concrete dark/light class on <html>. */
export function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      defaultStyle: 'xml',
      lapsePolicy: 'reset',
      sessionSize: 10,
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      setDefaultStyle: (defaultStyle) => set({ defaultStyle }),
      setLapsePolicy: (lapsePolicy) => set({ lapsePolicy }),
      setSessionSize: (sessionSize) => set({ sessionSize: Math.min(30, Math.max(3, sessionSize)) }),
    }),
    // The key is read by the inline script in index.html to prevent a theme flash.
    { name: 'pf-settings', version: 1 },
  ),
);
