import { useMemo, useRef } from 'react';
import { useDraft } from '@/stores/draftStore';
import { useLibrary } from '@/stores/libraryStore';
import { useSettings } from '@/stores/settingsStore';
import { buildPrompt } from '@/engine/build';
import { scorePrompt } from '@/engine/score';
import { TEMPLATES } from '@/data/templates';
import { SpecEditor } from '@/components/SpecEditor';
import { PromptPreview } from '@/components/PromptPreview';
import { Button, PageHeader, TextArea } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { toast } from '@/stores/toastStore';
import { copyText, titleFromGoal } from '@/lib/util';

export default function Generate() {
  const idea = useDraft((s) => s.idea);
  const setIdea = useDraft((s) => s.setIdea);
  const spec = useDraft((s) => s.spec);
  const editingId = useDraft((s) => s.editingId);
  const autofill = useDraft((s) => s.autofill);
  const load = useDraft((s) => s.load);
  const reset = useDraft((s) => s.reset);
  const save = useLibrary((s) => s.save);
  const recordUse = useLibrary((s) => s.recordUse);
  const defaultStyle = useSettings((s) => s.defaultStyle);
  const previewRef = useRef<HTMLDivElement>(null);

  // Derived, never stored: the text and score are pure functions of the spec.
  const text = useMemo(() => (spec.goal.trim() ? buildPrompt(spec) : ''), [spec]);
  const report = useMemo(() => scorePrompt(spec), [spec]);

  const build = () => {
    if (!idea.trim()) {
      toast.error('Type a rough idea first.');
      return;
    }
    autofill();
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const onCopy = async () => {
    const ok = await copyText(text);
    if (ok && editingId) recordUse(editingId);
    ok ? toast.success('Prompt copied') : toast.error('Copy failed. Select the text and copy manually.');
  };

  const onSave = () => {
    const id = save({ id: editingId, title: titleFromGoal(spec.goal), spec, text, score: report.score });
    useDraft.setState({ editingId: id });
    toast.success(editingId ? 'Saved prompt updated' : 'Saved to your library');
  };

  return (
    <>
      <PageHeader
        title="Generate a prompt"
        subtitle="Describe what you want in plain words. PromptForge structures it into a prompt that works."
      />

      <section aria-labelledby="idea-h" className="card mb-6 space-y-3 p-4">
        <label id="idea-h" htmlFor="idea" className="text-[13px] font-medium">
          Your rough idea
        </label>
        <TextArea
          id="idea"
          rows={3}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') build();
          }}
          placeholder="e.g. write a friendly email for my landlord asking to fix the heater, under 120 words"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={build}>
            <Icon name="wand" size={16} /> Build prompt
          </Button>
          <span className="text-xs text-muted">Ctrl/⌘ + Enter</span>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Or start from a template</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.blurb}
                onClick={() => load({ ...t.spec, style: defaultStyle })}
                className="min-h-[36px] rounded-full border border-line bg-surface px-3 text-[13px] text-muted transition hover:border-accent hover:text-accent"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="edit-h" className="card p-4 sm:p-5">
          <h2 id="edit-h" className="mb-4 text-[15px] font-semibold">
            Refine
          </h2>
          <SpecEditor />
        </section>
        <div ref={previewRef} className="lg:sticky lg:top-6">
          <PromptPreview text={text} report={report} editing={!!editingId} onCopy={onCopy} onSave={onSave} onReset={reset} />
        </div>
      </div>
    </>
  );
}
