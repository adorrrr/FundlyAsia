import { CheckCircle2, CircleAlert, Home, ClipboardList, GraduationCap, UserRound, Signal, Wifi, BatteryFull } from 'lucide-react';
import logo from '@/assets/fundly-logo.png';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/utils/cn';
import { ReadinessRing } from './ReadinessRing';
import { heroDemo } from './heroDemo';

/**
 * Smartphone mockup built entirely in React/CSS. It is an illustration:
 * the parent marks it aria-hidden and provides a single text alternative.
 */
export function HeroPhone({ className, compact }: { className?: string; compact?: boolean }) {
  const { d, formatNumber } = useI18n();
  const h = d.hero;
  return (
    <div
      className={cn(
        'relative rounded-[52px] bg-gradient-to-b from-[#F4F7F9] via-[#E3E9EE] to-[#D5DDE4] p-[10px]',
        'shadow-[0_1px_0_rgb(255_255_255)_inset,0_0_0_1px_rgb(20_32_51/0.10),0_30px_60px_-20px_rgb(20_32_51/0.35),0_60px_120px_-40px_rgb(8_128_74/0.30)]',
        className,
      )}
    >
      {/* side buttons */}
      <span aria-hidden className="absolute -left-[3px] top-[120px] h-10 w-[3px] rounded-l bg-[#CBD4DC]" />
      <span aria-hidden className="absolute -left-[3px] top-[172px] h-16 w-[3px] rounded-l bg-[#CBD4DC]" />
      <span aria-hidden className="absolute -right-[3px] top-[150px] h-20 w-[3px] rounded-r bg-[#CBD4DC]" />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[42px] bg-[#FBFCFC] ring-1 ring-ink/10">
        {/* status bar + island */}
        <div className="relative flex h-11 flex-none items-center justify-between px-7 text-[11px] font-semibold text-ink">
          <span className="tnum">9:41</span>
          <span className="absolute left-1/2 top-2.5 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-ink" />
          <span className="flex items-center gap-1">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <BatteryFull className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-3">
          {/* app header */}
          <div className="flex items-center justify-between py-2">
            <img src={logo} alt="" className="h-[18px] w-auto" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-deep">SB</span>
          </div>

          <div className="mt-1">
            <p className="text-[15px] font-bold leading-tight text-ink">{h.phoneTitle}</p>
            <p className="text-[11px] text-slate">{h.phoneSample}</p>
          </div>

          {/* score */}
          <div className="mt-3 flex flex-col items-center rounded-[20px] bg-white px-3 py-4 shadow-[0_0_0_1px_rgb(20_32_51/0.06),0_6px_16px_-8px_rgb(20_32_51/0.15)]">
            <ReadinessRing value={heroDemo.score} size={compact ? 112 : 128} stroke={compact ? 10 : 11}>
              <span className="tnum text-[30px] font-bold leading-none tracking-tight text-ink">{formatNumber(heroDemo.score)}</span>
              <span className="mt-1 text-[10px] text-slate">{h.phoneOutOf}</span>
            </ReadinessRing>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-mark" />
              {d.bands.moderate}
            </span>
          </div>

          {/* areas */}
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="rounded-[16px] bg-white p-2.5 shadow-[0_0_0_1px_rgb(20_32_51/0.06)]">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-ok">
                <CheckCircle2 className="h-3 w-3" />
                {h.phoneStrong}
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {h.strongItems.map((s) => (
                  <li key={s} className="text-[10.5px] leading-snug text-ink">{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[16px] bg-white p-2.5 shadow-[0_0_0_1px_rgb(20_32_51/0.06)]">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-warn">
                <CircleAlert className="h-3 w-3" />
                {h.phoneImprove}
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {h.improveItems.map((s) => (
                  <li key={s} className="text-[10.5px] leading-snug text-ink">{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <span className="mt-3 flex h-10 flex-none items-center justify-center rounded-[14px] bg-brand text-[12px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]">
            {h.phoneCta}
          </span>

          {/* next step */}
          <div className="mt-2.5 hidden items-center gap-2.5 rounded-[14px] bg-sky-soft/70 px-3 py-2 lg:flex">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-white text-info">
              <GraduationCap className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] text-slate">{h.phoneNextLabel}</span>
              <span className="block truncate text-[11px] font-semibold text-ink">{h.phoneNext}</span>
            </span>
          </div>

          {/* tab bar */}
          <div className="mt-auto flex items-center justify-around border-t border-line/70 pt-2.5 text-slate">
            <Home className="h-4 w-4 text-brand" />
            <ClipboardList className="h-4 w-4" />
            <GraduationCap className="h-4 w-4" />
            <UserRound className="h-4 w-4" />
          </div>
          <span className="mx-auto mt-2 h-1 w-24 flex-none rounded-full bg-ink/80" />
        </div>
      </div>
    </div>
  );
}
