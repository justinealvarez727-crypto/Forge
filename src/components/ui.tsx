/**
 * Small design-system primitives. Keeping them in one file keeps the bundle's
 * shared chunk tiny and makes the visual language easy to audit: one focus ring,
 * 44px minimum touch targets on interactive controls, semantic colour tokens only.
 */
import { forwardRef, useId } from 'react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/util';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:opacity-90',
  secondary: 'border border-line bg-surface text-ink hover:bg-raised',
  ghost: 'text-muted hover:bg-raised hover:text-ink',
  danger: 'border border-bad/40 bg-surface text-bad hover:bg-bad/10',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        size === 'md' ? 'min-h-[44px] px-4 text-sm' : 'min-h-[36px] px-3 text-[13px]',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
});

const CONTROL =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(CONTROL, 'min-h-[44px]', className)} {...rest} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(CONTROL, 'resize-y leading-relaxed', className)} {...rest} />;
  },
);

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, 'min-h-[44px]', className)} {...rest}>
      {children}
    </select>
  );
}

/** Label + optional hint wired to the control through generated ids. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (a11y: { id: string; 'aria-describedby'?: string }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      {children({ id, 'aria-describedby': hintId })}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Pressable pill used for multi-select options (techniques). */
export function Toggle({
  pressed,
  onChange,
  children,
}: {
  pressed: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      onClick={() => onChange(!pressed)}
      className={cn(
        'min-h-[36px] rounded-full border px-3 text-[13px] transition',
        pressed ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-surface text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-raised p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-[36px] rounded-md px-3 text-[13px] font-medium transition',
            value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent' }) {
  const tones = {
    neutral: 'bg-raised text-muted',
    good: 'bg-good/10 text-good',
    warn: 'bg-warn/10 text-warn',
    bad: 'bg-bad/10 text-bad',
    accent: 'bg-accent/10 text-accent',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
