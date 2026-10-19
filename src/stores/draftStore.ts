/**
 * The prompt currently being edited. Persisted so a refresh, crash or accidental
 * navigation never loses work. The generated text and score are *derived* in the UI
 * (useMemo) rather than stored, so they can never drift out of sync with the spec.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PromptSpec } from '@/types';
import { EMPTY_SPEC } from '@/engine/defaults';
import { inferSpec } from '@/engine/infer';
import { useSettings } from './settingsStore';

interface DraftState {
  idea: string;
  spec: PromptSpec;
  /** Id of the library prompt being edited, or null for a new one. */
  editingId: string | null;
  setIdea: (idea: string) => void;
  patch: (p: Partial<PromptSpec>) => void;
  /** Run the automatic inference on the idea and replace the spec. */
  autofill: () => void;
  load: (spec: PromptSpec, editingId?: string | null) => void;
  reset: () => void;
}

export const useDraft = create<DraftState>()(
  persist(
    (set, get) => ({
      idea: '',
      spec: EMPTY_SPEC,
      editingId: null,
      setIdea: (idea) => set({ idea }),
      patch: (p) => set((s) => ({ spec: { ...s.spec, ...p } })),
      autofill: () => {
        const style = useSettings.getState().defaultStyle;
        set({ spec: { ...inferSpec(get().idea), style }, editingId: null });
      },
      load: (spec, editingId = null) => set({ spec, editingId, idea: spec.goal }),
      reset: () => set({ idea: '', spec: { ...EMPTY_SPEC, style: useSettings.getState().defaultStyle }, editingId: null }),
    }),
    { name: 'pf-draft', version: 1 },
  ),
);
