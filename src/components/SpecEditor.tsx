/**
 * Structured editor for a PromptSpec. Every field maps 1:1 to a section of the
 * generated prompt, so editing here is a direct way to *see* how prompts are built.
 */
import { useDraft } from '@/stores/draftStore';
import { TASK_PROFILES, specForTask } from '@/engine/defaults';
import type { Length, OutputFormat, TargetStyle, TaskType, TechniqueId, Tone } from '@/types';
import { Button, Field, Segmented, Select, TextArea, TextInput, Toggle } from './ui';
import { Icon } from './Icon';

const TONES: Tone[] = ['neutral', 'formal', 'friendly', 'casual', 'persuasive', 'playful', 'technical'];
const FORMATS: Array<[OutputFormat, string]> = [
  ['free', 'Free-form'],
  ['bullets', 'Bullet list'],
  ['numbered', 'Numbered list'],
  ['table', 'Table'],
  ['json', 'JSON'],
  ['markdown', 'Markdown'],
  ['email', 'Email'],
  ['code', 'Code block'],
];
const LENGTHS: Array<[Length, string]> = [
  ['any', 'No preference'],
  ['short', 'Short'],
  ['medium', 'Medium'],
  ['long', 'Long'],
];
const TECHNIQUES: Array<[TechniqueId, string]> = [
  ['role', 'Role'],
  ['chain-of-thought', 'Step-by-step reasoning'],
  ['few-shot', 'Examples'],
  ['self-critique', 'Self-check'],
  ['clarify-first', 'Ask questions first'],
  ['delimiters', 'Delimiters'],
];
const STYLES: Array<{ value: TargetStyle; label: string }> = [
  { value: 'xml', label: 'XML tags' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plain', label: 'Plain' },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function SpecEditor() {
  const spec = useDraft((s) => s.spec);
  const patch = useDraft((s) => s.patch);
  const hasTech = (t: TechniqueId) => spec.techniques.includes(t);

  const toggleTech = (t: TechniqueId, on: boolean) =>
    patch({ techniques: on ? [...spec.techniques, t] : spec.techniques.filter((x) => x !== t) });

  const setConstraint = (i: number, v: string) =>
    patch({ constraints: spec.constraints.map((c, idx) => (idx === i ? v : c)) });

  return (
    <div className="space-y-5">
      <Field label="Task type">
        {(a) => (
          <div className="flex gap-2">
            <Select {...a} value={spec.task} onChange={(e) => patch({ task: e.target.value as TaskType })}>
              {(Object.keys(TASK_PROFILES) as TaskType[]).map((t) => (
                <option key={t} value={t}>
                  {TASK_PROFILES[t].label}
                </option>
              ))}
            </Select>
            <Button
              size="md"
              onClick={() => patch({ ...specForTask(spec.task, { goal: spec.goal, context: spec.context, audience: spec.audience, style: spec.style }) })}
              title="Reset role, techniques, format and constraints to this task's recommended defaults"
            >
              Apply defaults
            </Button>
          </div>
        )}
      </Field>

      <Field label="Goal" hint="What should the model do, to what, and why? A full sentence beats a keyword.">
        {(a) => <TextArea {...a} rows={3} value={spec.goal} onChange={(e) => patch({ goal: e.target.value })} placeholder="e.g. Summarize the meeting notes into action items with owners." />}
      </Field>

      <Field label="Context" hint="Background the model can't guess: situation, constraints, what you've tried.">
        {(a) => <TextArea {...a} rows={3} value={spec.context} onChange={(e) => patch({ context: e.target.value })} />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Audience">
          {(a) => <TextInput {...a} value={spec.audience} onChange={(e) => patch({ audience: e.target.value })} placeholder="e.g. new hires" />}
        </Field>
        <Field label="Role">
          {(a) => <TextInput {...a} value={spec.role} onChange={(e) => patch({ role: e.target.value })} placeholder="e.g. a senior editor" />}
        </Field>
        <Field label="Tone">
          {(a) => (
            <Select {...a} value={spec.tone} onChange={(e) => patch({ tone: e.target.value as Tone })}>
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {cap(t)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Output format">
          {(a) => (
            <Select {...a} value={spec.format} onChange={(e) => patch({ format: e.target.value as OutputFormat })}>
              {FORMATS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Length">
          {(a) => (
            <Select {...a} value={spec.length} onChange={(e) => patch({ length: e.target.value as Length })}>
              {LENGTHS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium">Constraints</legend>
        {spec.constraints.map((c, i) => (
          <div key={i} className="flex gap-2">
            <TextInput
              aria-label={`Constraint ${i + 1}`}
              value={c}
              onChange={(e) => setConstraint(i, e.target.value)}
              placeholder="A rule the answer must follow"
            />
            <Button variant="ghost" aria-label={`Remove constraint ${i + 1}`} onClick={() => patch({ constraints: spec.constraints.filter((_, idx) => idx !== i) })}>
              <Icon name="x" />
            </Button>
          </div>
        ))}
        <Button size="sm" onClick={() => patch({ constraints: [...spec.constraints, ''] })}>
          <Icon name="plus" size={14} /> Add constraint
        </Button>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium">Techniques</legend>
        <div className="flex flex-wrap gap-2">
          {TECHNIQUES.map(([id, label]) => (
            <Toggle key={id} pressed={hasTech(id)} onChange={(on) => toggleTech(id, on)}>
              {label}
            </Toggle>
          ))}
        </div>
      </fieldset>

      {hasTech('few-shot') && (
        <fieldset className="space-y-3">
          <legend className="text-[13px] font-medium">Examples</legend>
          {spec.examples.map((ex, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-line p-3">
              <TextInput
                aria-label={`Example ${i + 1} input`}
                placeholder="Example input"
                value={ex.input}
                onChange={(e) => patch({ examples: spec.examples.map((x, idx) => (idx === i ? { ...x, input: e.target.value } : x)) })}
              />
              <TextInput
                aria-label={`Example ${i + 1} output`}
                placeholder="Ideal output"
                value={ex.output}
                onChange={(e) => patch({ examples: spec.examples.map((x, idx) => (idx === i ? { ...x, output: e.target.value } : x)) })}
              />
              <Button size="sm" variant="ghost" onClick={() => patch({ examples: spec.examples.filter((_, idx) => idx !== i) })}>
                Remove example
              </Button>
            </div>
          ))}
          <Button size="sm" onClick={() => patch({ examples: [...spec.examples, { input: '', output: '' }] })}>
            <Icon name="plus" size={14} /> Add example
          </Button>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <div className="space-y-1.5">
          <span className="block text-[13px] font-medium">Prompt layout</span>
          <Segmented label="Prompt layout" value={spec.style} options={STYLES} onChange={(style) => patch({ style })} />
        </div>
        <Toggle pressed={spec.inputSlot} onChange={(inputSlot) => patch({ inputSlot })}>
          Reusable input slot
        </Toggle>
      </div>
    </div>
  );
}
