import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLibrary } from '@/stores/libraryStore';
import { useDraft } from '@/stores/draftStore';
import { toast } from '@/stores/toastStore';
import { Badge, Button, EmptyState, PageHeader, TextInput } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { copyText, cn, downloadText } from '@/lib/util';

export default function Library() {
  const prompts = useLibrary((s) => s.prompts);
  const { remove, toggleFavorite, recordUse, importJson, exportJson } = useLibrary.getState();
  const load = useDraft((s) => s.load);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prompts
      .filter((p) => (onlyFav ? p.favorite : true))
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt));
  }, [prompts, query, onlyFav]);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const n = importJson(await file.text());
      toast.success(n ? `Imported ${n} prompt${n === 1 ? '' : 's'}` : 'Nothing new to import');
    } catch {
      toast.error('That file is not a valid PromptForge export.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <PageHeader
        title="Library"
        subtitle={`${prompts.length} saved prompt${prompts.length === 1 ? '' : 's'}`}
        actions={
          <>
            <input ref={fileRef} type="file" accept="application/json" className="sr-only" aria-label="Import prompts from JSON file" onChange={(e) => onImport(e.target.files?.[0])} tabIndex={-1} />
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={14} /> Import
            </Button>
            <Button
              size="sm"
              disabled={!prompts.length}
              onClick={() => downloadText(`promptforge-library-${new Date().toISOString().slice(0, 10)}.json`, exportJson())}
            >
              <Icon name="download" size={14} /> Export
            </Button>
          </>
        }
      />

      {prompts.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          body="Build a prompt on the Generate screen and press Save to library. It will show up here, ready to reuse."
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Generate a prompt
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="min-w-[220px] flex-1">
              <TextInput
                type="search"
                aria-label="Search saved prompts"
                placeholder="Search title, text or tag"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button variant={onlyFav ? 'primary' : 'secondary'} aria-pressed={onlyFav} onClick={() => setOnlyFav((v) => !v)}>
              <Icon name="star" size={16} filled={onlyFav} /> Favorites
            </Button>
          </div>

          {visible.length === 0 && <p className="py-10 text-center text-sm text-muted">No prompts match that search.</p>}

          <ul className="grid gap-3 md:grid-cols-2">
            <AnimatePresence initial={false}>
              {visible.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  className="card flex flex-col p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-[15px] font-semibold leading-snug">{p.title}</h2>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(p.id)}
                      aria-pressed={p.favorite}
                      aria-label={p.favorite ? `Remove ${p.title} from favorites` : `Add ${p.title} to favorites`}
                      className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-raised', p.favorite ? 'text-warn' : 'text-muted')}
                    >
                      <Icon name="star" size={18} filled={p.favorite} />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={p.score >= 70 ? 'good' : p.score >= 45 ? 'warn' : 'bad'}>Score {p.score}</Badge>
                    {p.tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                    {p.uses > 0 && <span className="text-xs text-muted">Copied {p.uses}×</span>}
                  </div>
                  <p className="prose-prompt mt-3 line-clamp-4 text-muted">{p.text}</p>
                  <div className="mt-4 flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        const ok = await copyText(p.text);
                        if (ok) recordUse(p.id);
                        ok ? toast.success('Prompt copied') : toast.error('Copy failed');
                      }}
                    >
                      <Icon name="copy" size={14} /> Copy
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        load(p.spec, p.id);
                        navigate('/');
                      }}
                    >
                      <Icon name="edit" size={14} /> Edit
                    </Button>
                    {confirming === p.id ? (
                      <>
                        <Button size="sm" variant="danger" onClick={() => { remove(p.id); setConfirming(null); toast.info('Prompt deleted'); }}>
                          Confirm delete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" className="ml-auto" aria-label={`Delete ${p.title}`} onClick={() => setConfirming(p.id)}>
                        <Icon name="trash" size={14} />
                      </Button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}
    </>
  );
}
