/**
 * PromptSpec -> prompt text.
 *
 * Section order follows widely used prompt-engineering guidance:
 *   role -> context -> task -> audience/tone -> constraints -> reasoning -> examples
 *   -> output format -> self-critique -> input slot
 * Putting context before the task and the input slot last keeps long pasted material
 * away from the instructions, which models follow more reliably.
 *
 * The same sections render three ways (`style`): XML tags (clear boundaries, great
 * for Claude and also fine elsewhere), Markdown headings (GPT-style chat models), or
 * plain labelled lines (anything).
 */
import type { Length, OutputFormat, PromptSpec, TargetStyle, Tone } from '@/types';

interface Section {
  tag: string;
  title: string;
  body: string;
}

const TONE_TEXT: Record<Tone, string> = {
  neutral: '',
  formal: 'formal and professional',
  friendly: 'warm and friendly',
  casual: 'casual and conversational',
  persuasive: 'persuasive and confident',
  playful: 'playful and witty',
  technical: 'precise and technical',
};

const LENGTH_TEXT: Record<Length, string> = {
  any: '',
  short: 'Keep the response short and to the point.',
  medium: 'Aim for a moderate length: complete but not padded.',
  long: 'Be thorough and detailed, covering the topic in depth.',
};

const FORMAT_TEXT: Record<OutputFormat, string> = {
  free: '',
  bullets: 'Respond as a concise bulleted list.',
  numbered: 'Respond as a numbered list.',
  table: 'Respond as a Markdown table with clear column headers.',
  json: 'Respond with valid JSON only, with no text before or after it.',
  markdown: 'Respond in Markdown with short headings and clear structure.',
  email: 'Respond as a ready-to-send email with a subject line, greeting and sign-off.',
  code: 'Respond with a single fenced code block, followed by a short explanation.',
};

const article = (role: string) => (/^(a|an|the)\s/i.test(role) ? role : `${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}`);

/** Break the spec into ordered, labelled sections. Empty sections are dropped. */
export function buildSections(spec: PromptSpec): Section[] {
  const has = (t: PromptSpec['techniques'][number]) => spec.techniques.includes(t);
  const out: Section[] = [];

  if (has('role') && spec.role.trim()) {
    out.push({ tag: 'role', title: 'Role', body: `You are ${article(spec.role.trim())}.` });
  }

  if (spec.context.trim()) {
    out.push({ tag: 'context', title: 'Context', body: spec.context.trim() });
  }

  const taskLines = [spec.goal.trim() || 'Complete the task described below.'];
  const audience = spec.audience.trim();
  const tone = TONE_TEXT[spec.tone];
  if (audience) taskLines.push(`The audience is ${audience}.`);
  if (tone) taskLines.push(`Use a ${tone} tone.`);
  out.push({ tag: 'task', title: 'Task', body: taskLines.join(' ') });

  const constraints = spec.constraints.map((c) => c.trim()).filter(Boolean);
  const lengthLine = LENGTH_TEXT[spec.length];
  if (constraints.length || lengthLine) {
    const lines = constraints.map((c) => `- ${c}`);
    if (lengthLine) lines.push(`- ${lengthLine}`);
    out.push({ tag: 'constraints', title: 'Constraints', body: lines.join('\n') });
  }

  const reasoning: string[] = [];
  if (has('clarify-first')) {
    reasoning.push(
      'If anything essential is missing or ambiguous, ask up to three clarifying questions before answering.',
    );
  }
  if (has('chain-of-thought')) {
    reasoning.push(
      'Think through the problem step by step before giving your final answer. Put your reasoning first, then the final answer under a clear "Answer" label.',
    );
  }
  if (reasoning.length) {
    out.push({ tag: 'approach', title: 'Approach', body: reasoning.join(' ') });
  }

  const examples = spec.examples.filter((e) => e.input.trim() && e.output.trim());
  if (has('few-shot') && examples.length) {
    const body = examples
      .map((e, i) => `Example ${i + 1}\nInput: ${e.input.trim()}\nOutput: ${e.output.trim()}`)
      .join('\n\n');
    out.push({ tag: 'examples', title: 'Examples', body });
  }

  const fmt = FORMAT_TEXT[spec.format];
  if (fmt) out.push({ tag: 'output_format', title: 'Output format', body: fmt });

  if (has('self-critique')) {
    out.push({
      tag: 'review',
      title: 'Review',
      body: 'Before finalizing, check your draft against every constraint above. Fix any problems, then return only the improved version.',
    });
  }

  if (spec.inputSlot) {
    out.push({ tag: 'input', title: 'Input', body: '[PASTE YOUR INPUT HERE]' });
  }

  return out;
}

function render(sections: Section[], style: TargetStyle, useDelimiters: boolean): string {
  switch (style) {
    case 'xml':
      return sections.map((s) => `<${s.tag}>\n${s.body}\n</${s.tag}>`).join('\n\n');
    case 'markdown':
      return sections.map((s) => `## ${s.title}\n${s.body}`).join('\n\n');
    case 'plain':
    default:
      return sections
        .map((s) => (s.tag === 'task' && !useDelimiters ? s.body : `${s.title}:\n${s.body}`))
        .join('\n\n');
  }
}

export function buildPrompt(spec: PromptSpec): string {
  const sections = buildSections(spec);
  const delimiters = spec.techniques.includes('delimiters');
  let text = render(sections, spec.style, delimiters);

  // 'delimiters' on a non-XML style: fence the input slot so pasted text can't be
  // mistaken for instructions.
  if (delimiters && spec.inputSlot && spec.style !== 'xml') {
    text = text.replace('[PASTE YOUR INPUT HERE]', '"""\n[PASTE YOUR INPUT HERE]\n"""');
  }
  return text.trim();
}

/** Rough token estimate (about 4 characters per token for English). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
