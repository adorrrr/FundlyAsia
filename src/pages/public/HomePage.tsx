import { useState } from 'react';
import { Check, ChevronDown, FileWarning, HelpCircle, LineChart, Route, ShieldCheck, Ban, BookOpen } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationAvailability } from '@/services';
import { Button } from '@/components/ui/Button';
import { Hero } from '@/components/hero/Hero';
import { Reveal } from '@/components/ui/Reveal';
import { ScoreMeter } from '@/components/ui/Readiness';
import { Skeleton } from '@/components/ui/Feedback';
import { MasterclassCover } from '@/components/masterclasses/MasterclassCover';
import { MasterclassMeta } from '@/components/masterclasses/MasterclassMeta';
import { AvailabilityBadge } from '@/components/masterclasses/Availability';
import { useSpeakers } from '@/hooks/useSpeakers';
import { cn } from '@/utils/cn';


function Challenge() {
  const { d } = useI18n();
  const icons = [FileWarning, HelpCircle, LineChart, Route];
  return (
    <section className="shell py-16 sm:py-20" aria-labelledby="challenge-title">
      <Reveal>
        <h2 id="challenge-title" className="max-w-[24ch] text-section font-semibold">{d.home.challengeTitle}</h2>
      </Reveal>
      <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {d.home.challenge.map((c, i) => {
          const Icon = icons[i];
          return (
            <Reveal as="li" key={c.title} delay={i * 0.05}>
              <Icon className="h-5 w-5 text-slate" aria-hidden />
              <h3 className="mt-3 text-card font-semibold">{c.title}</h3>
              <p className="mt-1.5 text-body text-slate">{c.body}</p>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}

function Pillars() {
  const { d } = useI18n();
  return (
    <section className="shell pb-16 sm:pb-20" aria-labelledby="pillars-title">
      <Reveal className="rounded-panel bg-mist/70 p-2 sm:p-3">
        <div className="flex flex-col gap-1 px-4 pb-4 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-5">
          <h2 id="pillars-title" className="text-section font-semibold">{d.home.pillarsTitle}</h2>
          <p className="max-w-sm text-body text-slate">{d.home.pillarsBody}</p>
        </div>
        <ol className="grid gap-2 md:grid-cols-[1.35fr_1fr_1fr_1fr]">
          {d.home.pillars.map((p) => (
            <li
              key={p.title}
              className={cn('flex flex-col rounded-[18px] p-5', p.now ? 'bg-surface shadow-lift' : 'bg-transparent')}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className={cn('text-[1.5rem] font-bold tracking-tight', p.now ? 'text-ink' : 'text-slate')}>{p.title}</h3>
                <span className={cn('rounded-full px-2 py-0.5 text-[0.75rem] font-semibold', p.now ? 'bg-brand-soft text-brand-deep' : 'text-slate ring-1 ring-line')}>
                  {p.now ? d.home.pillarNow : d.home.pillarLater}
                </span>
              </div>
              <p className={cn('mt-3 text-body', p.now ? 'text-ink' : 'text-slate')}>{p.body}</p>
            </li>
          ))}
        </ol>
        <p className="px-4 pb-3 pt-4 text-meta font-medium text-slate sm:px-5">{d.home.scoreNote}</p>
      </Reveal>
    </section>
  );
}

function HowItWorks() {
  const { d, formatNumber } = useI18n();
  return (
    <section id="how" className="border-y border-line bg-surface py-16 sm:py-20" aria-labelledby="how-title">
      <div className="shell grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <Reveal>
          <h2 id="how-title" className="text-section font-semibold">{d.home.howTitle}</h2>
          <p className="mt-3 max-w-sm text-body text-slate">{d.home.howOptional}</p>
          <Button to="/masterclasses" variant="secondary" className="mt-6">{d.home.howCta}</Button>
        </Reveal>
        <ol className="relative flex flex-col">
          {d.home.how.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.06} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 pb-8 last:pb-0">
              {i < d.home.how.length - 1 && <span aria-hidden className="absolute left-[1.2rem] top-11 h-[calc(100%-2.75rem)] w-px bg-line" />}
              <span className="tnum flex h-10 w-10 items-center justify-center rounded-full bg-ink text-body font-bold text-white">{formatNumber(i + 1)}</span>
              <div className="pt-1.5">
                <h3 className="text-card font-semibold">{s.title}</h3>
                <p className="mt-1 text-body text-slate">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LoanLab() {
  const { d, l, t, formatMoney, formatNumber } = useI18n();
  const { data, loading } = useAsync(() => masterclassService.listPublic(), []);
  const next = data?.find((m) => registrationAvailability(m).open) ?? data?.find((m) => m.status !== 'completed');
  const speakers = useSpeakers();
  const speaker = next ? speakers.byId(next.speakerId) : undefined;
  return (
    <section className="shell py-16 sm:py-24" aria-labelledby="loanlab-title">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
        <Reveal>
          <h2 id="loanlab-title" className="text-section font-semibold">{d.home.loanLabTitle}</h2>
          <p className="mt-3 text-lead text-slate">{d.home.loanLabBody}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {d.home.loanLabFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-body font-medium">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-md border-l-2 border-brand-mark pl-4 text-body text-ink">{d.home.loanLabOutcome}</p>
          <p className="mt-4 text-meta text-slate">{d.home.whoNote}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-card font-semibold">{d.home.featuredTitle}</h3>
            <Button to="/masterclasses" variant="link">{d.home.featuredAll}</Button>
          </div>
          {loading ? (
            <Skeleton className="h-[420px] rounded-panel" />
          ) : next ? (
            <article className="overflow-hidden rounded-panel bg-surface shadow-float">
              <MasterclassCover m={next} className="aspect-[2/1]" size="lg" />
              <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-7">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <AvailabilityBadge m={next} avail={registrationAvailability(next)} />
                  </div>
                  <h4 className="text-[1.375rem] font-semibold leading-tight tracking-tight">{l(next.title)}</h4>
                  <p className="mt-2 text-body text-slate">{l(next.summary)}</p>
                  <MasterclassMeta m={next} speaker={speaker} className="mt-5" />
                </div>
                <div className="flex flex-col gap-3 sm:w-44 sm:border-l sm:border-line sm:pl-6">
                  <div>
                    <p className="text-meta text-slate">{d.mc.fee}</p>
                    <p className="tnum text-[1.5rem] font-bold">{formatMoney(next.fee)}</p>
                  </div>
                  <p className="text-meta text-slate">{t(d.mc.seatsCount, { taken: formatNumber(next.seatsTaken), total: formatNumber(next.capacity) })}</p>
                  <Button to={`/masterclasses/${next.id}`} full className="mt-auto">{d.mc.register}</Button>
                </div>
              </div>
            </article>
          ) : (
            <p className="rounded-panel bg-surface p-8 text-body text-slate shadow-hair">{d.mc.emptyBody}</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function ReadinessPreview() {
  const { d } = useI18n();
  const { user } = useAuth();
  return (
    <section className="shell pb-16 sm:pb-24" aria-labelledby="preview-title">
      <Reveal className="grid items-center gap-10 rounded-panel bg-surface p-6 shadow-hair sm:p-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 id="preview-title" className="text-section font-semibold">{d.home.previewTitle}</h2>
          <p className="mt-3 text-body text-slate">{d.home.previewBody}</p>
          <Button to={user?.role === 'sme' ? '/eligibility' : '/signup?next=/eligibility'} className="mt-6">{d.home.previewCta}</Button>
        </div>
        <figure className="rounded-card bg-paper p-5 sm:p-6">
          <div className="mb-6 flex items-end gap-3">
            <span className="tnum text-[3.5rem] font-bold leading-none tracking-tight">64</span>
            <span className="pb-1.5 text-body text-slate">/ 100</span>
          </div>
          <ScoreMeter score={64} band="moderate" />
          <figcaption className="mt-5 flex items-start gap-2 text-meta text-slate">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />
            {d.home.previewDisclaimer}
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}

function WhoAndTrust() {
  const { d } = useI18n();
  const trustIcons = [Ban, ShieldCheck, BookOpen];
  return (
    <section id="about" className="shell grid gap-12 pb-16 sm:pb-24 lg:grid-cols-2 lg:gap-16" aria-label={d.nav.about}>
      <Reveal>
        <h2 className="text-section font-semibold">{d.home.whoTitle}</h2>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {d.home.who.map((w) => (
            <li key={w} className="flex items-center gap-3 py-3.5 text-body font-medium">
              <span aria-hidden className="h-1.5 w-4 rounded-full bg-brand-mark" />
              {w}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="text-section font-semibold">{d.home.trustTitle}</h2>
        <ul className="mt-6 flex flex-col gap-5">
          {d.home.trust.map((tr, i) => {
            const Icon = trustIcons[i];
            return (
              <li key={tr.title} className="flex gap-4">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-control bg-mist text-ink">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3 className="text-body font-semibold">{tr.title}</h3>
                  <p className="mt-0.5 text-body text-slate">{tr.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}

function Faq() {
  const { d } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="shell pb-16 sm:pb-24" aria-labelledby="faq-title">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <Reveal>
          <h2 id="faq-title" className="text-section font-semibold">{d.home.faqTitle}</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <ul className="divide-y divide-line border-y border-line">
            {d.home.faq.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={f.q}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${i}`}
                      id={`faq-q-${i}`}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left text-body font-semibold hover:text-brand"
                    >
                      {f.q}
                      <ChevronDown className={cn('h-4 w-4 flex-none text-slate transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden />
                    </button>
                  </h3>
                  <div
                    id={`faq-${i}`}
                    role="region"
                    aria-labelledby={`faq-q-${i}`}
                    className={cn('grid transition-[grid-template-rows] duration-300 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-prose pb-5 text-body text-slate">{f.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  const { d } = useI18n();
  return (
    <section className="shell" aria-labelledby="cta-title">
      <Reveal className="relative overflow-hidden rounded-panel bg-gradient-to-br from-brand-soft via-white to-sky-soft p-8 shadow-hair sm:p-12">
        <div aria-hidden className="absolute -right-10 bottom-8 hidden flex-col gap-3 md:flex">
          <span className="h-6 w-72 rounded-l-full bg-brand-mark/80" />
          <span className="ml-16 h-6 w-56 rounded-l-full bg-brand-mark/50" />
          <span className="ml-40 h-6 w-32 rounded-l-full bg-ink/80" />
        </div>
        <div className="relative max-w-lg">
          <h2 id="cta-title" className="text-page font-bold">{d.home.ctaTitle}</h2>
          <p className="mt-3 text-lead text-slate">{d.home.ctaBody}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button to="/masterclasses" size="lg">{d.home.ctaPrimary}</Button>
            <Button to="/#how" size="lg" variant="secondary">{d.home.ctaSecondary}</Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function HomePage() {
  const { d } = useI18n();
  useDocumentTitle(d.hero.titleA + ' ' + d.hero.titleB);
  return (
    <>
      <Hero />
      <Challenge />
      <Pillars />
      <HowItWorks />
      <LoanLab />
      <ReadinessPreview />
      <WhoAndTrust />
      <Faq />
      <FinalCta />
    </>
  );
}
