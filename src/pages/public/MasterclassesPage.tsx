import { useMemo, useState } from 'react';
import { CalendarX2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useSpeakers } from '@/hooks/useSpeakers';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationAvailability } from '@/services';
import { MasterclassCard } from '@/components/masterclasses/MasterclassCard';
import { MasterclassCover } from '@/components/masterclasses/MasterclassCover';
import { MasterclassMeta } from '@/components/masterclasses/MasterclassMeta';
import { AvailabilityBadge } from '@/components/masterclasses/Availability';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Reveal } from '@/components/ui/Reveal';
import { todayISO } from '@/utils/date';
import type { Masterclass } from '@/types';

export default function MasterclassesPage() {
  const { d, l, formatMoney } = useI18n();
  useDocumentTitle(d.mc.listTitle);
  const { data, loading, error, reload } = useAsync(() => masterclassService.listPublic(), []);
  const speakers = useSpeakers();
  const [q, setQ] = useState('');

  const { featured, upcoming, past } = useMemo(() => {
    const today = todayISO();
    const all = data ?? [];
    const query = q.trim().toLowerCase();
    const match = (m: Masterclass) =>
      !query || [m.title.en, m.title.bn, m.topic.en, m.topic.bn].some((s) => s.toLowerCase().includes(query));
    const isPast = (m: Masterclass) => m.status === 'completed' || (!!m.date && m.date < today);
    const up = all.filter((m) => !isPast(m) && match(m));
    const feat = !query ? up.find((m) => registrationAvailability(m).open) : undefined;
    return { featured: feat, upcoming: up.filter((m) => m !== feat), past: all.filter((m) => isPast(m) && match(m)) };
  }, [data, q]);

  return (
    <div className="shell pb-8 pt-10 sm:pt-14">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-page font-bold">{d.mc.listTitle}</h1>
          <p className="mt-3 max-w-xl text-lead text-slate">{d.mc.listBody}</p>
        </div>
        {(data?.length ?? 0) > 3 && <SearchInput value={q} onChange={setQ} placeholder={d.mc.searchPlaceholder} />}
      </header>

      {loading ? (
        <div className="mt-10 grid gap-6">
          <Skeleton className="h-80 rounded-panel" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-96 rounded-card" />)}
          </div>
        </div>
      ) : error ? (
        <div className="mt-10"><ErrorState onRetry={reload} /></div>
      ) : !data?.length ? (
        <EmptyState
          className="mt-10"
          icon={<CalendarX2 className="h-5 w-5" />}
          title={d.mc.emptyTitle}
          body={d.mc.emptyBody}
          action={<Button to="/signup?next=/eligibility">{d.home.heroPrimary}</Button>}
        />
      ) : (
        <>
          {featured && (
            <Reveal className="mt-10">
              <article className="grid overflow-hidden rounded-panel bg-surface shadow-float lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <MasterclassCover m={featured} size="lg" className="min-h-[220px] lg:min-h-[360px]" />
                <div className="flex flex-col p-6 sm:p-8">
                  <div className="mb-3 flex flex-wrap gap-2"><AvailabilityBadge m={featured} avail={registrationAvailability(featured)} /></div>
                  <h2 className="text-section font-semibold">{l(featured.title)}</h2>
                  <p className="mt-2 text-body text-slate">{l(featured.summary)}</p>
                  <MasterclassMeta m={featured} speaker={speakers.byId(featured.speakerId)} className="mt-5" />
                  <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="tnum text-[1.375rem] font-bold">{formatMoney(featured.fee)}</p>
                    <div className="flex gap-2">
                      <Button to={`/masterclasses/${featured.id}`} variant="secondary">{d.mc.details}</Button>
                      <Button to={`/masterclasses/${featured.id}/register`}>{d.mc.register}</Button>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          )}

          {upcoming.length > 0 && (
            <section className="mt-14" aria-labelledby="up-title">
              <h2 id="up-title" className="mb-5 text-card font-semibold">{d.mc.upcoming}</h2>
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((m) => (
                  <li key={m.id}><MasterclassCard m={m} speaker={speakers.byId(m.speakerId)} /></li>
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section className="mt-14" aria-labelledby="past-title">
              <h2 id="past-title" className="mb-5 text-card font-semibold text-slate">{d.mc.past}</h2>
              <ul className="grid gap-6 opacity-90 md:grid-cols-2 lg:grid-cols-3">
                {past.map((m) => (
                  <li key={m.id}><MasterclassCard m={m} speaker={speakers.byId(m.speakerId)} /></li>
                ))}
              </ul>
            </section>
          )}

          {!featured && !upcoming.length && !past.length && <EmptyState className="mt-10" title={d.common.noResults} action={<Button variant="secondary" onClick={() => setQ('')}>{d.common.clearFilters}</Button>} />}
        </>
      )}
    </div>
  );
}
