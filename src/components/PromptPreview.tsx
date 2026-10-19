import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { QualityReport } from '@/types';
import { estimateTokens } from '@/engine/build';
import { speak, speechSupported, stopSpeaking } from '@/lib/speech';
import { Badge, Button } from './ui';
import { Icon } from './Icon';
import { ScoreRing } from './ScoreRing';

interface Props {
  text: string;
  report: QualityReport;
  editing: boolean;
  onCopy: () => void;
  onSave: () => void;
  onReset: () => void;
}

export function PromptPreview({ text, report, editing, onCopy, onSave, onReset }: Props) {
  const [showChecks, setShowChecks] = useState(true);
  const failed = report.checks.filter((c) => !c.passed);
  const gradeTone = report.score >= 70 ? 'good' : report.score >= 45 ? 'warn' : 'bad';

  return (
    <section aria-labelledby="preview-h" className="card flex flex-col">
      <div className="flex items-center gap-4 border-b border-line p-4">
        <ScoreRing score={report.score} />
        <div className="min-w-0 flex-1">
          <h2 id="preview-h" className="text-[15px] font-semibold">
            Your prompt
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone={gradeTone}>{report.grade}</Badge>
            <span className="text-xs text-muted">~{estimateTokens(text)} tokens</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {text ? (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.pre
              key={text.length === 0 ? 'empty' : 'text'}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              tabIndex={0}
              aria-label="Generated prompt text"
              className="prose-prompt max-h-[420px] overflow-auto rounded-lg bg-raised p-4"
            >
              {text}
            </motion.pre>
          </AnimatePresence>
        ) : (
          <p className="rounded-lg bg-raised p-6 text-center text-sm text-muted">
            Describe your idea and press <strong className="text-ink">Build prompt</strong>, or pick a starter template.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-4">
        <Button variant="primary" onClick={onCopy} disabled={!text}>
          <Icon name="copy" size={16} /> Copy
        </Button>
        <Button onClick={onSave} disabled={!text}>
          <Icon name="save" size={16} /> {editing ? 'Update saved' : 'Save to library'}
        </Button>
        {speechSupported && (
          <Button
            variant="ghost"
            onClick={() => speak(text)}
            onBlur={stopSpeaking}
            disabled={!text}
            aria-label="Read prompt aloud"
          >
            <Icon name="volume" size={16} /> Listen
          </Button>
        )}
        <Button variant="ghost" onClick={onReset} className="ml-auto">
          New
        </Button>
      </div>

      <div className="border-t border-line">
        <button
          type="button"
          onClick={() => setShowChecks((v) => !v)}
          aria-expanded={showChecks}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
        >
          <span>
            Quality checks <span className="text-muted">({report.checks.length - failed.length}/{report.checks.length} passed)</span>
          </span>
          <span className={showChecks ? 'rotate-180 transition' : 'transition'}>
            <Icon name="chevron" size={16} />
          </span>
        </button>
        {showChecks && (
          <ul className="space-y-2 px-4 pb-4">
            {report.checks.map((c) => (
              <li key={c.id} className="flex gap-2 text-sm">
                <span className={c.passed ? 'text-good' : 'text-warn'} aria-hidden="true">
                  <Icon name={c.passed ? 'check' : 'plus'} size={16} />
                </span>
                <span>
                  <span className="sr-only">{c.passed ? 'Passed: ' : 'To improve: '}</span>
                  <span className={c.passed ? 'text-muted' : 'font-medium'}>{c.label}</span>
                  {!c.passed && <span className="block text-xs text-muted">{c.tip}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
