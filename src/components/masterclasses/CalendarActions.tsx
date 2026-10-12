import { CalendarPlus, Download } from 'lucide-react';
import type { Masterclass } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { downloadIcs, googleCalendarUrl } from '@/utils/calendar';

export function CalendarActions({ m, regId }: { m: Masterclass; regId: string }) {
  const { d } = useI18n();
  if (!m.date || !m.startTime) return <p className="text-meta text-slate">{d.confirm.calendarTba}</p>;
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="secondary" href={googleCalendarUrl(m, regId)} icon={<CalendarPlus className="h-4 w-4" />}>{d.confirm.google}</Button>
      <Button variant="secondary" onClick={() => downloadIcs(m, regId)} icon={<Download className="h-4 w-4" />}>{d.confirm.ics}</Button>
    </div>
  );
}
