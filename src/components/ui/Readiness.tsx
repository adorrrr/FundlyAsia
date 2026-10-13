import { motion, useReducedMotion } from 'framer-motion';
import { readinessBands } from '@/data/scoring';
import { useI18n } from '@/i18n/I18nProvider';
import type { ReadinessBand } from '@/types';
import { cn } from '@/utils/cn';

/**
 * The Fundly bar motif - three stacked bars echo the "F" in the logo.
 * A single bar grows from the left using transform only.
 */
export function GrowBar({ value, className, delay = 0, tone = 'mark' }: { value: number; className?: string; delay?: number; tone?: 'mark' | 'ink' | 'soft' }) {
  const reduce = useReducedMotion();
  const fill = { mark: 'bg-brand-mark', ink: 'bg-ink', soft: 'bg-brand-mark/35' }[tone];
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-mist', className)}>
      <motion.div
        className={cn('h-full origin-left rounded-full', fill)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </div>
  );
}

const bandColor: Record<ReadinessBand, string> = {
  low: 'bg-bad',
  needs_improvement: 'bg-warn',
  moderate: 'bg-brand-mark',
  stronger: 'bg-ok',
};
export const bandText: Record<ReadinessBand, string> = {
  low: 'text-bad',
  needs_improvement: 'text-warn',
  moderate: 'text-brand',
  stronger: 'text-ok',
};

/** Score on a track split into the four readiness bands. The active band is labelled in text, never by colour alone. */
export function ScoreMeter({ score, band, compact }: { score: number; band: ReadinessBand; compact?: boolean }) {
  const { d, formatNumber } = useI18n();
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="relative">
        <div className="flex h-3 gap-1" aria-hidden>
          {readinessBands.map((b) => (
            <div key={b.band} className={cn('relative h-full overflow-hidden rounded-full bg-mist')} style={{ flexGrow: b.max - b.min + 1 }}>
              <div className={cn('absolute inset-0 rounded-full', bandColor[b.band], b.band === band ? 'opacity-100' : 'opacity-[0.18]')} />
            </div>
          ))}
        </div>
        <motion.div
          aria-hidden
          className="absolute -top-1.5 h-6 w-1 -translate-x-1/2 rounded-full bg-ink shadow-[0_0_0_3px_white]"
          initial={reduce ? false : { left: '0%' }}
          animate={{ left: `${score}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </div>
      {!compact && (
        <div className="mt-3 grid grid-cols-4 gap-1 text-[0.75rem] leading-tight text-slate">
          {readinessBands.map((b) => (
            <div key={b.band} className={cn(b.band === band && 'font-semibold text-ink')}>
              <span className="tnum block">{formatNumber(b.min)}–{formatNumber(b.max)}</span>
              <span className="mt-0.5 block">{d.bands[b.band]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BandBadge({ band }: { band: ReadinessBand }) {
  const { d } = useI18n();
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-meta font-semibold', bandText[band])}>
      <span aria-hidden className={cn('h-2 w-2 rounded-full', bandColor[band])} />
      {d.bands[band]}
    </span>
  );
}
