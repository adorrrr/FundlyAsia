import { motion, useReducedMotion } from 'framer-motion';
import { useId } from 'react';

/** Circular score indicator. The arc draws once on mount (transform/opacity-friendly SVG stroke). */
export function ReadinessRing({ value, size = 132, stroke = 11, children }: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--brand-mark))" />
            <stop offset="100%" stopColor="rgb(var(--brand))" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--mist))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
