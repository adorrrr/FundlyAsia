import type { Masterclass, RegistrationAvailability } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { Badge } from '@/components/ui/Badge';

export function useAvailabilityText() {
  const { d } = useI18n();
  return (a: RegistrationAvailability) =>
    a.open
      ? d.status.registration_open
      : { full: d.mc.full, closed: d.mc.closed, cancelled: d.mc.cancelled, deadline: d.mc.deadlinePassed, completed: d.mc.completed, draft: d.mc.draft }[a.reason];
}

export function AvailabilityBadge({ m, avail }: { m: Masterclass; avail: RegistrationAvailability }) {
  const { d, t, formatNumber } = useI18n();
  const text = useAvailabilityText();
  if (avail.open) {
    const left = m.capacity - m.seatsTaken;
    return (
      <>
        <Badge tone="ok">{d.status.registration_open}</Badge>
        {left <= 10 && <Badge tone="warn" dot={false}>{t(d.common.seatsLeft, { n: formatNumber(left) })}</Badge>}
      </>
    );
  }
  const tone = avail.reason === 'cancelled' ? 'bad' : avail.reason === 'full' || avail.reason === 'deadline' ? 'warn' : 'neutral';
  return <Badge tone={tone}>{text(avail)}</Badge>;
}
