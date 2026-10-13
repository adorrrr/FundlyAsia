/** Local calendar date as yyyy-mm-dd. */
export function todayISO(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function durationMinutes(start: string, end: string) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/** Whether a session has finished, judged from its local end date/time. Sessions without a date (TBA) have not ended. */
export function hasEnded(m: { date: string; startTime: string; endTime: string }, now = new Date()) {
  if (!m.date) return false;
  const [y, mo, d] = m.date.split('-').map(Number);
  const [h, mi] = (m.endTime || m.startTime || '23:59').split(':').map(Number);
  return new Date(y, mo - 1, d, h || 0, mi || 0).getTime() < now.getTime();
}
