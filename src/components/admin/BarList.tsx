import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/utils/cn';

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** Optional fixed colour class for status-like categories (always paired with its text label). */
  colorClass?: string;
}

/**
 * Horizontal bar chart for a handful of categories: single hue by default, value
 * labels in ink, a hover/focus tooltip with share of total, and an equivalent
 * table for screen readers.
 */
export function BarList({ data, caption, unit }: { data: BarDatum[]; caption: string; unit?: string }) {
  const { formatNumber } = useI18n();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((n, d) => n + d.value, 0);

  return (
    <figure>
      <ul className="flex flex-col gap-3" aria-hidden>
        {data.map((d, i) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          const active = hover === d.key;
          return (
            <li
              key={d.key}
              className="relative"
              onMouseEnter={() => setHover(d.key)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="mb-1 flex items-baseline justify-between gap-3 text-meta">
                <span className={cn('truncate', active ? 'text-ink' : 'text-slate')}>{d.label}</span>
                <span className="tnum flex-none font-semibold text-ink">{formatNumber(d.value)}</span>
              </div>
              <div className="h-2.5 rounded-[4px] bg-mist">
                <motion.div
                  className={cn('h-full origin-left rounded-[4px] transition-opacity', d.colorClass ?? 'bg-brand-mark', hover && !active && 'opacity-40')}
                  style={{ width: `${(d.value / max) * 100}%` }}
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              {active && (
                <div className="glass pointer-events-none absolute -top-9 right-0 z-10 whitespace-nowrap rounded-control px-2.5 py-1 text-meta">
                  <span className="font-semibold">{d.label}</span> · <span className="tnum">{formatNumber(d.value)}{unit ? ` ${unit}` : ''} ({formatNumber(pct)}%)</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}><th scope="row">{d.label}</th><td>{d.value}</td></tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}

export function StatTile({
  label,
  value,
  note,
  className,
}: {
  label: string;
  value: string;
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn('surface flex flex-col p-2.5 sm:p-5', className)}>
      <p className="text-[0.72rem] sm:text-meta text-slate font-medium leading-tight">{label}</p>
      <p className="tnum mt-auto pt-1.5 sm:pt-3 text-[1.15rem] sm:text-[1.875rem] font-bold leading-tight tracking-tight text-ink">{value}</p>
      {note && <p className="mt-1 sm:mt-2 text-[0.65rem] sm:text-[0.75rem] text-slate leading-tight">{note}</p>}
    </div>
  );
}
