/**
 * Idea -> PromptSpec. This is the "automatic" part: the user types a rough sentence
 * and we infer task type, audience, tone, format and length from it using
 * lightweight keyword rules, then fill the rest from the task profile.
 *
 * It is deliberately rule-based, not a network call: it works offline, is instant,
 * is deterministic (easy to test), and never sends the user's text anywhere. The
 * output is only a first draft; every field stays editable in the UI.
 */
import type { Length, OutputFormat, PromptSpec, TaskType, Tone } from '@/types';
import { specForTask } from './defaults';

const TASK_RULES: Array<[TaskType, RegExp]> = [
  ['summarize', /\b(summari[sz]e|summary|tl;?dr|condense|recap|digest)\b/i],
  ['translate', /\b(translate|translation|in (spanish|french|german|japanese|chinese|tagalog|filipino))\b/i],
  ['extract', /\b(extract|pull out|parse|scrape|find all)\b/i],
  ['classify', /\b(classify|categori[sz]e|label|tag|sort into|sentiment)\b/i],
  ['code', /\b(code|function|bug|refactor|script|sql|regex|api|component|debug|unit test)\b/i],
  ['teach', /\b(explain|teach|lesson|tutor|eli5|how does|how do|learn)\b/i],
  ['plan', /\b(plan|roadmap|schedule|itinerary|outline|strategy|steps to)\b/i],
  ['brainstorm', /\b(brainstorm|ideas?|names?|suggest|options|come up with)\b/i],
  ['analyze', /\b(analy[sz]e|compare|evaluate|review|critique|assess|pros and cons)\b/i],
  ['write', /\b(write|draft|compose|email|essay|post|article|story|poem|letter|script|caption)\b/i],
];

const TONE_RULES: Array<[Tone, RegExp]> = [
  ['formal', /\b(formal|professional|polite|business)\b/i],
  ['friendly', /\b(friendly|warm|kind|welcoming)\b/i],
  ['casual', /\b(casual|relaxed|chatty|conversational)\b/i],
  ['persuasive', /\b(persuasive|convincing|sales|pitch|compelling)\b/i],
  ['playful', /\b(funny|humou?rous|playful|witty|fun)\b/i],
  ['technical', /\b(technical|precise|rigorous|academic)\b/i],
];

const FORMAT_RULES: Array<[OutputFormat, RegExp]> = [
  ['json', /\bjson\b/i],
  ['table', /\b(table|spreadsheet|columns)\b/i],
  ['bullets', /\b(bullets?|bulleted|key points|list of points)\b/i],
  ['numbered', /\b(numbered|step[- ]by[- ]step|steps)\b/i],
  ['email', /\bemail\b/i],
  ['markdown', /\bmarkdown\b/i],
  ['code', /\b(code block|snippet)\b/i],
];

function firstMatch<T>(rules: Array<[T, RegExp]>, text: string): T | null {
  for (const [value, rx] of rules) if (rx.test(text)) return value;
  return null;
}

function inferLength(text: string): { length: Length; constraint?: string } {
  const words = text.match(/\b(?:under|within|max(?:imum)?|at most|less than|no more than)\s+(\d{2,5})\s+words?\b/i);
  if (words) return { length: 'any', constraint: `Keep it under ${words[1]} words` };
  const exact = text.match(/\b(\d{1,2})\s+(sentences?|paragraphs?|bullets?|ideas?|examples?|steps?)\b/i);
  if (exact) return { length: 'any', constraint: `Produce exactly ${exact[1]} ${exact[2].toLowerCase()}` };
  if (/\b(short|brief|concise|quick|one[- ]liner)\b/i.test(text)) return { length: 'short' };
  if (/\b(detailed|in[- ]depth|thorough|comprehensive|long)\b/i.test(text)) return { length: 'long' };
  return { length: 'any' };
}

function inferAudience(text: string): string {
  // "for beginners", "for my boss", "aimed at 10 year olds", "to a busy executive"
  const m =
    text.match(/\b(?:for|aimed at|targeting)\s+((?:my |our |a |an |the )?[a-z0-9][a-z0-9 \-']{2,40}?)(?=[,.;:!?]|\s+(?:who|that|with|about|in|on|using|and|so|under|within|max|maximum|at most|less than|no more than|as|by|to|[a-z]+ing)\b|$)/i) ??
    null;
  if (!m) return '';
  const cand = m[1].trim();
  // Skip false positives such as "for example" or "for me".
  if (/^(example|me|now|free|it|this|that|a while|instance)$/i.test(cand)) return '';
  return cand;
}

/** Capitalise and tidy the user's idea into a usable goal sentence. */
function tidyGoal(idea: string): string {
  const t = idea.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(cap) ? cap : cap + '.';
}

export function inferSpec(idea: string): PromptSpec {
  const text = idea.trim();
  if (!text) return specForTask('custom');

  const task = firstMatch(TASK_RULES, text) ?? 'custom';
  const base = specForTask(task);

  const tone = firstMatch(TONE_RULES, text) ?? base.tone;
  const format = firstMatch(FORMAT_RULES, text) ?? base.format;
  const { length, constraint } = inferLength(text);

  const constraints = [...base.constraints];
  if (constraint) constraints.unshift(constraint);

  return {
    ...base,
    goal: tidyGoal(text),
    audience: inferAudience(text),
    tone,
    format,
    length,
    constraints,
    // Extraction/classification are reusable "functions", so give them an input slot.
    inputSlot: ['extract', 'classify', 'summarize', 'translate'].includes(task),
  };
}
