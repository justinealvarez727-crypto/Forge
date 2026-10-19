/**
 * Per-task defaults. When the user gives a rough idea we pick a sensible role,
 * techniques, constraints and format for that kind of task so the first draft is
 * already good, and the user only has to refine rather than start from a blank form.
 */
import type { OutputFormat, PromptSpec, TaskType, TechniqueId } from '@/types';

export interface TaskProfile {
  label: string;
  role: string;
  techniques: TechniqueId[];
  format: OutputFormat;
  constraints: string[];
}

export const TASK_PROFILES: Record<TaskType, TaskProfile> = {
  write: {
    label: 'Write',
    role: 'an experienced writer and editor',
    techniques: ['role', 'self-critique'],
    format: 'free',
    constraints: ['Avoid clichés and filler phrases', 'Prefer concrete detail over generalities'],
  },
  summarize: {
    label: 'Summarize',
    role: 'a careful analyst who condenses information without distorting it',
    techniques: ['role', 'delimiters'],
    format: 'bullets',
    constraints: ['Keep only claims supported by the source text', 'Do not add outside information'],
  },
  analyze: {
    label: 'Analyze',
    role: 'a rigorous analyst',
    techniques: ['role', 'chain-of-thought'],
    format: 'markdown',
    constraints: ['Separate facts from interpretation', 'State assumptions explicitly'],
  },
  code: {
    label: 'Code',
    role: 'a senior software engineer who writes clear, tested code',
    techniques: ['role', 'chain-of-thought', 'self-critique'],
    format: 'code',
    constraints: ['Handle edge cases and errors', 'Explain non-obvious decisions in brief comments'],
  },
  brainstorm: {
    label: 'Brainstorm',
    role: 'a creative strategist who generates varied, original options',
    techniques: ['role'],
    format: 'numbered',
    constraints: ['Make the ideas meaningfully different from each other', 'Avoid the obvious first answers'],
  },
  extract: {
    label: 'Extract',
    role: 'a precise information-extraction system',
    techniques: ['role', 'delimiters', 'few-shot'],
    format: 'json',
    constraints: ['Return only information present in the input', 'Use null for missing fields'],
  },
  translate: {
    label: 'Translate',
    role: 'a professional translator who preserves meaning and register',
    techniques: ['role', 'delimiters'],
    format: 'free',
    constraints: ['Preserve tone and formatting', 'Keep names and technical terms intact'],
  },
  teach: {
    label: 'Teach',
    role: 'a patient teacher who builds understanding step by step',
    techniques: ['role', 'chain-of-thought'],
    format: 'markdown',
    constraints: ['Define jargon the first time it appears', 'Use one concrete example per idea'],
  },
  plan: {
    label: 'Plan',
    role: 'a pragmatic project planner',
    techniques: ['role', 'clarify-first'],
    format: 'numbered',
    constraints: ['Order steps by dependency', 'Flag risks and unknowns'],
  },
  classify: {
    label: 'Classify',
    role: 'a consistent classifier',
    techniques: ['role', 'few-shot', 'delimiters'],
    format: 'json',
    constraints: ['Choose exactly one label per item', 'Use only the allowed labels'],
  },
  custom: {
    label: 'Custom',
    role: 'a knowledgeable assistant',
    techniques: ['role'],
    format: 'free',
    constraints: [],
  },
};

export const EMPTY_SPEC: PromptSpec = {
  task: 'custom',
  goal: '',
  role: '',
  audience: '',
  context: '',
  constraints: [],
  tone: 'neutral',
  format: 'free',
  length: 'any',
  techniques: [],
  examples: [],
  style: 'xml',
  inputSlot: false,
};

/** A spec pre-filled with the profile for `task`. Used by templates and auto-fill. */
export function specForTask(task: TaskType, overrides: Partial<PromptSpec> = {}): PromptSpec {
  const p = TASK_PROFILES[task];
  return {
    ...EMPTY_SPEC,
    task,
    role: p.role,
    techniques: [...p.techniques],
    format: p.format,
    constraints: [...p.constraints],
    ...overrides,
  };
}
