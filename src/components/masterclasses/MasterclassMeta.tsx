import { CalendarDays, Clock, MapPin, UserRound } from 'lucide-react';
import type { Masterclass, Speaker } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/utils/cn';

/** Date, time, venue and speaker. A missing speaker reads "to be announced" - never a made-up name. */
export function MasterclassMeta({ m, speaker, className, dense, showSpeaker = true }: { m: Masterclass; speaker?: Speaker; className?: string; dense?: boolean; showSpeaker?: boolean }) {
  const { d, l, formatDate, formatTime } = useI18n();
  const items = [
    { icon: CalendarDays, label: d.mc.date, value: formatDate(m.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) },
    { icon: Clock, label: d.mc.time, value: m.startTime ? `${formatTime(m.startTime)} – ${formatTime(m.endTime)}` : d.common.tba },
    { icon: MapPin, label: d.mc.venue, value: l(m.venue) },
    ...(showSpeaker ? [{ icon: UserRound, label: d.mc.speaker, value: speaker?.name ?? d.mc.speakerTba, muted: !speaker }] : []),
  ];
  return (
    <dl className={cn('grid gap-2', dense ? 'text-meta' : 'text-body', className)}>
      {items.map(({ icon: Icon, label, value, ...rest }) => (
        <div key={label} className="flex items-start gap-2.5">
          <Icon className={cn('flex-none text-slate', dense ? 'mt-0.5 h-3.5 w-3.5' : 'mt-1 h-4 w-4')} aria-hidden />
          <dt className="sr-only">{label}</dt>
          <dd className={cn('min-w-0', 'muted' in rest && rest.muted ? 'text-slate' : 'text-ink')}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
