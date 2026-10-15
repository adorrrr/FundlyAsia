import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const { d, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  return (
    <div className="min-h-dvh bg-paper px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-shell flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-float sm:min-h-[calc(100dvh-4rem)]">
        <header className="flex min-h-[4.5rem] items-center justify-between gap-4 border-b border-line/70 px-5 sm:px-8 lg:px-12">
          <Logo />
          <nav aria-label={d.footer.explore} className="flex items-center gap-1 sm:gap-3">
            <Link to="/" className="rounded-full px-3 py-2 text-meta font-medium text-slate transition-colors hover:bg-paper hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-4">
              {d.nav.home}
            </Link>
            <Link to="/masterclasses" className="rounded-full px-3 py-2 text-meta font-medium text-slate transition-colors hover:bg-paper hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-4">
              {d.nav.masterclasses}
            </Link>
          </nav>
        </header>

        <main
          id="main"
          aria-labelledby="not-found-title"
          className="relative flex min-h-[34rem] flex-1 flex-col items-center overflow-hidden px-5 pb-0 pt-16 text-center sm:min-h-[37rem] sm:pt-20 lg:min-h-[39rem]"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            <span className="mb-5 inline-flex items-center rounded-full border border-line bg-paper px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-slate sm:mb-6">
              404 <span className="mx-2 text-brand">/</span> {d.common.notFoundTitle}
            </span>
            <h1 id="not-found-title" className="text-page font-semibold">
              Page not found
            </h1>
            <p className="mt-4 max-w-lg text-lead text-slate">
              Oops! The page you&apos;re looking for may have been moved or no longer exists.
            </p>
            <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:mt-8 sm:w-auto sm:flex-row">
              <Button to="/" size="md" iconRight={<ArrowUpRight className="h-4 w-4" />}>
                Back to Home
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={goBack}
              >
                Go Back
              </Button>
            </div>
          </motion.div>

          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: reduceMotion ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 bottom-[-0.29em] select-none text-center text-[clamp(13rem,36vw,31rem)] font-black leading-[0.76] tracking-[-0.095em] text-[#edf2f0]"
          >
            404
          </motion.div>
        </main>

        <footer className="border-t border-line bg-paper/45">
          <div className="grid gap-8 px-5 py-9 sm:grid-cols-2 sm:px-8 sm:py-11 lg:grid-cols-[1.35fr_1fr_1fr] lg:gap-12 lg:px-12">
            <div>
              <h2 className="text-meta font-semibold text-ink">Fundly Asia</h2>
              <p className="mt-3 max-w-xs text-body text-slate">{d.footer.tagline}</p>
              <a href="mailto:hello@fundly.asia" className="mt-3 inline-flex rounded-sm text-meta font-medium text-brand transition-colors hover:text-brand-deep hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                hello@fundly.asia
              </a>
            </div>

            <nav aria-label={d.footer.explore}>
              <h2 className="text-meta font-semibold text-ink">{d.footer.explore}</h2>
              <ul className="mt-3 flex flex-col items-start gap-2 text-body">
                <li><Link to="/" className="rounded-sm text-slate transition-colors hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{d.nav.home}</Link></li>
                <li><Link to="/masterclasses" className="rounded-sm text-slate transition-colors hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{d.nav.masterclasses}</Link></li>
                <li><Link to="/#how" className="rounded-sm text-slate transition-colors hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{d.nav.howItWorks}</Link></li>
                <li><Link to="/#faq" className="rounded-sm text-slate transition-colors hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{d.nav.faq}</Link></li>
              </ul>
            </nav>

            <div>
              <h2 className="text-meta font-semibold text-ink">{d.footer.contact}</h2>
              <ul className="mt-3 flex flex-col items-start gap-2 text-body">
                <li><a href="tel:+8801815042042" className="rounded-sm text-slate transition-colors hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">01815042042</a></li>
                <li><a href="https://fundly.asia" className="rounded-sm text-slate transition-colors hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">fundly.asia</a></li>
              </ul>
            </div>
          </div>

          <div aria-hidden="true" className="overflow-hidden px-4 text-center">
            <div className="select-none whitespace-nowrap text-[clamp(5.5rem,20vw,15rem)] font-black leading-[0.78] tracking-[-0.09em] text-[#e9efec]">
              fundly
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-line px-5 py-4 text-meta text-slate sm:flex-row sm:justify-between sm:px-8 lg:px-12">
            <p>{t(d.footer.copyright, { year: new Date().getFullYear() })}</p>
            <p>{d.footer.legal}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
