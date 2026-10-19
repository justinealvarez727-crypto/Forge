import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LESSONS } from '@/data/lessons';
import { useReview } from '@/stores/reviewStore';
import { BOX_COUNT, computeStats, intervalDays } from '@/engine/leitner';
import { Badge, Button, PageHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn, formatRelativeDay } from '@/lib/util';

export default function Learn() {
  const cards = useReview((s) => s.cards);
  const streak = useReview((s) => s.streak);
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(LESSONS[0].id);

  const stats = useMemo(() => computeStats(Object.values(cards)), [cards]);
  const max = Math.max(1, ...stats.perBox);

  return (
    <>
      <PageHeader
        title="Learn prompt engineering"
        subtitle="Short lessons on the techniques behind good prompts, reviewed on a Leitner schedule so they stick."
        actions={
          <Button variant="primary" disabled={stats.due === 0} onClick={() => navigate('/review')}>
            {stats.due > 0 ? `Review ${stats.due} due` : 'Nothing due'}
          </Button>
        }
      />

      <section aria-labelledby="progress-h" className="card mb-6 p-4 sm:p-5">
        <h2 id="progress-h" className="sr-only">
          Your progress
        </h2>
        <dl className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Due now" value={String(stats.due)} />
          <Stat label="Day streak" value={String(streak)} />
          <Stat label="Mastered" value={`${Math.round(stats.mastery * 100)}%`} />
          <Stat label="Accuracy" value={stats.accuracy === null ? '–' : `${Math.round(stats.accuracy * 100)}%`} />
        </dl>

        <p className="mb-2 text-xs font-medium text-muted">Cards per Leitner box (review interval)</p>
        <ol className="grid grid-cols-5 gap-2">
          {stats.perBox.map((n, i) => (
            <li key={i} className="flex flex-col items-center gap-1">
              <div className="flex h-16 w-full items-end rounded-md bg-raised">
                <div
                  className="w-full rounded-md bg-accent transition-[height]"
                  style={{ height: `${(n / max) * 100}%`, minHeight: n ? 4 : 0 }}
                  role="img"
                  aria-label={`Box ${i + 1}: ${n} cards`}
                />
              </div>
              <span className="text-xs font-medium tabular-nums">{n}</span>
              <span className="text-[11px] text-muted">
                Box {i + 1} · {intervalDays(i + 1)}d
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">
          Right answers move a card up one box ({BOX_COUNT} total). A miss sends it back so you see it again tomorrow.
        </p>
      </section>

      <ul className="space-y-3">
        {LESSONS.map((l, idx) => {
          const card = cards[l.id];
          const isOpen = open === l.id;
          return (
            <li key={l.id} className="card overflow-hidden">
              <h2>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`lesson-${l.id}`}
                  onClick={() => setOpen(isOpen ? null : l.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{l.title}</span>
                    <span className="block text-sm text-muted">{l.summary}</span>
                  </span>
                  {card && (
                    <span className="hidden text-right text-xs text-muted sm:block">
                      Box {card.box}
                      <br />
                      due {formatRelativeDay(card.dueAt)}
                    </span>
                  )}
                  <span className={cn('transition', isOpen && 'rotate-180')}>
                    <Icon name="chevron" size={16} />
                  </span>
                </button>
              </h2>
              {isOpen && (
                <div id={`lesson-${l.id}`} className="space-y-4 border-t border-line p-4 text-sm">
                  <p>{l.why}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Example tone="bad" label="Weak" text={l.weak} />
                    <Example tone="good" label="Strong" text={l.strong} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Example({ tone, label, text }: { tone: 'good' | 'bad'; label: string; text: string }) {
  return (
    <div className="rounded-lg border border-line bg-raised p-3">
      <Badge tone={tone}>{label}</Badge>
      <p className="prose-prompt mt-2">{text}</p>
    </div>
  );
}
