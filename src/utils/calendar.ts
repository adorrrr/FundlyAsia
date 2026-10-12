import type { Masterclass } from '@/types';

const stamp = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;

/** Google Calendar "add event" link. Times are Asia/Dhaka. */
export function googleCalendarUrl(m: Masterclass, regId: string) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: m.title.en,
    dates: `${stamp(m.date, m.startTime)}/${stamp(m.date, m.endTime)}`,
    ctz: 'Asia/Dhaka',
    details: `${m.summary.en}\nRegistration ID: ${regId}`,
    location: m.venue.en,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(m: Masterclass, regId: string) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fundly//Masterclass//EN',
    'BEGIN:VEVENT',
    `UID:${regId}@fundly.asia`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;TZID=Asia/Dhaka:${stamp(m.date, m.startTime)}`,
    `DTEND;TZID=Asia/Dhaka:${stamp(m.date, m.endTime)}`,
    `SUMMARY:${m.title.en}`,
    `LOCATION:${m.venue.en}`,
    `DESCRIPTION:Registration ID ${regId}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${m.slug}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
