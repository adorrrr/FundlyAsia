import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, FileWarning, HelpCircle, LineChart, Route, ShieldCheck, Ban, BookOpen, Search, SlidersHorizontal, FileCheck2, Landmark, Minus, Plus } from 'lucide-react';
import { readinessBands } from '@/data/scoring';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationAvailability } from '@/services';
import { Button } from '@/components/ui/Button';
import { Hero } from '@/components/hero/Hero';
import { Reveal } from '@/components/ui/Reveal';
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
  const { d, formatNumber } = useI18n();
  const reduce = useReducedMotion();
  const icons = [Search, SlidersHorizontal, FileCheck2, Landmark];
  const iconStyles = [
    'bg-info-soft text-info',
    'bg-brand-soft text-brand',
    'bg-sky-soft text-info',
    'bg-ok-soft text-ok',
  ];
  return (
    <section className="border-y border-line bg-mist/50 py-16 sm:py-20" aria-labelledby="pillars-title">
      <div className="shell">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-meta font-bold uppercase tracking-[0.18em] text-brand">{d.home.pillarsEyebrow}</p>
          <h2 id="pillars-title" className="mt-3 text-page font-semibold">{d.home.pillarsTitle}</h2>
          <p className="mx-auto mt-4 max-w-[58ch] text-lead text-slate">{d.home.pillarsIntro}</p>
          <p className="mt-3 text-meta text-slate">{d.home.pillarsBody}</p>
        </Reveal>
        <div className="relative mt-10 lg:mt-14">
          <svg
            viewBox="0 0 1200 300"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-[300px] w-full overflow-visible lg:block"
            fill="none"
            aria-hidden="true"
          >
            <motion.path
              d="M150 95 C260 95 315 225 450 225 C585 225 630 95 750 95 C875 95 930 225 1050 225"
              stroke="rgb(var(--brand-mark) / 0.58)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              whileInView={reduce ? undefined : { pathLength: 1 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.path
              d="M450 225 C585 225 630 95 750 95"
              stroke="rgb(var(--info) / 0.52)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              whileInView={reduce ? undefined : { pathLength: 1 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.65, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <ol className="relative grid gap-7 before:absolute before:bottom-6 before:left-6 before:top-6 before:w-px before:bg-gradient-to-b before:from-brand-mark/50 before:via-info/40 before:to-brand-mark/50 md:gap-9 lg:min-h-[410px] lg:grid-cols-4 lg:gap-0 lg:before:hidden">
            {d.home.pillars.map((p, i) => {
              const Icon = icons[i];
              const upper = i % 2 === 0;
              const iconTop = upper ? 'lg:top-[69px]' : 'lg:top-[199px]';
              const copyTop = upper ? 'lg:top-[142px]' : 'lg:top-[10px]';
              const numberTop = upper ? 'lg:top-[25px]' : 'lg:top-[155px]';
              return (
                <motion.li
                  key={p.title}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                  transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="relative grid min-h-20 grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-4 pb-1 last:pb-0 lg:block lg:min-h-[410px] lg:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute right-1 top-[-1.45rem] z-0 select-none text-[4.5rem] font-bold leading-none tracking-[-0.08em] text-slate/[0.10] lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:text-[6.5rem] ${numberTop}`}
                  >
                    {formatNumber(i + 1).padStart(2, '0')}
                  </span>
                  <div className={`relative z-10 row-span-2 lg:absolute lg:left-1/2 lg:z-20 lg:-translate-x-1/2 ${iconTop}`}>
                    <motion.div
                      whileHover={reduce ? undefined : { y: -3 }}
                      transition={{ duration: 0.2 }}
                      className={`flex h-12 w-12 items-center justify-center rounded-control border border-white/80 bg-surface shadow-float transition-colors duration-200 lg:h-[52px] lg:w-[52px] ${iconStyles[i]}`}
                    >
                      <Icon className="h-5 w-5 transition-colors duration-200" aria-hidden="true" />
                    </motion.div>
                  </div>
                  <div className={`relative z-10 min-w-0 pt-1 lg:absolute lg:inset-x-2 lg:pt-0 lg:text-center ${copyTop}`}>
                    <h3 className="text-card font-semibold">{p.title}</h3>
                    <p className="mt-1.5 text-body text-slate lg:mx-auto lg:max-w-[27ch]">{p.body}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-meta font-medium text-slate">{d.home.scoreNote}</p>
      </div>
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
  const { d, formatNumber } = useI18n();
  const { user } = useAuth();
  const score = 64;
  const activeBand = 'moderate';
  return (
    <section className="mx-auto w-full max-w-[1460px] px-4 pb-16 sm:px-6 sm:pb-20 lg:px-7" aria-labelledby="preview-title">
      <Reveal className="grid items-center gap-8 rounded-[30px] border border-line bg-surface p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)] lg:gap-14 lg:p-12">
        <div>
          <h2 id="preview-title" className="text-[clamp(1.75rem,2.5vw,2.25rem)] font-semibold leading-[1.2] tracking-[-0.025em]">
            {d.home.previewTitleLine1}
            <br />
            {d.home.previewTitleLine2}
          </h2>
          <p className="mt-4 max-w-[620px] text-[1.0625rem] leading-[1.8] text-slate">{d.home.previewBody}</p>
          <Button
            to={user?.role === 'sme' ? '/eligibility' : '/signup?next=/eligibility'}
            className="mt-6 h-[55px] w-full max-w-[224px] rounded-[11px] px-6"
          >
            {d.home.previewCta}
          </Button>
        </div>

        <figure className="rounded-[18px] bg-paper p-5 sm:p-6 lg:p-[30px]">
          <div className="flex items-baseline gap-2">
            <span className="tnum text-[4.25rem] font-bold leading-none tracking-[-0.045em] text-ink sm:text-[4.5rem]">{formatNumber(score)}</span>
            <span className="tnum pb-1 text-[1.125rem] text-slate">/ {formatNumber(100)}</span>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="flex h-[15px] gap-[5px]" aria-hidden="true">
                {readinessBands.map((range) => (
                  <span
                    key={range.band}
                    className="rounded-full"
                    style={{
                      flexGrow: range.max - range.min + 1,
                      backgroundColor: {
                        low: '#DCC4C4',
                        needs_improvement: '#E1D7C9',
                        moderate: '#08BD6A',
                        stronger: '#C7DED2',
                      }[range.band],
                    }}
                  />
                ))}
              </div>
              <span
                aria-hidden="true"
                className="absolute top-1/2 h-8 w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white bg-ink shadow-[0_0_0_1px_rgb(var(--ink)/0.12)]"
                style={{ left: `${score}%` }}
              />
            </div>
            <ol
              className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-[40fr_20fr_20fr_21fr] md:gap-x-[5px]"
            >
              {readinessBands.map((range) => {
                const active = range.band === activeBand;
                return (
                  <li key={range.band} className={cn('min-w-0 text-[0.8125rem] leading-[1.4]', active ? 'font-semibold text-ink' : 'text-slate')}>
                    <span className="tnum block">{formatNumber(range.min)}–{formatNumber(range.max)}</span>
                    <span className="mt-0.5 block">{d.bands[range.band]}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-6 flex items-start gap-2.5 text-[0.875rem] leading-[1.5] text-slate">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-slate" aria-hidden />
            <p>{d.home.previewDisclaimer}</p>
          </div>
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
      <div className="grid gap-8 rounded-[28px] border border-line bg-surface p-5 sm:p-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)] lg:gap-14 lg:p-12">
        <Reveal className="flex flex-col">
          <div>
            <p className="flex items-center gap-2 text-meta font-semibold uppercase tracking-[0.14em] text-brand">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-mark" />
              {d.nav.faq}
            </p>
            <h2 id="faq-title" className="mt-3 max-w-[16ch] text-page font-semibold">{d.home.faqTitle}</h2>
            <p className="mt-3 max-w-prose text-body text-slate">{d.home.faqIntro}</p>
          </div>
        </Reveal>
        <Reveal delay={0.05} className="flex flex-col gap-2.5">
          <ul className="flex flex-col gap-2.5">
            {d.home.faq.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={f.q} className="rounded-control bg-paper/70 px-4 transition-colors duration-200 hover:bg-mist/70 sm:px-5">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${i}`}
                      id={`faq-q-${i}`}
                      className="flex w-full items-center gap-3 py-4 text-left text-body font-semibold text-ink transition-colors duration-200 hover:text-brand sm:gap-4"
                    >
                      <span aria-hidden="true" className="tnum w-7 flex-none text-meta font-medium text-slate/80">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">{f.q}</span>
                      <span className={cn('flex h-7 w-7 flex-none items-center justify-center rounded-full transition-colors duration-200', isOpen ? 'bg-brand-soft text-brand' : 'text-slate')}>
                        {isOpen
                          ? <Minus className="h-4 w-4" aria-hidden />
                          : <Plus className="h-4 w-4" aria-hidden />}
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`faq-${i}`}
                    role="region"
                    aria-labelledby={`faq-q-${i}`}
                    className={cn('grid transition-[grid-template-rows] duration-300 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 pl-10 pr-8 text-body leading-relaxed text-slate sm:pl-11">{f.a}</p>
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
