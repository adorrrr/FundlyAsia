import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, CircleAlert, Gauge, ShieldCheck, Target } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { HeroBackdrop } from './HeroBackdrop';
import { HeroPhone } from './HeroPhone';
import { CardLabel, FloatCard } from './FloatCard';
import { heroDemo } from './heroDemo';

const ease = [0.22, 1, 0.36, 1] as const;

/** Tiny bar that fills once when the card enters. */
function MiniBar({ value, tone = 'bg-brand-mark', delay = 1 }: { value: number; tone?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
      <motion.div
        className={cn('h-full origin-left rounded-full', tone)}
        style={{ width: `${value}%` }}
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, ease, delay }}
      />
    </div>
  );
}

function ScoreCard() {
  const { d, formatNumber } = useI18n();
  return (
    <>
      <CardLabel icon={<Gauge className="h-3.5 w-3.5" />} tone="text-brand">{d.hero.cardScore}</CardLabel>
      <p className="tnum mt-3 text-[1.75rem] font-bold leading-none tracking-tight text-ink">
        {formatNumber(heroDemo.score)}
        <span className="ml-1 text-[0.875rem] font-semibold text-slate">/ {formatNumber(100)}</span>
      </p>
      <MiniBar value={heroDemo.score} delay={1.1} />
      <p className="mt-2 text-[12px] font-medium text-brand">{d.bands.moderate}</p>
    </>
  );
}

function StrongCard() {
  const { d } = useI18n();
  return (
    <>
      <CardLabel icon={<BadgeCheck className="h-3.5 w-3.5" />} tone="text-ok">{d.hero.cardStrong}</CardLabel>
      <p className="mt-2.5 text-[15px] font-semibold text-ink">{d.hero.cardStrongValue}</p>
      <MiniBar value={heroDemo.strongLevel} tone="bg-ok" delay={1.25} />
      <p className="mt-2 text-[12px] text-slate">{d.hero.cardStrongNote}</p>
    </>
  );
}

function ImproveCard() {
  const { d } = useI18n();
  return (
    <>
      <CardLabel icon={<CircleAlert className="h-3.5 w-3.5" />} tone="text-warn">{d.hero.cardImprove}</CardLabel>
      <p className="mt-2.5 text-[15px] font-semibold text-ink">{d.hero.cardImproveValue}</p>
      <MiniBar value={heroDemo.improveLevel} tone="bg-warn" delay={1.2} />
      <p className="mt-2 text-[12px] text-slate">{d.hero.cardImproveNote}</p>
    </>
  );
}

function FundingCard() {
  const { d } = useI18n();
  return (
    <>
      <CardLabel icon={<Target className="h-3.5 w-3.5" />} tone="text-info">{d.hero.cardFunding}</CardLabel>
      <p className="mt-2.5 flex items-center gap-1 text-[15px] font-semibold text-ink">
        {d.hero.cardFundingValue}
        <ArrowUpRight className="h-4 w-4 text-info" aria-hidden />
      </p>
      <div className="mt-3 flex gap-1" aria-hidden>
        {Array.from({ length: heroDemo.fundingSteps }, (_, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < heroDemo.fundingStep ? 'bg-info/70' : 'bg-ink/[0.08]')} />
        ))}
      </div>
      <p className="mt-2 text-[12px] text-slate">{d.hero.cardFundingNote}</p>
    </>
  );
}

