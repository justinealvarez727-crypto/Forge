import { describe, expect, it } from 'vitest';
import {
  BOX_COUNT,
  computeStats,
  dueQueue,
  intervalDays,
  isDue,
  newCard,
  review,
  startOfDayPlus,
} from './leitner';
import { inferSpec } from './infer';
import { buildPrompt } from './build';
import { scorePrompt } from './score';
import { specForTask } from './defaults';

describe('leitner intervals', () => {
  it('doubles per box: 1, 2, 4, 8, 16 days', () => {
    expect([1, 2, 3, 4, 5].map(intervalDays)).toEqual([1, 2, 4, 8, 16]);
  });

  it('clamps out-of-range boxes', () => {
    expect(intervalDays(0)).toBe(1);
    expect(intervalDays(99)).toBe(16);
    expect(intervalDays(Number.NaN)).toBe(1);
  });
});

describe('leitner review', () => {
  const now = new Date(2026, 9, 18, 21, 30); // 18 Oct 2026, evening

  it('promotes on success and schedules at the start of the target day', () => {
    const c = review(newCard('a', now), true, now);
    expect(c.box).toBe(2);
    expect(new Date(c.dueAt).getTime()).toBe(startOfDayPlus(now, 2).getTime());
    expect(c.reps).toBe(1);
    expect(c.lapses).toBe(0);
  });

  it('never exceeds the top box', () => {
    let c = newCard('a', now);
    for (let i = 0; i < 10; i++) c = review(c, true, now);
    expect(c.box).toBe(BOX_COUNT);
  });

  it('resets to box 1 on a miss and is due tomorrow', () => {
    let c = newCard('a', now);
    c = review(review(review(c, true, now), true, now), true, now); // box 4
    const missed = review(c, false, now, 'reset');
    expect(missed.box).toBe(1);
    expect(missed.lapses).toBe(1);
    expect(new Date(missed.dueAt).getTime()).toBe(startOfDayPlus(now, 1).getTime());
  });

  it('demotes by one when policy is demote, never below box 1', () => {
    let c = review(newCard('a', now), true, now); // box 2
    expect(review(c, false, now, 'demote').box).toBe(1);
    c = newCard('a', now);
    expect(review(c, false, now, 'demote').box).toBe(1);
  });

  it('is due once its day starts', () => {
    const c = review(newCard('a', now), true, now); // due in 2 days
    expect(isDue(c, now)).toBe(false);
    expect(isDue(c, startOfDayPlus(now, 2))).toBe(true);
  });

  it('orders the due queue weakest box first', () => {
    const a = { ...newCard('a', now), box: 3 };
    const b = { ...newCard('b', now), box: 1 };
    expect(dueQueue([a, b], now).map((c) => c.lessonId)).toEqual(['b', 'a']);
  });

  it('computes stats', () => {
    const cards = [newCard('a', now), { ...newCard('b', now), box: 5, reps: 4, lapses: 1 }];
    const s = computeStats(cards, now);
    expect(s.total).toBe(2);
    expect(s.perBox[0]).toBe(1);
    expect(s.perBox[4]).toBe(1);
    expect(s.mastery).toBe(0.5);
    expect(s.accuracy).toBeCloseTo(0.75);
  });
});

describe('inferSpec', () => {
  it('detects task, audience, tone and constraints from a rough idea', () => {
    const s = inferSpec('write a friendly email for my landlord under 120 words');
    expect(s.task).toBe('write');
    expect(s.tone).toBe('friendly');
    expect(s.format).toBe('email');
    expect(s.audience).toBe('my landlord');
    expect(s.constraints[0]).toContain('120 words');
  });

  it('stops the audience before a following verb phrase', () => {
    const s = inferSpec('write a friendly email for my landlord asking to fix the heater');
    expect(s.audience).toBe('my landlord');
  });

  it('adds an input slot for reusable task types', () => {
    expect(inferSpec('summarize articles as bullet points').inputSlot).toBe(true);
    expect(inferSpec('brainstorm names for a bakery').inputSlot).toBe(false);
  });

  it('returns an empty custom spec for empty input', () => {
    expect(inferSpec('   ').task).toBe('custom');
  });
});

describe('buildPrompt', () => {
  const spec = inferSpec('explain how vaccines work for 10 year olds');

  it('renders XML sections in a sensible order', () => {
    const text = buildPrompt({ ...spec, style: 'xml' });
    const order = ['<role>', '<task>', '<constraints>', '<approach>', '<output_format>'];
    const idx = order.map((t) => text.indexOf(t)).filter((i) => i >= 0);
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
    expect(text).toContain('You are a patient teacher');
  });

  it('renders markdown headings', () => {
    expect(buildPrompt({ ...spec, style: 'markdown' })).toContain('## Task');
  });

  it('only includes examples when few-shot is on and complete', () => {
    const base = specForTask('classify', {
      goal: 'Classify support tickets by urgency.',
      examples: [{ input: 'Site is down', output: 'high' }, { input: '', output: 'x' }],
    });
    const text = buildPrompt(base);
    expect(text).toContain('Site is down');
    expect(text).not.toContain('Example 2');
  });

  it('adds the input slot last', () => {
    const text = buildPrompt({ ...spec, inputSlot: true, style: 'xml' });
    expect(text.trim().endsWith('</input>')).toBe(true);
  });
});

describe('scorePrompt', () => {
  it('scores an empty spec low and a rich spec high', () => {
    const low = scorePrompt(specForTask('custom'));
    const rich = scorePrompt(
      specForTask('classify', {
        goal: 'Classify each customer support ticket by urgency level.',
        context: 'Tickets come from a B2B invoicing product; downtime is the top concern.',
        audience: 'the support triage team',
        examples: [{ input: 'Site is down', output: '{"urgency":"high"}' }],
      }),
    );
    expect(low.score).toBeLessThan(30);
    expect(rich.score).toBeGreaterThanOrEqual(90);
    expect(rich.grade).toBe('Excellent');
  });

  it('flags vague wording', () => {
    const r = scorePrompt(specForTask('write', { goal: 'Write some good stuff about dogs.' }));
    expect(r.checks.find((c) => c.id === 'specific')?.passed).toBe(false);
  });
});
