import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFoundPage() {
  const { d, l } = useI18n();
  useDocumentTitle(d.common.notFoundTitle);
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 sm:py-24 md:py-28 text-center">
      {/* Subtle typographic 404 watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[clamp(10rem,28vw,22rem)] font-black leading-none tracking-tight text-mist/60 -z-10"
      >
        404
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-w-xl flex-col items-center"
      >
        {/* Brand pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3.5 py-1 text-meta font-semibold text-slate shadow-hair backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span>404</span>
          <span className="text-line">/</span>
          <span>{l({ en: 'Page Not Found', bn: 'পাতাটি পাওয়া যায়নি' })}</span>
        </div>

        <h1 className="mt-5 text-page font-bold text-ink sm:text-[2.75rem]">
          {d.common.notFoundTitle}
        </h1>

        <p className="mt-3.5 max-w-md text-lead text-slate">
          {d.common.notFoundBody}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button to="/" size="md" iconRight={<ArrowUpRight className="h-4 w-4" />}>
            {d.common.goHome}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={goBack}
          >
            {l({ en: 'Go Back', bn: 'পূর্বের পাতায়' })}
          </Button>
        </div>

        {/* Helpful links */}
        <div className="mt-12 w-full border-t border-line/70 pt-6">
          <p className="text-meta font-medium text-slate">
            {l({ en: 'Looking for something else?', bn: 'অন্য কিছু খুঁজছেন?' })}
          </p>
          <nav aria-label="Suggested pages" className="mt-2.5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-meta font-semibold">
            <Link to="/" className="text-brand hover:underline">
              {d.nav.home}
            </Link>
            <span className="text-line" aria-hidden>•</span>
            <Link to="/masterclasses" className="text-brand hover:underline">
              {d.nav.masterclasses}
            </Link>
            <span className="text-line" aria-hidden>•</span>
            <Link to="/#how" className="text-brand hover:underline">
              {d.nav.howItWorks}
            </Link>
            <span className="text-line" aria-hidden>•</span>
            <Link to="/#faq" className="text-brand hover:underline">
              {d.nav.faq}
            </Link>
          </nav>
        </div>
      </motion.div>
    </div>
  );
}
