import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, Ticket } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { businessService, eligibilityService, masterclassService, registrationAvailability, registrationService } from '@/services';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, Notice, Skeleton } from '@/components/ui/Feedback';
import { BandBadge, ScoreMeter } from '@/components/ui/Readiness';
import { cn } from '@/utils/cn';

function Panel({ title, action, children, className, delay = 0 }: { title: string; action?: ReactNode; children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn('surface flex flex-col p-5 sm:p-6', className)}
      aria-label={title}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-card font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

export default function DashboardPage() {
  const { d, t, l, formatDate, formatTime, formatNumber } = useI18n();
  useDocumentTitle(d.nav.dashboard);
  const { user } = useAuth();
  const uid = user!.id;
  const profile = useAsync(() => businessService.getProfile(uid), [uid]);
  const classes = useAsync(() => masterclassService.listPublic(), []);
  const regs = useAsync(() => registrationService.listMine(uid), [uid]);
  const draft = useAsync(() => eligibilityService.getDraft(uid), [uid]);
  const results = useAsync(() => eligibilityService.listResults(uid), [uid]);

  useEffect(() => {
    const handler = () => {
      classes.reload();
      regs.reload();
    };
    window.addEventListener('fundly:masterclasses-updated', handler);
    return () => window.removeEventListener('fundly:masterclasses-updated', handler);
  }, [classes, regs]);

  const loading = profile.loading || classes.loading || regs.loading || draft.loading || results.loading;
  const upcoming = (classes.data ?? []).filter((m) => registrationAvailability(m).open).slice(0, 3);
  const latest = results.data?.[0];
  const myRegs = (regs.data ?? []).slice(0, 3);
  const titleOf = (id: string) => l(classes.data?.find((m) => m.id === id)?.title);

  const next = draft.data
    ? { text: t(d.dash.nextResume, { n: formatNumber(draft.data.currentStep) }), cta: d.dash.resumeCheck, to: `/eligibility/${draft.data.id}` }
    : !latest
      ? { text: d.dash.nextCheck, cta: d.dash.startCheck, to: '/eligibility' }
      : !regs.data?.length && upcoming[0]
        ? { text: d.dash.nextRegister, cta: d.mc.register, to: `/masterclasses/${upcoming[0].id}` }
        : { text: d.dash.nextDone, cta: d.dash.viewResult, to: `/eligibility/${latest.id}/result` };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-page font-bold">{t(d.dash.welcome, { name: profile.data?.businessName ?? user!.name })}</h1>
        <p className="mt-2 text-lead text-slate">{d.dash.welcomeBody}</p>
      </header>

      {loading ? (
        <div className="grid gap-5">
          <Skeleton className="h-32 rounded-panel" />
          <div className="grid gap-5 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-card" />)}</div>
        </div>
      ) : (
        <>
          <section aria-labelledby="next-step" className="glass relative mb-6 overflow-hidden rounded-panel p-6 sm:p-7">
            <div aria-hidden className="absolute -right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2.5 md:flex">
              <span className="h-4 w-52 rounded-l-full bg-brand-mark/70" />
              <span className="ml-12 h-4 w-40 rounded-l-full bg-brand-mark/40" />
              <span className="ml-28 h-4 w-24 rounded-l-full bg-ink/70" />
            </div>
            <div className="relative max-w-xl">
              <h2 id="next-step" className="text-meta font-semibold text-brand">{d.dash.nextAction}</h2>
              <p className="mt-1.5 text-[1.25rem] font-semibold leading-snug">{next.text}</p>
              <Button to={next.to} className="mt-5">{next.cta}</Button>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title={d.dash.eligibility} delay={0.04}>
              <p className="text-body text-slate">{d.dash.eligibilityBody}</p>
              <p className="mt-1 text-body text-slate">{d.elig.whatYouGet}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {draft.data ? (
                  <Button to={`/eligibility/${draft.data.id}`} icon={<ClipboardList className="h-4 w-4" />}>{d.dash.resumeCheck}</Button>
                ) : (
                  <Button to="/eligibility" icon={<ClipboardList className="h-4 w-4" />}>{d.dash.startCheck}</Button>
                )}
              </div>
            </Panel>

            <Panel title={d.dash.latest} delay={0.08} action={latest ? <Button variant="link" to="/eligibility">{d.dash.viewAll}</Button> : undefined}>
              {latest ? (
                <>
                  {latest.sample ? (
                    <Notice tone="info" title={d.result.scorePendingTitle}>{d.result.scorePendingBody}</Notice>
                  ) : (
                    <>
                      <div className="flex items-end justify-between gap-3">
                        <p className="tnum text-[2.75rem] font-bold leading-none tracking-tight">{formatNumber(latest.score)}<span className="ml-1 text-body font-medium text-slate">/ {formatNumber(100)}</span></p>
                        <BandBadge band={latest.band} />
                      </div>
                      <div className="mt-5"><ScoreMeter score={latest.score} band={latest.band} compact /></div>
                    </>
                  )}
                  <p className="mt-4 text-meta text-slate">{t(d.result.assessedOn, { date: formatDate(latest.createdAt) })}</p>
                  <Button to={`/eligibility/${latest.id}/result`} variant="secondary" className="mt-4 self-start">{d.dash.viewResult}</Button>
                </>
              ) : (
                <EmptyState title={d.dash.latestEmpty} className="flex-1 py-6" />
              )}
            </Panel>

            <Panel title={d.dash.upcoming} delay={0.12} action={<Button variant="link" to="/masterclasses">{d.dash.browse}</Button>}>
              {upcoming.length ? (
                <ul className="-mx-2 flex flex-col">
                  {upcoming.map((m) => (
                    <li key={m.id}>
                      <Link to={`/masterclasses/${m.id}`} className="flex items-center gap-4 rounded-control px-2 py-3 hover:bg-paper">
                        <span className="flex w-12 flex-none flex-col items-center rounded-control bg-mist py-1.5 text-center">
                          <span className="text-[0.6875rem] font-semibold text-slate">{formatDate(m.date, { month: 'short' })}</span>
                          <span className="tnum text-lead font-bold leading-tight">{formatDate(m.date, { day: 'numeric' })}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-body font-semibold">{l(m.title)}</span>
                          <span className="block truncate text-meta text-slate">{formatTime(m.startTime)} · {l(m.venue)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<CalendarDays className="h-5 w-5" />} title={d.dash.upcomingEmpty} className="py-6" />
              )}
            </Panel>

            <Panel title={d.dash.myRegs} delay={0.16} action={myRegs.length ? <Button variant="link" to="/my-registrations">{d.dash.viewAll}</Button> : undefined}>
              {myRegs.length ? (
                <ul className="-mx-2 flex flex-col">
                  {myRegs.map((r) => (
                    <li key={r.id}>
                      <Link to={`/registrations/${r.id}`} className="flex items-center justify-between gap-3 rounded-control px-2 py-3 hover:bg-paper">
                        <span className="min-w-0">
                          <span className="block truncate text-body font-semibold">{titleOf(r.masterclassId)}</span>
                          <span className="tnum block text-meta text-slate">{r.id}</span>
                        </span>
                        <StatusBadge status={r.paymentStatus === 'not_required' ? r.status : r.paymentStatus} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<Ticket className="h-5 w-5" />} title={d.dash.myRegsEmpty} action={<Button to="/masterclasses" variant="secondary" size="sm">{d.dash.browse}</Button>} className="py-6" />
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
