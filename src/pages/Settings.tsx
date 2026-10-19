import { useEffect, useState, useSyncExternalStore } from 'react';
import { useSettings } from '@/stores/settingsStore';
import type { Theme } from '@/stores/settingsStore';
import { useReview } from '@/stores/reviewStore';
import { getMetrics, subscribeMetrics } from '@/lib/perf';
import { toast } from '@/stores/toastStore';
import { Button, Field, PageHeader, Segmented, Select, TextInput } from '@/components/ui';
import type { LapsePolicy, TargetStyle } from '@/types';

/** Chrome fires this before offering install; we hold it to trigger from our own button. */
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

function useInstallPrompt() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  return evt ? async () => { await evt.prompt(); setEvt(null); } : null;
}

export default function Settings() {
  const s = useSettings();
  const resetProgress = useReview((r) => r.resetProgress);
  const install = useInstallPrompt();
  const metrics = useSyncExternalStore(subscribeMetrics, () => getMetrics().length ? getMetrics().map((m) => `${m.name}:${m.value}`).join('|') : '');
  const rows = metrics ? getMetrics() : [];
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-xl space-y-6">
        <section className="card space-y-5 p-5" aria-labelledby="appearance-h">
          <h2 id="appearance-h" className="text-[15px] font-semibold">
            Appearance
          </h2>
          <div className="space-y-1.5">
            <span className="block text-[13px] font-medium">Theme</span>
            <Segmented<Theme>
              label="Theme"
              value={s.theme}
              onChange={s.setTheme}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </div>
        </section>

        <section className="card space-y-5 p-5" aria-labelledby="gen-h">
          <h2 id="gen-h" className="text-[15px] font-semibold">
            Prompt generation
          </h2>
          <Field label="Default prompt layout" hint="XML tags give the clearest boundaries and work well with most modern models.">
            {(a) => (
              <Select {...a} value={s.defaultStyle} onChange={(e) => s.setDefaultStyle(e.target.value as TargetStyle)}>
                <option value="xml">XML tags</option>
                <option value="markdown">Markdown headings</option>
                <option value="plain">Plain labelled text</option>
              </Select>
            )}
          </Field>
        </section>

        <section className="card space-y-5 p-5" aria-labelledby="rev-h">
          <h2 id="rev-h" className="text-[15px] font-semibold">
            Review
          </h2>
          <Field label="Cards per session">
            {(a) => <TextInput {...a} type="number" min={3} max={30} value={s.sessionSize} onChange={(e) => s.setSessionSize(Number(e.target.value) || 10)} />}
          </Field>
          <Field label="When you miss a card" hint="Classic Leitner sends it back to box 1. Gentle drops it by one box.">
            {(a) => (
              <Select {...a} value={s.lapsePolicy} onChange={(e) => s.setLapsePolicy(e.target.value as LapsePolicy)}>
                <option value="reset">Back to box 1 (classic)</option>
                <option value="demote">Down one box (gentle)</option>
              </Select>
            )}
          </Field>
          {confirmReset ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" onClick={() => { resetProgress(); setConfirmReset(false); toast.info('Review progress reset'); }}>
                Yes, reset all progress
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Reset review progress
            </Button>
          )}
        </section>

        <section className="card space-y-3 p-5" aria-labelledby="app-h">
          <h2 id="app-h" className="text-[15px] font-semibold">
            App
          </h2>
          {install ? (
            <Button variant="primary" onClick={install}>
              Install PromptForge
            </Button>
          ) : (
            <p className="text-sm text-muted">Install from your browser menu (Add to Home Screen) to use PromptForge offline like a native app.</p>
          )}
          <div>
            <h3 className="mb-2 text-[13px] font-medium">Performance (this session)</h3>
            {rows.length === 0 ? (
              <p className="text-xs text-muted">Metrics appear after you switch tabs or leave the page.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Web vitals measured this session</caption>
                <thead className="text-muted">
                  <tr>
                    <th scope="col" className="py-1 font-medium">Metric</th>
                    <th scope="col" className="py-1 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(-8).map((m, i) => (
                    <tr key={`${m.name}-${i}`} className="border-t border-line">
                      <td className="py-1">{m.name}</td>
                      <td className="py-1 tabular-nums">{m.name === 'CLS' ? m.value.toFixed(3) : `${Math.round(m.value)} ms`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
