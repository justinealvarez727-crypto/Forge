import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initPerformanceMonitoring, reportError } from './lib/perf';
import { applyTheme, useSettings } from './stores/settingsStore';
import { useReview } from './stores/reviewStore';
import './index.css';

// Theme: apply the saved choice and follow OS changes while set to "system".
applyTheme(useSettings.getState().theme);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useSettings.getState().theme === 'system') applyTheme('system');
});

// Make sure every lesson has a Leitner card (also covers lessons added in later releases).
useReview.getState().ensureCards();

// Monitoring + last-resort error capture for errors React can't catch (async, handlers).
initPerformanceMonitoring();
window.addEventListener('error', (e) => reportError(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason));

// PWA: register the service worker; autoUpdate swaps in new versions silently.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {/* reducedMotion="user": Framer Motion skips transform animations when the OS asks. */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>,
);
