import { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { ErrorBoundary } from './ErrorBoundary';
import { PageSkeleton } from './Skeleton';
import { Toaster } from './Toaster';
import { useReview } from '@/stores/reviewStore';
import { dueQueue } from '@/engine/leitner';
import { cn } from '@/lib/util';

const NAV: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: '/', label: 'Generate', icon: 'zap', end: true },
  { to: '/library', label: 'Library', icon: 'library' },
  { to: '/learn', label: 'Learn', icon: 'learn' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

function useDueCount() {
  const cards = useReview((s) => s.cards);
  return dueQueue(Object.values(cards)).length;
}

function NavItem({ to, label, icon, end, badge, vertical }: (typeof NAV)[number] & { badge?: number; vertical: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'relative flex items-center rounded-lg text-sm font-medium transition',
          vertical ? 'gap-3 px-3 py-2.5' : 'flex-1 flex-col gap-0.5 py-2 text-[11px]',
          isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-raised hover:text-ink',
        )
      }
    >
      <Icon name={icon} size={vertical ? 18 : 22} />
      <span>{label}</span>
      {!!badge && (
        <span
          className={cn(
            'rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-5 text-accent-ink',
            vertical ? 'ml-auto' : 'absolute right-[22%] top-1',
          )}
          aria-label={`${badge} cards due`}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export function Layout() {
  const location = useLocation();
  const due = useDueCount();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface p-4 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <img src="/favicon.svg" alt="" width={26} height={26} />
          <span className="text-[15px] font-semibold tracking-tight">PromptForge</span>
        </div>
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavItem key={n.to} {...n} vertical badge={n.to === '/learn' ? due : undefined} />
          ))}
        </nav>
        <p className="mt-auto px-2 text-xs text-muted">Your data stays on this device.</p>
      </aside>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-10">
        <ErrorBoundary inline resetKey={location.pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1 backdrop-blur lg:hidden"
      >
        {NAV.map((n) => (
          <NavItem key={n.to} {...n} vertical={false} badge={n.to === '/learn' ? due : undefined} />
        ))}
      </nav>

      <Toaster />
    </div>
  );
}
