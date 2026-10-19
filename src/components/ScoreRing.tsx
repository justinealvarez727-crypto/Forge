import { motion, useReducedMotion } from 'framer-motion';

/** Animated circular gauge. Colour is paired with the number, so colour is never the only signal. */
export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const reduce = useReducedMotion();
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const tone = score >= 70 ? 'rgb(var(--good))' : score >= 45 ? 'rgb(var(--warn))' : 'rgb(var(--bad))';
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Prompt quality score ${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="6" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
        {score}
      </span>
    </div>
  );
}
