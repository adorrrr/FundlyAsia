import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { useI18n } from '@/i18n/I18nProvider';

export type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-mist text-slate',
  brand: 'bg-brand-soft text-brand-deep',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  info: 'bg-info-soft text-info',
};
const dots: Record<Tone, string> = {
  neutral: 'bg-slate/60',
  brand: 'bg-brand-mark',
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
};

export function Badge({ tone = 'neutral', children, dot = true, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-meta font-semibold', tones[tone], className)}>
      {dot && <span aria-hidden className={cn('h-1.5 w-1.5 flex-none rounded-full', dots[tone])} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  draft: 'neutral',
  published: 'info',
  registration_open: 'ok',
  registration_closed: 'warn',
  completed: 'neutral',
  cancelled: 'bad',
  pending_payment: 'warn',
  confirmed: 'ok',
  attended: 'brand',
  no_show: 'neutral',
  not_required: 'neutral',
  pending: 'warn',
  pending_verification: 'warn',
  paid: 'ok',
  failed: 'bad',
  refund_requested: 'info',
  partially_refunded: 'info',
  refunded: 'neutral',
  active: 'ok',
  inactive: 'neutral',
  submitted: 'ok',
  in_progress: 'info',
};

/** One badge for every status string in the app, labelled from the dictionary. */
export function StatusBadge({ status }: { status: keyof ReturnType<typeof useI18n>['d']['status'] }) {
  const { d } = useI18n();
  return <Badge tone={statusTone[status] ?? 'neutral'}>{d.status[status]}</Badge>;
}
