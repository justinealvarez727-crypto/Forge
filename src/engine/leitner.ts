/**
 * Leitner spaced-repetition scheduler.
 *
 * The Leitner system keeps cards in numbered boxes. A correct answer promotes a card
 * to the next box (longer wait); a miss sends it back toward box 1 (short wait).
 *
 * Interval for box b (1-indexed) is a geometric series:
 *
 *     interval(b) = BASE * GROWTH^(b - 1)      days
 *
 * With BASE = 1 and GROWTH = 2 and five boxes that gives 1, 2, 4, 8, 16 days.
 * Doubling mirrors the exponential forgetting curve: each successful recall roughly
 * doubles how long the memory survives, so the review load per card falls
 * logarithmically with the retention horizon.
 *
 * Two design choices worth knowing:
 *  1. Due dates snap to the start of a local calendar day. "Due in 2 days" then means
 *     the card appears at the start of that day instead of 48h after you happened to
 *     answer, which makes daily sessions predictable.
 *  2. Day arithmetic uses setDate(), not +N*86_400_000 ms, so DST shifts never push a
 *     card a day early or late.
 *
 * Everything here is pure: pass `now` in, get new state out. That keeps it testable.
 */
import type { CardState, LapsePolicy } from '@/types';

export const BOX_COUNT = 5;
export const BASE_INTERVAL_DAYS = 1;
export const GROWTH = 2;

/** Clamp to a valid box number. */
export function clampBox(box: number): number {
  if (!Number.isFinite(box)) return 1;
  return Math.min(BOX_COUNT, Math.max(1, Math.round(box)));
}

/** Days to wait after a successful review that lands the card in `box`. */
export function intervalDays(box: number): number {
  return BASE_INTERVAL_DAYS * GROWTH ** (clampBox(box) - 1);
}

/** Midnight (local) at the start of the day containing `date`, plus `days` days. */
export function startOfDayPlus(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

/** A brand-new card goes in box 1 and is due immediately. */
export function newCard(lessonId: string, now: Date = new Date()): CardState {
  return {
    lessonId,
    box: 1,
    dueAt: startOfDayPlus(now, 0).toISOString(),
    lastReviewedAt: null,
    reps: 0,
    lapses: 0,
  };
}

/**
 * Apply one review result.
 *  - correct: box + 1 (capped at BOX_COUNT)
 *  - wrong, policy 'reset': back to box 1 (classic Leitner)
 *  - wrong, policy 'demote': drop one box (gentler for cards you mostly know)
 * A missed card is always due again tomorrow so the miss gets reinforced quickly.
 */
export function review(
  card: CardState,
  correct: boolean,
  now: Date = new Date(),
  lapsePolicy: LapsePolicy = 'reset',
): CardState {
  const nextBox = correct
    ? clampBox(card.box + 1)
    : lapsePolicy === 'reset'
      ? 1
      : clampBox(card.box - 1);

  const wait = correct ? intervalDays(nextBox) : 1;

  return {
    ...card,
    box: nextBox,
    dueAt: startOfDayPlus(now, wait).toISOString(),
    lastReviewedAt: now.toISOString(),
    reps: card.reps + 1,
    lapses: card.lapses + (correct ? 0 : 1),
  };
}

export function isDue(card: CardState, now: Date = new Date()): boolean {
  return new Date(card.dueAt).getTime() <= now.getTime();
}

/**
 * Cards due now, ordered so the weakest come first (lowest box), then the most
 * overdue. Prioritising low boxes means a short session still hits what you know least.
 */
export function dueQueue(cards: CardState[], now: Date = new Date()): CardState[] {
  return cards
    .filter((c) => isDue(c, now))
    .sort((a, b) => a.box - b.box || new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export interface ReviewStats {
  total: number;
  due: number;
  /** Cards per box, index 0 = box 1. */
  perBox: number[];
  /** Share of cards in the top two boxes, a simple "mastery" proxy. */
  mastery: number;
  accuracy: number | null;
}

export function computeStats(cards: CardState[], now: Date = new Date()): ReviewStats {
  const perBox = Array.from({ length: BOX_COUNT }, () => 0);
  let due = 0;
  let reps = 0;
  let lapses = 0;
  for (const c of cards) {
    perBox[clampBox(c.box) - 1] += 1;
    if (isDue(c, now)) due += 1;
    reps += c.reps;
    lapses += c.lapses;
  }
  const total = cards.length;
  const top = perBox[BOX_COUNT - 1] + perBox[BOX_COUNT - 2];
  return {
    total,
    due,
    perBox,
    mastery: total === 0 ? 0 : top / total,
    accuracy: reps === 0 ? null : (reps - lapses) / reps,
  };
}
