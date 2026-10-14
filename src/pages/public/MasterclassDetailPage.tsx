import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronLeft, Info, UserRound } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
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
import { GrowBar } from '@/components/ui/Readiness';
import { durationMinutes } from '@/utils/date';

import { onMasterclassesChanged } from '@/services/api/manualPaymentApi';

export default function MasterclassDetailPage() {
  const { id = '' } = useParams();
  const { d, l, t, formatDate, formatMoney, formatNumber } = useI18n();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const { data: m, loading, error, reload } = useAsync(() => masterclassService.get(id), [id]);

  useEffect(() => {
    return onMasterclassesChanged(() => reload());
  }, [reload]);

  const { data: speaker } = useAsync(async () => (m?.speakerId ? (await masterclassService.listSpeakers()).find((s) => s.id === m.speakerId) : undefined), [m?.speakerId]);
  const { data: mine } = useAsync(async () => (user?.role === 'sme' ? registrationService.listMine(user.id) : []), [user?.id]);
  const availText = useAvailabilityText();
  useDocumentTitle(m ? l(m.title) : undefined);

  if (loading)
    return (
      <div className="shell grid gap-8 py-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Skeleton className="aspect-[16/9] rounded-panel" />
        <Skeleton className="h-[360px] rounded-panel" />
      </div>
    );
  if (error || !m || m.status === 'draft' || m.sample)
    return (
      <div className="shell py-16">
        <EmptyState title={d.mc.notFound} action={<Button to="/masterclasses" variant="secondary">{d.mc.backToList}</Button>} />
      </div>
    );

  const avail = registrationAvailability(m);
  const existing = mine?.find((r) => r.masterclassId === m.id && r.status !== 'cancelled');
  const minutes = durationMinutes(m.startTime, m.endTime);
  const hours = minutes ? Math.round((minutes / 60) * 10) / 10 : null;
  const registerHref = `/masterclasses/${m.id}/register`;

  const cta = existing ? (
    <Button to={`/registrations/${existing.id}`} full variant="secondary">{d.mc.viewRegistration}</Button>
  ) : avail.open ? (
    user?.role === 'sme' ? (
      <Button to={registerHref} full size="lg">{d.mc.register}</Button>
    ) : (
      <Button to={`/login?next=${encodeURIComponent(registerHref)}`} full size="lg">{d.mc.loginToRegister}</Button>
    )
  ) : (
    <Button full disabled>{availText(avail)}</Button>
  );

  return (
    <div className="shell pb-8 pt-6 sm:pt-10">
      <Link to="/masterclasses" className="mb-5 inline-flex items-center gap-1 text-meta font-medium text-slate hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {d.mc.backToList}
      </Link>

      {/* Header: image beside the key details on desktop, stacked on mobile */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-stretch lg:gap-8">
        <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <MasterclassCover m={m} size="lg" priority sizes="(min-width: 1024px) 760px, 100vw" className="aspect-[16/9] w-full rounded-panel shadow-hair" />
          {m.coverCredit && (
            <p className="mt-2 text-[0.75rem] text-slate">
              <a href={m.coverCredit.url} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
                {t(d.mc.photoCredit, { name: m.coverCredit.name })}
              </a>
            </p>
          )}
        </motion.div>

        <div className="flex flex-col rounded-panel bg-surface p-6 shadow-hair sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge m={m} avail={avail} />
          </div>
          <p className="mt-4 text-meta font-semibold text-brand">{l(m.topic)}</p>
          <h1 className="mt-1 text-[clamp(1.5rem,1.2rem+1.1vw,2rem)] font-bold leading-tight tracking-tight">{l(m.title)}</h1>
          <MasterclassMeta m={m} speaker={speaker} className="mt-5" />
          <div className="mt-auto pt-6">
            <div className="flex items-end justify-between gap-4 border-t border-line pt-5">
              <div>
                <p className="text-meta text-slate">{d.mc.fee}</p>
                <p className="tnum text-[1.625rem] font-bold leading-tight">{formatMoney(m.fee)}</p>
              </div>
              <div className="hidden w-52 lg:block">{cta}</div>
            </div>
            {m.fee > 0 && avail.open && !existing && (
              <p className="mt-3 flex gap-2 text-meta text-slate"><Info className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />{d.mc.paidNote}</p>
            )}
            {existing && <p className="mt-3 text-meta font-semibold text-ok">{d.mc.alreadyRegistered}</p>}
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-8">
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

          <section aria-labelledby="speaker" className="mt-10">
            <h2 id="speaker" className="text-card font-semibold">{d.mc.aboutSpeaker}</h2>
            {speaker ? (
              <div className="mt-4 flex gap-4">
                <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-full bg-mist text-lead font-bold text-slate">
                  {speaker.photo ? <img src={speaker.photo} alt={speaker.name} width={64} height={64} className="h-full w-full object-cover" /> : speaker.name.split(' ').map((p) => p[0]).join('')}
                </div>
                <div>
                  <p className="text-body font-semibold">{speaker.name}</p>
                  <p className="text-meta text-slate">{[speaker.designation, speaker.institution].filter(Boolean).join(' · ')}</p>
                  <p className="mt-2 max-w-prose text-body text-slate">{l(speaker.bio)}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 flex items-center gap-3 text-body text-slate">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mist"><UserRound className="h-4 w-4" aria-hidden /></span>
                {d.mc.speakerTba}
              </p>
            )}
          </section>
        </div>

        <aside aria-label={d.mc.keyDetails} className="lg:sticky lg:top-[calc(var(--nav-h)+28px)] lg:self-start">
          <dl className="grid grid-cols-2 gap-5 rounded-panel bg-surface p-6 text-meta shadow-hair">
            {hours && (
              <div>
                <dt className="text-slate">{d.mc.duration}</dt>
                <dd className="tnum mt-0.5 text-body font-semibold">{t(d.common.hoursShort, { n: formatNumber(hours) })}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate">{d.mc.deadline}</dt>
              <dd className="mt-0.5 text-body font-semibold">{formatDate(m.registrationDeadline)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate">{d.mc.capacity}</dt>
              <dd className="mt-1">
                <span className="tnum text-body font-semibold">{t(d.mc.seatsCount, { taken: formatNumber(Math.min(m.seatsTaken, m.capacity)), total: formatNumber(m.capacity) })}</span>
                <GrowBar value={(m.seatsTaken / m.capacity) * 100} className="mt-2" tone={m.seatsTaken >= m.capacity ? 'ink' : 'mark'} />
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {/* Mobile/tablet: keep the main action within reach */}
      <div className="sticky bottom-3 z-40 mt-10 lg:hidden">
        <div className="glass mx-auto flex max-w-xl items-center gap-3 rounded-[18px] p-2.5 pl-4">
          <p className="tnum flex-none text-body font-bold">{formatMoney(m.fee)}</p>
          <div className="min-w-0 flex-1">{cta}</div>
        </div>
      </div>
    </div>
  );
}
