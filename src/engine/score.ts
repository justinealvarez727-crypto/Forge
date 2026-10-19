/**
 * Prompt quality linter. Each check is a small, explainable rule with a weight;
 * the score is the weighted share of passed checks. Failed checks carry a tip, so the
 * score doubles as coaching: it tells the user *what to add*, not just "72/100".
 */
import type { PromptSpec, QualityReport } from '@/types';

const VAGUE = /\b(something|stuff|things?|good|nice|great|better|etc|whatever|some kind of)\b/i;

export function scorePrompt(spec: PromptSpec): QualityReport {
  const goal = spec.goal.trim();
  const has = (t: PromptSpec['techniques'][number]) => spec.techniques.includes(t);
  const usableExamples = spec.examples.filter((e) => e.input.trim() && e.output.trim()).length;
  const needsExamples = spec.task === 'classify' || spec.task === 'extract';

  const checks = [
    {
      id: 'goal',
      label: 'Clear goal',
      weight: 20,
      passed: goal.split(/\s+/).filter(Boolean).length >= 5,
      tip: 'Describe the task in at least a full sentence: what to do, to what, and why.',
    },
    {
      id: 'specific',
      label: 'Avoids vague words',
      weight: 5,
      passed: goal.length > 0 && !VAGUE.test(goal),
      tip: 'Replace words like "good", "stuff" or "better" with measurable criteria.',
    },
    {
      id: 'context',
      label: 'Background context',
      weight: 15,
      passed: spec.context.trim().length >= 20,
      tip: 'Add the background the model cannot guess: who it is for, what exists already, what you tried.',
    },
    {
      id: 'audience',
      label: 'Audience defined',
      weight: 10,
      passed: spec.audience.trim().length > 0,
      tip: 'Say who will read the result so the model can pitch the level and vocabulary.',
    },
    {
      id: 'role',
      label: 'Role assigned',
      weight: 10,
      passed: has('role') && spec.role.trim().length > 0,
      tip: 'Give the model a role to anchor its expertise and voice.',
    },
    {
      id: 'constraints',
      label: 'Constraints stated',
      weight: 10,
      passed: spec.constraints.filter((c) => c.trim()).length > 0 || spec.length !== 'any',
      tip: 'Add at least one rule: length, things to avoid, or must-include points.',
    },
    {
      id: 'format',
      label: 'Output format set',
      weight: 15,
      passed: spec.format !== 'free',
      tip: 'Specify the shape of the answer (list, table, JSON...) so it is easy to use.',
    },
    {
      id: 'examples',
      label: needsExamples ? 'Examples provided' : 'Examples (optional bonus)',
      weight: needsExamples ? 10 : 5,
      passed: has('few-shot') && usableExamples > 0,
      tip: needsExamples
        ? 'Classification and extraction improve a lot with 2-3 input/output examples.'
        : 'One or two examples of the output you want can sharply cut guesswork.',
    },
  ];

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const earned = checks.reduce((n, c) => n + (c.passed ? c.weight : 0), 0);
  const score = Math.round((earned / total) * 100);

  const grade =
    score >= 90 ? 'Excellent' : score >= 70 ? 'Strong' : score >= 45 ? 'Decent' : 'Needs work';

  return { score, grade, checks };
}
