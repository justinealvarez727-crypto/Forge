/**
 * Core domain types. Everything the engine, stores and UI share lives here so the
 * pure engine layer (src/engine) has no dependency on React or Zustand.
 */

export type TaskType =
  | 'write'
  | 'summarize'
  | 'analyze'
  | 'code'
  | 'brainstorm'
  | 'extract'
  | 'translate'
  | 'teach'
  | 'plan'
  | 'classify'
  | 'custom';

export type Tone =
  | 'neutral'
  | 'formal'
  | 'friendly'
  | 'casual'
  | 'persuasive'
  | 'playful'
  | 'technical';

export type OutputFormat =
  | 'free'
  | 'bullets'
  | 'numbered'
  | 'table'
  | 'json'
  | 'markdown'
  | 'email'
  | 'code';

export type Length = 'any' | 'short' | 'medium' | 'long';

/** Prompting techniques the generator can weave into a prompt. */
export type TechniqueId =
  | 'role'
  | 'chain-of-thought'
  | 'few-shot'
  | 'self-critique'
  | 'clarify-first'
  | 'delimiters';

/** How the final prompt text is laid out, tuned to the model family. */
export type TargetStyle = 'xml' | 'markdown' | 'plain';

export interface Example {
  input: string;
  output: string;
}

/** The structured, editable description of a prompt. The builder turns it into text. */
export interface PromptSpec {
  task: TaskType;
  goal: string;
  role: string;
  audience: string;
  context: string;
  constraints: string[];
  tone: Tone;
  format: OutputFormat;
  length: Length;
  techniques: TechniqueId[];
  examples: Example[];
  style: TargetStyle;
  /** When true the prompt ends with a delimited slot for the user's own input. */
  inputSlot: boolean;
}

export interface QualityCheck {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  /** Shown only when the check fails. */
  tip: string;
}

export interface QualityReport {
  /** 0-100 */
  score: number;
  grade: 'Needs work' | 'Decent' | 'Strong' | 'Excellent';
  checks: QualityCheck[];
}

export interface SavedPrompt {
  id: string;
  title: string;
  spec: PromptSpec;
  text: string;
  score: number;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  /** Number of times the user copied it, a cheap signal for "what do I actually use". */
  uses: number;
}

/** A prompt-engineering lesson. Each lesson also yields one flashcard for review. */
export interface Lesson {
  id: string;
  title: string;
  summary: string;
  why: string;
  weak: string;
  strong: string;
  card: { question: string; answer: string };
}

/** Leitner state for a single flashcard. Box is 1..BOX_COUNT. */
export interface CardState {
  lessonId: string;
  box: number;
  /** ISO timestamp of the start of the local day the card becomes due. */
  dueAt: string;
  lastReviewedAt: string | null;
  reps: number;
  lapses: number;
}

export type LapsePolicy = 'reset' | 'demote';
