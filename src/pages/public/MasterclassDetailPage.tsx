import { useParams } from 'react-router-dom';
import { Check, Info } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationAvailability, registrationService } from '@/services';
import { MasterclassCover } from '@/components/masterclasses/MasterclassCover';
import { AvailabilityBadge, useAvailabilityText } from '@/components/masterclasses/Availability';
import { MasterclassMeta } from '@/components/masterclasses/MasterclassMeta';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { GrowBar } from '@/components/ui/Readiness';
import { durationMinutes } from '@/utils/date';

export default function MasterclassDetailPage() {
  const { id = '' } = useParams();
  const { d, l, t, formatDate, formatMoney, formatNumber } = useI18n();
  const { user } = useAuth();
  const { data: m, loading, error } = useAsync(() => masterclassService.get(id), [id]);
  const { data: speaker } = useAsync(async () => (m ? (await masterclassService.listSpeakers()).find((s) => s.id === m.speakerId) : undefined), [m?.speakerId]);
  const { data: mine } = useAsync(async () => (user?.role === 'sme' ? registrationService.listMine(user.id) : []), [user?.id]);
  const availText = useAvailabilityText();
  useDocumentTitle(m ? l(m.title) : undefined);

  if (loading) return <div className="shell py-12"><Skeleton className="h-[480px] rounded-panel" /></div>;
  if (error || !m || m.status === 'draft')
    return (
      <div className="shell py-16">
        <EmptyState title={d.mc.notFound} action={<Button to="/masterclasses" variant="secondary">{d.mc.backToList}</Button>} />
      </div>
    );

  const avail = registrationAvailability(m);
  const existing = mine?.find((r) => r.masterclassId === m.id && r.status !== 'cancelled');
  const minutes = durationMinutes(m.startTime, m.endTime);
  const hours = minutes ? (minutes / 60).toLocaleString(undefined, { maximumFractionDigits: 1 }) : null;

  const cta = existing ? (
    <Button to={`/registrations/${existing.id}`} full variant="secondary">{d.mc.viewRegistration}</Button>
  ) : avail.open ? (
    user?.role === 'sme' ? (
      <Button to={`/masterclasses/${m.id}/register`} full size="lg">{d.mc.register}</Button>
    ) : (
      <Button to={`/login?next=${encodeURIComponent(`/masterclasses/${m.id}/register`)}`} full size="lg">{d.mc.loginToRegister}</Button>
    )
  ) : (
    <Button full disabled>{availText(avail)}</Button>
  );

  return (
    <div className="shell pb-8 pt-8 sm:pt-12">
      <PageHeader back={{ to: '/masterclasses', label: d.mc.backToList }} title={l(m.title)} body={l(m.topic)} meta={<AvailabilityBadge m={m} avail={avail} />} />
      <MasterclassCover m={m} size="lg" className="aspect-[16/9] rounded-panel sm:aspect-[21/8]" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <div className="min-w-0">
          <section aria-labelledby="about-session">
            <h2 id="about-session" className="text-card font-semibold">{d.mc.aboutSession}</h2>
            <p className="mt-3 max-w-prose text-lead text-ink/90">{l(m.description)}</p>
          </section>

          <section aria-labelledby="learn" className="mt-10">
            <h2 id="learn" className="text-card font-semibold">{d.mc.learnTitle}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {m.learn.map((p) => (
                <li key={p.en} className="flex gap-3 rounded-card bg-surface p-4 text-body shadow-hair">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-soft text-brand"><Check className="h-3 w-3" aria-hidden /></span>
                  {l(p)}
                </li>
              ))}
            </ul>
          </section>

          {speaker && (
            <section aria-labelledby="speaker" className="mt-10">
              <h2 id="speaker" className="text-card font-semibold">{d.mc.aboutSpeaker}</h2>
              <div className="mt-4 flex gap-4">
                <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-full bg-mist text-lead font-bold text-slate">
                  {speaker.photo ? <img src={speaker.photo} alt={speaker.name} className="h-full w-full object-cover" /> : speaker.name.split(' ').map((p) => p[0]).join('')}
                </div>
                <div>
                  <p className="text-body font-semibold">{speaker.name}</p>
                  <p className="text-meta text-slate">{speaker.designation} · {speaker.institution}</p>
                  <p className="mt-2 max-w-prose text-body text-slate">{l(speaker.bio)}</p>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--nav-h)+28px)] lg:self-start">
          <div className="glass rounded-panel p-6">
            <p className="text-meta text-slate">{d.mc.fee}</p>
            <p className="tnum text-[1.75rem] font-bold">{formatMoney(m.fee)}</p>
            <MasterclassMeta m={m} speaker={speaker} className="mt-5 border-t border-line pt-5" />
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 text-meta">
              {hours && (
                <div>
                  <dt className="text-slate">{d.mc.duration}</dt>
                  <dd className="tnum font-semibold">{t(d.common.hoursShort, { n: formatNumber(Number(hours)) })}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate">{d.mc.deadline}</dt>
                <dd className="font-semibold">{formatDate(m.registrationDeadline)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate">{d.mc.capacity}</dt>
                <dd className="mt-1">
                  <span className="tnum font-semibold">{t(d.mc.seatsCount, { taken: formatNumber(Math.min(m.seatsTaken, m.capacity)), total: formatNumber(m.capacity) })}</span>
                  <GrowBar value={(m.seatsTaken / m.capacity) * 100} className="mt-2" tone={m.seatsTaken >= m.capacity ? 'ink' : 'mark'} />
                </dd>
              </div>
            </dl>
            <div className="mt-6">{cta}</div>
            {m.fee > 0 && avail.open && (
              <p className="mt-3 flex gap-2 text-meta text-slate"><Info className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />{d.mc.paidNote}</p>
            )}
            {existing && <p className="mt-3 text-center text-meta font-semibold text-ok">{d.mc.alreadyRegistered}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
