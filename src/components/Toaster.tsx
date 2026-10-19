import { AnimatePresence, motion } from 'framer-motion';
import { useToasts } from '@/stores/toastStore';
import { cn } from '@/lib/util';

/** Polite live region so screen readers announce "Copied" without stealing focus. */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'pointer-events-auto rounded-lg border px-4 py-2 text-sm shadow-soft',
              t.tone === 'error' ? 'border-bad/40 bg-surface text-bad' : 'border-line bg-surface text-ink',
            )}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
