import { motion, useReducedMotion } from 'framer-motion';
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
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 sm:py-20 lg:py-24 text-center">
      {/* ================= Centered Content Header ================= */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-w-xl flex-col items-center"
      >
        {/* Main Title: Page not found */}
        <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-ink">
          {l({ en: 'Page not found', bn: 'পাতাটি পাওয়া যায়নি' })}
        </h1>

        {/* Subtitle / Explanation */}
        <p className="mt-3.5 max-w-md text-base sm:text-lg text-slate leading-relaxed font-normal">
          {l({
            en: "Oops! The page you're looking for may have been moved or no longer exists.",
            bn: 'উফ! আপনি যে পাতাটি খুঁজছেন তা সরানো হয়েছে অথবা আর বিদ্যমান নেই।',
          })}
        </p>

        {/* Buttons Group (Signature glowing coral pill button) */}
        <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3">
          {/* Glowing Coral Pill: Back to Home */}
          <Link
            to="/"
            className="group relative inline-flex items-center justify-center rounded-full bg-[#ff5744] hover:bg-[#fa4935] px-7 py-3 text-sm sm:text-base font-semibold text-white shadow-[0_12px_28px_-6px_rgba(255,87,68,0.52)] hover:shadow-[0_16px_34px_-6px_rgba(255,87,68,0.65)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{l({ en: 'Back to Home', bn: 'হোমে ফিরে যান' })}</span>
          </Link>

          {/* Secondary subtle Go Back button */}
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center justify-center rounded-full border border-line bg-surface/80 hover:bg-mist/50 px-6 py-3 text-sm sm:text-base font-semibold text-ink shadow-hair transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-sm"
          >
            <span>{l({ en: 'Go Back', bn: 'পূর্বের পাতায়' })}</span>
          </button>
        </div>
      </motion.div>

      {/* ================= Massive Watermark "404" Directly Below the Button ================= */}
      <motion.div
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none relative -mt-4 sm:-mt-8 lg:-mt-10 select-none overflow-hidden text-center leading-none"
      >
        <div className="text-[clamp(13rem,32vw,28rem)] font-extrabold tracking-[-0.065em] text-[#edf2ef] transition-colors">
          404
        </div>
      </motion.div>
    </div>
  );
}
