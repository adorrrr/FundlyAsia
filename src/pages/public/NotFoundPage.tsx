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
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 sm:py-24 lg:py-28 text-center min-h-[calc(100vh-140px)]">
      {/* ================= Giant 404 Watermark Centered in the Middle ================= */}
      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -10, 0],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
        className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 select-none overflow-hidden"
      >
        <span
          className="text-[clamp(16rem,42vw,36rem)] font-extrabold tracking-tighter select-none leading-none"
          style={{ color: 'rgba(20, 32, 51, 0.11)' }}
        >
          404
        </span>
      </motion.div>

      {/* ================= Centered Content Header (Foreground, z-10) ================= */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-w-xl flex-col items-center"
      >
        {/* Main Title: Page not found */}
        <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-ink">
          {l({ en: 'Page not found', bn: 'পাতাটি পাওয়া যায়নি' })}
        </h1>

        {/* Subtitle / Explanation (clean 2-line max-width) */}
        <p className="mt-3.5 max-w-sm text-sm sm:text-base text-slate leading-relaxed font-normal">
          {l({
            en: "Oops! The page you're looking for may have been moved or no longer exists.",
            bn: 'উফ! আপনি যে পাতাটি খুঁজছেন তা সরানো হয়েছে অথবা আর বিদ্যমান নেই।',
          })}
        </p>

        {/* Buttons Group */}
        <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3">
          {/* Glowing Coral Pill: Back to Home */}
          <Link
            to="/"
            className="group relative inline-flex items-center justify-center rounded-full bg-[#ff5238] hover:bg-[#fa4328] px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-[0_12px_28px_-6px_rgba(255,82,56,0.52)] hover:shadow-[0_16px_34px_-6px_rgba(255,82,56,0.65)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{l({ en: 'Back to Home', bn: 'হোমে ফিরে যান' })}</span>
          </Link>

          {/* Secondary subtle Go Back button */}
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center justify-center rounded-full border border-line bg-surface/90 hover:bg-mist/60 px-6 py-3 text-sm sm:text-base font-medium text-ink shadow-hair transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-sm"
          >
            <span>{l({ en: 'Go Back', bn: 'পূর্বের পাতায়' })}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
