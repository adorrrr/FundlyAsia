import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useI18n } from '@/i18n/I18nProvider';

/** Step indicator + progress bar. On small screens collapses to "Step n of N" and a bar. */
export function Stepper({ steps, current, onJump, maxReached }: { steps: string[]; current: number; onJump?: (i: number) => void; maxReached: number }) {
  const { d, t, formatNumber } = useI18n();
  const reduce = useReducedMotion();
  const pct = ((current - 1) / (steps.length - 1)) * 100;
  return (
    <nav aria-label={d.elig.title}>
      <div className="flex items-baseline justify-between gap-3 lg:hidden">
        <p className="text-meta font-semibold text-brand">{t(d.elig.stepOf, { n: formatNumber(current), total: formatNumber(steps.length) })}</p>
        <p className="truncate text-meta text-slate">{steps[current - 1]}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist lg:hidden" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={current}>
        <motion.div className="h-full origin-left rounded-full bg-brand-mark" animate={{ scaleX: Math.max(0.04, pct / 100) }} initial={false} transition={{ duration: reduce ? 0 : 0.35 }} />
      </div>
      <ol className="hidden flex-col gap-1 lg:flex">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const reachable = n <= maxReached && !!onJump;
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onJump?.(n)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-left text-body transition-colors',
                  active ? 'bg-surface font-semibold text-ink shadow-hair' : reachable ? 'text-slate hover:bg-surface/70 hover:text-ink' : 'text-slate/70',
                )}
              >
                <span
                  className={cn(
                    'tnum flex h-6 w-6 flex-none items-center justify-center rounded-full text-[0.75rem] font-semibold',
                    done ? 'bg-brand text-white' : active ? 'bg-ink text-white' : 'bg-mist text-slate',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : formatNumber(n)}
                </span>
                <span className="min-w-0">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