export function Hero() {
  const { d } = useI18n();
  const h = d.hero;
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const checkHref = user?.role === 'sme' ? '/eligibility' : '/signup?next=/eligibility';

  const rise = (delay: number, y = 14) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease, delay },
  });

  return (
    <section aria-labelledby="hero-title" className="relative isolate -mt-[calc(var(--nav-h)+12px)] overflow-hidden pt-[calc(var(--nav-h)+12px)]">
      <HeroBackdrop />

      <div className="shell relative">
        {/* Zone A - copy */}
        <div className="mx-auto flex max-w-[52rem] flex-col items-center pt-10 text-center sm:pt-14 lg:pt-16">
          <motion.h1
            id="hero-title"
            {...rise(0.08, 18)}
            className="text-[clamp(2.25rem,1.35rem+4.2vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink"
          >
            <span className="block">{h.titleA}</span>
            <span className="block">{h.titleB}</span>
          </motion.h1>

          <motion.p {...rise(0.16)} className="mt-5 max-w-[40rem] text-[1rem] leading-relaxed text-slate sm:text-[1.0625rem]">
            {h.body}
          </motion.p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <motion.div {...rise(0.24)}>
              <Button to={checkHref} size="lg" full className="px-6 sm:w-auto">{h.primary}</Button>
            </motion.div>
            <motion.div {...rise(0.3)}>
              <Button to="/masterclasses" size="lg" variant="secondary" full className="px-6 sm:w-auto">{h.secondary}</Button>
            </motion.div>
          </div>

          <motion.p {...rise(0.36, 6)} className="mt-5 flex items-center gap-2 text-[0.8125rem] font-medium text-slate">
            <ShieldCheck className="h-4 w-4 flex-none text-brand" aria-hidden />
            {h.trust}
          </motion.p>
        </div>

        {/* Zones B + C - device and floating cards (illustration) */}
        <figure className="relative mx-auto mt-12 sm:mt-14" role="img" aria-label={h.illustration}>
          <div aria-hidden>
            {/* Phone: cropped with a fade on mobile, full on larger screens */}
            <div className="relative mx-auto h-[420px] w-[262px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_72%,transparent)] md:h-[612px] md:w-auto md:overflow-visible md:[mask-image:none] lg:h-[668px]">
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 48 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease, delay: 0.32 }}
                className="flex justify-center"
              >
                <motion.div
                  animate={reduce ? undefined : { y: [0, -8, 0] }}
                  transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.3 }}
                >
                  <HeroPhone className="h-[540px] w-[262px] md:h-[580px] md:w-[280px] lg:h-[630px] lg:w-[304px]" compact />
                </motion.div>
              </motion.div>
            </div>

            {/* Desktop / tablet: four cards around the device */}
            <div className="pointer-events-none absolute inset-0 hidden md:block">
              <FloatCard
                className="absolute top-[56px] w-[208px] md:left-[calc(50%-372px)] xl:left-[calc(50%-476px)] xl:w-[236px]"
                from={{ x: -24, y: 8 }}
                delay={0.75}
                drift={7}
                period={7}
              >
                <ScoreCard />
              </FloatCard>
              <FloatCard
                className="absolute top-[318px] w-[208px] md:left-[calc(50%-340px)] xl:left-[calc(50%-420px)] xl:w-[236px]"
                from={{ x: -20, y: 16 }}
                delay={0.9}
                drift={5}
                period={8.5}
              >
                <StrongCard />
              </FloatCard>
              <FloatCard
                className="absolute top-[110px] w-[208px] md:right-[calc(50%-372px)] xl:right-[calc(50%-476px)] xl:w-[236px]"
                from={{ x: 24, y: 8 }}
                delay={0.85}
                drift={6}
                period={7.8}
              >
                <ImproveCard />
              </FloatCard>
              <FloatCard
                className="absolute top-[372px] w-[208px] md:right-[calc(50%-340px)] xl:right-[calc(50%-420px)] xl:w-[236px]"
                from={{ x: 20, y: 16 }}
                delay={1}
                drift={5}
                period={9}
              >
                <FundingCard />
              </FloatCard>
            </div>

            {/* Mobile: two cards in a compact row that overlaps the faded phone */}
            <div className="relative z-10 -mt-24 grid grid-cols-2 gap-3 md:hidden">
              <FloatCard from={{ x: -12, y: 12 }} delay={0.8} drift={4} period={7}>
                <StrongCard />
              </FloatCard>
              <FloatCard from={{ x: 12, y: 12 }} delay={0.9} drift={4} period={8}>
                <ImproveCard />
              </FloatCard>
            </div>
          </div>

          <figcaption className="relative mx-auto mt-6 max-w-md pb-14 text-center text-[0.75rem] text-slate md:mt-2 md:pb-20">
            {h.caption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
