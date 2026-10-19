/**
 * Starter templates. Each is a full PromptSpec, so loading one fills the editor and
 * the user sees exactly how the prompt is assembled.
 */
import type { PromptSpec } from '@/types';
import { specForTask } from '@/engine/defaults';

export interface Template {
  id: string;
  name: string;
  blurb: string;
  spec: PromptSpec;
}

export const TEMPLATES: Template[] = [
  {
    id: 'tpl-email',
    name: 'Polite follow-up email',
    blurb: 'Nudge someone without sounding pushy.',
    spec: specForTask('write', {
      goal: 'Write a follow-up email to a contact who has not replied to my earlier message.',
      audience: 'a busy professional',
      context: 'I sent a proposal a week ago and have not heard back. I want to keep the relationship warm.',
      tone: 'friendly',
      format: 'email',
      length: 'short',
      constraints: ['Include one clear question or next step', 'Do not sound guilt-tripping or apologetic'],
    }),
  },
  {
    id: 'tpl-summary',
    name: 'Article summarizer',
    blurb: 'Reusable: paste any text, get key points.',
    spec: specForTask('summarize', {
      goal: 'Summarize the text I provide into the five most important points, then add one sentence on why it matters.',
      audience: 'a reader with five minutes',
      inputSlot: true,
      format: 'bullets',
    }),
  },
  {
    id: 'tpl-explain',
    name: 'Explain it simply',
    blurb: 'Teach any concept at the right level.',
    spec: specForTask('teach', {
      goal: 'Explain the concept I name so a complete beginner can understand it, using one everyday analogy.',
      audience: 'a curious beginner with no background',
      tone: 'friendly',
      length: 'medium',
      inputSlot: true,
    }),
  },
  {
    id: 'tpl-code-review',
    name: 'Code reviewer',
    blurb: 'Find bugs and risks, ranked by severity.',
    spec: specForTask('code', {
      goal: 'Review the code I provide, identify bugs, security issues and maintainability problems, and rank them by severity.',
      audience: 'a developer who wrote this code',
      format: 'markdown',
      tone: 'technical',
      constraints: ['Quote the exact line for each issue', 'Suggest a concrete fix for each issue', 'Skip purely stylistic nitpicks'],
      inputSlot: true,
    }),
  },
  {
    id: 'tpl-sentiment',
    name: 'Sentiment classifier',
    blurb: 'Few-shot labels returned as JSON.',
    spec: specForTask('classify', {
      goal: 'Classify the sentiment of each customer review as positive, negative or mixed, and give a one-line reason.',
      audience: 'a customer-support analyst',
      context: 'Reviews are short, informal and may contain sarcasm or typos.',
      constraints: ['Use only the labels positive, negative or mixed', 'Treat sarcasm according to its real meaning'],
      examples: [
        { input: 'Loved it, but shipping took forever.', output: '{"label":"mixed","reason":"Praises product, criticizes shipping."}' },
        { input: 'Great, another thing that broke in a day.', output: '{"label":"negative","reason":"Sarcastic complaint about durability."}' },
      ],
      inputSlot: true,
    }),
  },
  {
    id: 'tpl-brainstorm',
    name: 'Idea generator',
    blurb: 'Varied options, not ten versions of one idea.',
    spec: specForTask('brainstorm', {
      goal: 'Generate ten distinct name ideas for a small neighborhood bakery, grouped by style.',
      audience: 'the bakery owner',
      context: 'The bakery sells sourdough and pastries, and the brand should feel warm and local.',
      tone: 'playful',
      constraints: ['Keep each name under three words', 'Avoid names that are generic or already famous brands'],
    }),
  },
  {
    id: 'tpl-plan',
    name: 'Project planner',
    blurb: 'Turn a goal into ordered, realistic steps.',
    spec: specForTask('plan', {
      goal: 'Turn my goal into a four-week plan with weekly milestones and the first three concrete actions.',
      audience: 'a solo beginner with ten free hours per week',
      format: 'markdown',
      length: 'medium',
    }),
  },
];
