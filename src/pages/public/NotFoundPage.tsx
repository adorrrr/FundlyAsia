import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

function DisconnectedPlugIllustration() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex w-full max-w-[520px] items-center justify-center select-none">
      <svg
        viewBox="0 0 540 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm overflow-visible"
        aria-hidden="true"
      >
        {/* Spark radiation lines around the plug */}
        <motion.g
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={reduceMotion ? false : { opacity: 0.4 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <line x1="168" y1="92" x2="162" y2="76" />
          <line x1="194" y1="104" x2="198" y2="86" />
          <line x1="216" y1="124" x2="232" y2="110" />
          <line x1="150" y1="130" x2="134" y2="124" />
          <line x1="154" y1="168" x2="138" y2="174" />
        </motion.g>

        {/* Spark radiation lines around the socket */}
        <motion.g
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={reduceMotion ? false : { opacity: 0.4 }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <line x1="335" y1="80" x2="326" y2="64" />
          <line x1="362" y1="68" x2="364" y2="50" />
          <line x1="398" y1="72" x2="408" y2="56" />
          <line x1="316" y1="202" x2="304" y2="218" />
          <line x1="344" y1="214" x2="342" y2="232" />
          <line x1="382" y1="216" x2="390" y2="234" />
        </motion.g>

        {/* Left Plug Cord (graceful undulating bezier line) */}
        <path
          d="M 174 195 C 145 250 90 270 102 315 C 112 355 175 330 205 352"
          stroke="#0f172a"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Socket Cord */}
        <path
          d="M 430 148 C 465 152 490 174 530 180"
          stroke="#0f172a"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* LEFT PLUG */}
        <g transform="translate(152, 116) rotate(32)">
          {/* Black cylindrical back body */}
          <path
            d="M 8 16 C 8 7, 28 0, 52 0 C 76 0, 96 7, 96 16 L 96 50 C 96 59, 76 66, 52 66 C 28 66, 8 59, 8 50 Z"
            fill="#0f172a"
          />
          {/* White front rim/face */}
          <ellipse
            cx="52"
            cy="50"
            rx="44"
            ry="16"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="3.5"
          />

          {/* Lime Green Prongs extending outwards */}
          {/* Left prong */}
          <rect
            x="28"
            y="50"
            width="9"
            height="36"
            rx="4.5"
            fill="#79f291"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          {/* Right prong */}
          <rect
            x="66"
            y="50"
            width="9"
            height="36"
            rx="4.5"
            fill="#79f291"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
        </g>

        {/* RIGHT SOCKET */}
        <g transform="translate(346, 96) rotate(-24)">
          {/* Black socket cylindrical body */}
          <path
            d="M 10 16 C 10 7, 32 0, 58 0 C 84 0, 106 7, 106 16 L 106 55 C 106 64, 84 72, 58 72 C 32 72, 10 64, 10 55 Z"
            fill="#0f172a"
          />
          {/* Bright Lime Green Socket Face */}
          <ellipse
            cx="58"
            cy="16"
            rx="48"
            ry="18"
            fill="#79f291"
            stroke="#0f172a"
            strokeWidth="3.5"
          />
          {/* Inner dark socket opening */}
          <ellipse
            cx="58"
            cy="16"
            rx="20"
            ry="9"
            fill="#0f172a"
          />
        </g>
      </svg>
    </div>
  );
}

export default function NotFoundPage() {
  const { l } = useI18n();
  useDocumentTitle('404 - Page not found');
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  return (
    <div className="shell flex flex-1 items-center justify-center py-12 sm:py-20 lg:py-24">
      <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left Column: Typography & Action */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start text-left"
        >
          {/* Big Bold 404. */}
          <h1 className="text-[clamp(5rem,12vw,8.5rem)] font-black tracking-tight leading-none text-ink select-none">
            404.
          </h1>

          {/* Heading with Highlighted Badge */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-ink">
            <span>{l({ en: 'Page', bn: 'পাতা' })}</span>
            <span className="ml-2.5 inline-block rounded-xl bg-[#79f291] px-3.5 py-0.5 text-ink font-bold leading-tight">
              {l({ en: 'not found.', bn: 'পাওয়া যায়নি।' })}
            </span>
          </div>

          {/* Description */}
          <p className="mt-5 max-w-md text-base sm:text-lg text-slate leading-relaxed">
            {l({
              en: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
              bn: 'আপনি যে পাতাটি খুঁজছেন তা মুছে ফেলা হয়েছে, নাম পরিবর্তন করা হয়েছে অথবা সাময়িকভাবে অনুপলব্ধ।',
            })}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5 sm:gap-4">
            <Button
              to="/"
              size="lg"
              className="rounded-xl bg-ink text-surface hover:bg-ink/90 font-semibold px-7 py-3.5 shadow-sm transition-transform active:scale-[0.98]"
            >
              {l({ en: 'Go back home', bn: 'হোমে ফিরে যান' })}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={goBack}
              className="rounded-xl font-semibold"
            >
              {l({ en: 'Go back', bn: 'পূর্বের পাতায়' })}
            </Button>
          </div>
        </motion.div>

        {/* Right Column: Plug & Socket Illustration */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center lg:justify-end"
        >
          <DisconnectedPlugIllustration />
        </motion.div>
      </div>
    </div>
  );
}
