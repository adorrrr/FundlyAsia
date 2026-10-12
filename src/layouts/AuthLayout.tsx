import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { DemoPill } from '@/components/navigation/DemoPill';
import { useI18n } from '@/i18n/I18nProvider';
import { AnimatedOutlet } from './PageTransition';
import { SkipLink } from './SkipLink';
import { GrowBar } from '@/components/ui/Readiness';

/** Two-column auth shell: form on the left, a quiet brand panel on the right (desktop only). */
export default function AuthLayout() {
  const { d } = useI18n();
  return (
    <div className="ambient grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <SkipLink />
      <div className="flex flex-col px-4 py-5 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo />
          <LanguageSwitcher />
        </div>
        <main id="main" tabIndex={-1} className="flex flex-1 items-center justify-center py-10 outline-none">
          <div className="w-full max-w-[420px]">
            <AnimatedOutlet />
          </div>
        </main>
        <p className="text-center text-meta text-slate">
          <Link to="/" className="hover:text-ink">{d.footer.legal}</Link>
        </p>
      </div>
      <aside className="relative hidden overflow-hidden p-6 lg:block" aria-hidden>
        <div className="flex h-full flex-col justify-end rounded-panel bg-gradient-to-br from-brand-soft via-white to-sky-soft p-10 shadow-hair">
          <div className="glass max-w-sm rounded-panel p-6">
            <p className="text-meta font-semibold text-slate">{d.home.panelTitle}</p>
            <div className="mt-5 flex flex-col gap-4">
              {d.home.panelSteps.map((s, i) => (
                <div key={s}>
                  <div className="mb-1.5 flex justify-between text-meta">
                    <span className="font-semibold text-ink">{s}</span>
                  </div>
                  <GrowBar value={[92, 64, 48, 30][i]} delay={0.2 + i * 0.08} tone={i === 0 ? 'ink' : 'mark'} />
                </div>
              ))}
            </div>
          </div>
          <p className="mt-8 max-w-sm text-section font-semibold text-ink">{d.home.heroNote}</p>
        </div>
      </aside>
      <DemoPill />
    </div>
  );
}
