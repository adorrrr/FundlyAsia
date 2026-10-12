import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';

export function SiteFooter() {
  const { d, t } = useI18n();
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-body text-slate">{d.footer.tagline}</p>
          <LanguageSwitcher className="mt-5" />
        </div>
        <nav aria-label={d.footer.explore}>
          <h2 className="text-meta font-semibold text-ink">{d.footer.explore}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-body">
            <li><Link to="/" className="text-slate hover:text-ink">{d.nav.home}</Link></li>
            <li><Link to="/masterclasses" className="text-slate hover:text-ink">{d.nav.masterclasses}</Link></li>
            <li><Link to="/#how" className="text-slate hover:text-ink">{d.nav.howItWorks}</Link></li>
            <li><Link to="/#faq" className="text-slate hover:text-ink">{d.nav.faq}</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="text-meta font-semibold text-ink">{d.footer.contact}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-body">
            <li><a href="mailto:hello@fundly.asia" className="text-slate hover:text-ink">hello@fundly.asia</a></li>
            <li><a href="tel:+8801815042042" className="tnum text-slate hover:text-ink">01815042042</a></li>
            <li><a href="https://fundly.asia" className="text-slate hover:text-ink">fundly.asia</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-5 text-meta text-slate sm:flex-row sm:justify-between">
          <p>{t(d.footer.copyright, { year: new Date().getFullYear() })}</p>
          <p>{d.footer.legal}</p>
        </div>
      </div>
    </footer>
  );
}
