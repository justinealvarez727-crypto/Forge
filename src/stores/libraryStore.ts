import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PromptSpec, SavedPrompt } from '@/types';
import { uid } from '@/lib/util';

interface LibraryState {
  prompts: SavedPrompt[];
  /** Create a prompt, or update in place when `id` is given. Returns the id. */
  save: (input: { id?: string | null; title: string; spec: PromptSpec; text: string; score: number; tags?: string[] }) => string;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  recordUse: (id: string) => void;
  setTags: (id: string, tags: string[]) => void;
  /** Merge prompts from an exported JSON string. Returns how many were added. */
  importJson: (json: string) => number;
  exportJson: () => string;
}

const isPrompt = (p: unknown): p is SavedPrompt =>
  !!p && typeof p === 'object' && typeof (p as SavedPrompt).id === 'string' && typeof (p as SavedPrompt).text === 'string' && !!(p as SavedPrompt).spec;

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      prompts: [],
      save: ({ id, title, spec, text, score, tags }) => {
        const now = new Date().toISOString();
        const existing = id ? get().prompts.find((p) => p.id === id) : undefined;
        if (existing) {
          set((s) => ({
            prompts: s.prompts.map((p) =>
              p.id === existing.id ? { ...p, title, spec, text, score, tags: tags ?? p.tags, updatedAt: now } : p,
            ),
          }));
          return existing.id;
        }
        const created: SavedPrompt = {
          id: uid(), title, spec, text, score, tags: tags ?? [spec.task],
          favorite: false, createdAt: now, updatedAt: now, uses: 0,
        };
        set((s) => ({ prompts: [created, ...s.prompts] }));
        return created.id;
      },
      remove: (id) => set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) })),
      toggleFavorite: (id) =>
        set((s) => ({ prompts: s.prompts.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)) })),
      recordUse: (id) =>
        set((s) => ({ prompts: s.prompts.map((p) => (p.id === id ? { ...p, uses: p.uses + 1 } : p)) })),
      setTags: (id, tags) =>
        set((s) => ({ prompts: s.prompts.map((p) => (p.id === id ? { ...p, tags } : p)) })),
      importJson: (json) => {
        const data = JSON.parse(json);
        const incoming: unknown[] = Array.isArray(data) ? data : data?.prompts ?? [];
        const known = new Set(get().prompts.map((p) => p.id));
        const fresh = incoming.filter(isPrompt).filter((p) => !known.has(p.id));
        set((s) => ({ prompts: [...fresh, ...s.prompts] }));
        return fresh.length;
      },
      exportJson: () => JSON.stringify({ app: 'promptforge', version: 1, prompts: get().prompts }, null, 2),
    }),
    { name: 'pf-library', version: 1 },
  ),
);
