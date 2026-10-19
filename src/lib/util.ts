/** Small, dependency-free helpers. */

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Clipboard write with a textarea fallback for older/insecure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadText(filename: string, content: string, mime = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(new Date(iso)) - startOf(now)) / 86_400_000);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `in ${diff} days`;
}

/** Derive a short title from a goal sentence. */
export function titleFromGoal(goal: string): string {
  const t = goal.trim().replace(/\.$/, '');
  if (!t) return 'Untitled prompt';
  return t.length > 56 ? t.slice(0, 53).trimEnd() + '…' : t;
}
