import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFoundPage() {
  const { l } = useI18n();
  useDocumentTitle('Page not found | Fundly');
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-between overflow-hidden px-4 pt-16 sm:pt-24 lg:pt-28 text-center min-h-[calc(100vh-140px)]">
      {/* ================= Centered Content Header ================= */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-w-xl flex-col items-center"
      >
        {/* Main Title: Page not found */}
        <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-ink">
          {l({ en: 'Page not found', bn: 'পাতাটি পাওয়া যায়নি' })}
        </h1>

        {/* Subtitle / Explanation */}
        <p className="mt-4 max-w-md text-base sm:text-lg text-slate leading-relaxed font-normal">
          {l({
            en: "Oops! The page you're looking for may have been moved or no longer exists.",
            bn: 'উফ! আপনি যে পাতাটি খুঁজছেন তা সরানো হয়েছে অথবা আর বিদ্যমান নেই।',
          })}
        </p>

        {/* Buttons Group (with the signature glowing coral pill button) */}
        <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3.5">
          {/* Glowing Coral Pill: Back to Home */}
          <Link
            to="/"
            className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-[#ff5744] hover:bg-[#fa4935] px-7 py-3 text-sm sm:text-base font-semibold text-white shadow-[0_12px_28px_-6px_rgba(255,87,68,0.48)] hover:shadow-[0_16px_34px_-6px_rgba(255,87,68,0.6)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{l({ en: 'Back to Home', bn: 'হোমে ফিরে যান' })}</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          {/* Secondary Outline Pill: Go Back */}
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface/80 hover:bg-mist/50 px-6 py-3 text-sm sm:text-base font-semibold text-ink shadow-hair transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 text-slate" />
            <span>{l({ en: 'Go Back', bn: 'পূর্বের পাতায়' })}</span>
          </button>
        </div>
      </motion.div>

      {/* ================= Massive Watermark "404" Rising from Bottom ================= */}
      <motion.div
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none relative w-full select-none overflow-hidden pb-0 text-center leading-none -mb-6 sm:-mb-10 lg:-mb-14"
      >
        <div className="text-[clamp(14rem,36vw,34rem)] font-extrabold tracking-[-0.075em] text-[#edf2ef] transition-colors">
          404
        </div>
      </motion.div>
    </div>
  );
}
