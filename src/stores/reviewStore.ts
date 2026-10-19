/**
 * Leitner review state. Persisted as a map lessonId -> CardState.
 *
 * `ensureCards` runs at startup, so lessons added in a later release automatically
 * get a card without wiping the progress on existing ones (a simple forward migration).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardState } from '@/types';
import { LESSONS } from '@/data/lessons';
import { newCard, review } from '@/engine/leitner';
import { useSettings } from './settingsStore';

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

interface ReviewState {
  cards: Record<string, CardState>;
  streak: number;
  lastReviewDay: string | null;
  /** Reviews completed per local day key, for a small activity readout. */
  history: Record<string, number>;
  ensureCards: () => void;
  grade: (lessonId: string, correct: boolean) => void;
  resetProgress: () => void;
}

export const useReview = create<ReviewState>()(
  persist(
    (set, get) => ({
      cards: {},
      streak: 0,
      lastReviewDay: null,
      history: {},
      ensureCards: () => {
        const cards = { ...get().cards };
        let changed = false;
        for (const l of LESSONS) {
          if (!cards[l.id]) {
            cards[l.id] = newCard(l.id);
            changed = true;
          }
        }
        if (changed) set({ cards });
      },
      grade: (lessonId, correct) => {
        const now = new Date();
        const card = get().cards[lessonId] ?? newCard(lessonId, now);
        const next = review(card, correct, now, useSettings.getState().lapsePolicy);

        // Streak: consecutive local days with at least one review.
        const today = dayKey(now);
        const { lastReviewDay, streak, history } = get();
        let nextStreak = streak;
        if (lastReviewDay !== today) {
          const y = new Date(now);
          y.setDate(y.getDate() - 1);
          nextStreak = lastReviewDay === dayKey(y) ? streak + 1 : 1;
        }

        set({
          cards: { ...get().cards, [lessonId]: next },
          streak: nextStreak,
          lastReviewDay: today,
          history: { ...history, [today]: (history[today] ?? 0) + 1 },
        });
      },
      resetProgress: () => {
        const cards: Record<string, CardState> = {};
        for (const l of LESSONS) cards[l.id] = newCard(l.id);
        set({ cards, streak: 0, lastReviewDay: null, history: {} });
      },
    }),
    { name: 'pf-review', version: 1 },
  ),
);
