/**
 * Lightweight performance + error monitoring with no dependencies.
 *
 * Uses PerformanceObserver to capture the Core Web Vitals (LCP, CLS, INP-ish via
 * event timing, FCP) plus navigation timing. Metrics are kept in a small in-memory
 * ring buffer (shown on the Settings page) and, if VITE_TELEMETRY_URL is set, beaconed
 * to that endpoint. With no URL configured nothing ever leaves the device.
 */
export interface Metric {
  name: string;
  value: number;
  at: number;
}

const buffer: Metric[] = [];
const listeners = new Set<() => void>();
const ENDPOINT = import.meta.env.VITE_TELEMETRY_URL as string | undefined;

function record(name: string, value: number) {
  const m = { name, value: Math.round(value * 100) / 100, at: Date.now() };
  buffer.push(m);
  if (buffer.length > 50) buffer.shift();
  listeners.forEach((l) => l());
  if (import.meta.env.DEV) console.debug(`[perf] ${name}`, m.value);
}

export function reportError(error: unknown, info?: string) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[app-error]', message, info ?? '');
  if (ENDPOINT && navigator.sendBeacon) {
    navigator.sendBeacon(
      ENDPOINT,
      JSON.stringify({ type: 'error', message, info, url: location.pathname, at: Date.now() }),
    );
  }
}

function send(m: Metric) {
  if (ENDPOINT && navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, JSON.stringify({ type: 'metric', ...m, url: location.pathname }));
  }
}

export function initPerformanceMonitoring() {
  if (typeof PerformanceObserver === 'undefined') return;

  const observe = (type: string, cb: (entries: PerformanceEntryList) => void, extra: object = {}) => {
    try {
      const po = new PerformanceObserver((list) => cb(list.getEntries()));
      po.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
    } catch {
      /* entry type unsupported in this browser */
    }
  };

  observe('paint', (es) => {
    const fcp = es.find((e) => e.name === 'first-contentful-paint');
    if (fcp) record('FCP', fcp.startTime);
  });

  let lcp = 0;
  observe('largest-contentful-paint', (es) => {
    lcp = es[es.length - 1].startTime;
  });

  let cls = 0;
  observe('layout-shift', (es) => {
    for (const e of es as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
      if (!e.hadRecentInput) cls += e.value;
    }
  });

  let worstInput = 0;
  observe(
    'event',
    (es) => {
      for (const e of es) worstInput = Math.max(worstInput, e.duration);
    },
    { durationThreshold: 40 },
  );

  // Final values are only stable once the page is hidden, so flush then.
  const flush = () => {
    if (lcp) record('LCP', lcp);
    record('CLS', cls);
    if (worstInput) record('INP', worstInput);
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) record('TTFB', nav.responseStart);
    buffer.slice(-5).forEach(send);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export function getMetrics(): Metric[] {
  return [...buffer];
}

export function subscribeMetrics(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
