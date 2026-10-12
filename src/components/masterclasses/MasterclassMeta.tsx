import { CalendarDays, Clock, MapPin, UserRound } from 'lucide-react';
import type { Masterclass, Speaker } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/utils/cn';

export function MasterclassMeta({ m, speaker, className, dense }: { m: Masterclass; speaker?: Speaker; className?: string; dense?: boolean }) {
  const { d, l, formatDate, formatTime } = useI18n();
  const items = [
    { icon: CalendarDays, label: d.mc.date, value: formatDate(m.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) },
    { icon: Clock, label: d.mc.time, value: m.startTime ? `${formatTime(m.startTime)} – ${formatTime(m.endTime)}` : d.common.tba },
    { icon: MapPin, label: d.mc.venue, value: l(m.venue) },
    ...(speaker ? [{ icon: UserRound, label: d.mc.speaker, value: speaker.name }] : []),
  ];
  return (
    <dl className={cn('grid gap-2', dense ? 'text-meta' : 'text-body', className)}>
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-2.5">
          <Icon className={cn('flex-none text-slate', dense ? 'mt-0.5 h-3.5 w-3.5' : 'mt-1 h-4 w-4')} aria-hidden />
          <dt className="sr-only">{label}</dt>
          <dd className="min-w-0 text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
