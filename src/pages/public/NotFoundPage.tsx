import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

function AnimatedPlugAndSocket() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex w-full max-w-[540px] items-center justify-center select-none py-4">
      {/* Ambient background glow aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-full bg-gradient-to-tr from-brand-soft/50 via-emerald-100/40 to-transparent blur-3xl opacity-70"
      />

      <svg
        viewBox="0 0 560 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-auto drop-shadow-md overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Plug body cylinder gradient for 3D depth */}
          <linearGradient id="plugBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2c3038" />
            <stop offset="35%" stopColor="#181a20" />
            <stop offset="85%" stopColor="#0c0e12" />
            <stop offset="100%" stopColor="#05070a" />
          </linearGradient>

          {/* Socket body cylinder gradient */}
          <linearGradient id="socketBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2e323b" />
            <stop offset="40%" stopColor="#1a1c22" />
            <stop offset="85%" stopColor="#0d0f14" />
            <stop offset="100%" stopColor="#06070a" />
          </linearGradient>

          {/* Glowing Green Prongs Gradient */}
          <linearGradient id="prongGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="25%" stopColor="#6ee7b7" />
            <stop offset="80%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Glowing Socket Face Gradient */}
          <radialGradient id="socketFaceGrad" cx="45%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="45%" stopColor="#6ee7b7" />
            <stop offset="85%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </radialGradient>

          {/* Soft drop shadow for plugs */}
          <filter id="softDepth" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="3" dy="12" stdDeviation="10" floodColor="#090d16" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* Dynamic Electric Spark Energy between plug and socket */}
        <motion.g
          initial={reduceMotion ? false : { opacity: 0.3 }}
          animate={{ opacity: [0.35, 1, 0.45, 0.9, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Spark rays around plug head */}
          <g stroke="#0f172a" strokeWidth="2.75" strokeLinecap="round">
            <line x1="172" y1="88" x2="164" y2="70" />
            <line x1="202" y1="98" x2="208" y2="78" />
            <line x1="228" y1="120" x2="246" y2="104" />
            <line x1="152" y1="126" x2="134" y2="120" />
            <line x1="158" y1="170" x2="140" y2="178" />
          </g>

          {/* Spark rays around socket mouth */}
          <g stroke="#0f172a" strokeWidth="2.75" strokeLinecap="round">
            <line x1="340" y1="74" x2="330" y2="56" />
            <line x1="372" y1="62" x2="376" y2="42" />
            <line x1="412" y1="68" x2="424" y2="50" />
            <line x1="324" y1="204" x2="310" y2="222" />
            <line x1="355" y1="220" x2="352" y2="240" />
            <line x1="395" y1="222" x2="406" y2="242" />
          </g>

          {/* Glowing floating spark particles */}
          <motion.circle
            cx="278"
            cy="142"
            r="3.5"
            fill="#34d399"
            animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="296"
            cy="126"
            r="2.5"
            fill="#f59e0b"
            animate={{ scale: [1.2, 0.7, 1.2], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="264"
            cy="165"
            r="2"
            fill="#34d399"
            animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* Left Plug Cord (fluid, weighted bezier curve) */}
        <path
          d="M 178 198 C 146 256 86 276 98 322 C 108 362 176 338 212 360"
          stroke="#0f172a"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Socket Cord */}
        <path
          d="M 440 146 C 476 150 505 174 548 180"
          stroke="#0f172a"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* ================= LEFT PLUG GROUP (with gentle float) ================= */}
        <motion.g
          filter="url(#softDepth)"
          animate={reduceMotion ? undefined : { y: [-3.5, 3.5, -3.5], rotate: [31, 33.5, 31] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '190px', originY: '150px' }}
          transform="translate(155, 118) rotate(32)"
        >
          {/* Black cylindrical back body */}
          <path
            d="M 6 18 C 6 8, 28 0, 54 0 C 80 0, 102 8, 102 18 L 102 54 C 102 64, 80 72, 54 72 C 28 72, 6 64, 6 54 Z"
            fill="url(#plugBodyGrad)"
            stroke="#0f172a"
            strokeWidth="3.5"
          />

          {/* White face / ceramic rim */}
          <ellipse
            cx="54"
            cy="54"
            rx="48"
            ry="18"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="4"
          />

          {/* Dual Lime Green Prongs */}
          {/* Top/Left Prong */}
          <rect
            x="27"
            y="54"
            width="10"
            height="38"
            rx="5"
            fill="url(#prongGrad)"
            stroke="#0f172a"
            strokeWidth="3"
          />
          {/* Inner prong highlight */}
          <line x1="30" y1="57" x2="30" y2="87" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

          {/* Bottom/Right Prong */}
          <rect
            x="69"
            y="54"
            width="10"
            height="38"
            rx="5"
            fill="url(#prongGrad)"
            stroke="#0f172a"
            strokeWidth="3"
          />
          {/* Inner prong highlight */}
          <line x1="72" y1="57" x2="72" y2="87" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </motion.g>

        {/* ================= RIGHT SOCKET GROUP (with counter float) ================= */}
        <motion.g
          filter="url(#softDepth)"
          animate={reduceMotion ? undefined : { y: [3.5, -3.5, 3.5], rotate: [-25, -22.5, -25] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '390px', originY: '140px' }}
          transform="translate(352, 94) rotate(-24)"
        >
          {/* Black socket cylindrical body */}
          <path
            d="M 8 18 C 8 8, 32 0, 60 0 C 88 0, 112 8, 112 18 L 112 60 C 112 70, 88 78, 60 78 C 32 78, 8 70, 8 60 Z"
            fill="url(#socketBodyGrad)"
            stroke="#0f172a"
            strokeWidth="3.5"
          />

          {/* Vibrant Lime Green Socket Face */}
          <ellipse
            cx="60"
            cy="18"
            rx="52"
            ry="20"
            fill="url(#socketFaceGrad)"
            stroke="#0f172a"
            strokeWidth="4"
          />

          {/* Inner dark receptacle hole with depth ring */}
          <ellipse
            cx="60"
            cy="18"
            rx="22"
            ry="10.5"
            fill="#0a0c10"
            stroke="#064e3b"
            strokeWidth="1.5"
          />
          <ellipse
            cx="60"
            cy="19"
            rx="16"
            ry="7.5"
            fill="#020406"
          />
        </motion.g>
      </svg>
    </div>
  );
}

export default function NotFoundPage() {
  const { l } = useI18n();
  useDocumentTitle('404 — Page not found | Fundly');
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden py-10 sm:py-16 lg:py-20">
      {/* Background subtle ambient grid/glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden opacity-30"
      >
        <div className="h-[460px] w-[640px] rounded-full bg-gradient-to-tr from-brand-soft via-emerald-100/50 to-transparent blur-[110px]" />
      </div>

      <div className="shell w-full">
        <div className="grid w-full grid-cols-1 items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-16">
          {/* ================= Left Column: Content & Actions ================= */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start text-left"
          >
            {/* Top Minimal Label Badges (Refined Glassmorphism) */}
            <div className="mb-4 sm:mb-6 inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/85 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-slate shadow-hair backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                ERROR STATE
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-paper px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-slate/85">
                404 — NOT FOUND
              </span>
            </div>

            {/* Oversized, Bold 404. Typography with Liquid Glass Accent */}
            <div className="relative select-none">
              <h1 className="text-[clamp(5.5rem,13vw,9rem)] font-black tracking-tight leading-[0.9] text-ink">
                404.
              </h1>
              {/* Subtle floating glass highlight badge behind the period */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-2 -left-3 h-14 w-36 rounded-full bg-gradient-to-r from-brand/10 to-transparent blur-xl -z-10"
              />
            </div>

            {/* Highlighted Heading: Page [not found.] */}
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center text-3xl sm:text-4xl lg:text-[2.85rem] font-black tracking-tight text-ink">
              <span>{l({ en: 'Page', bn: 'পাতা' })}</span>
              <span className="ml-2.5 inline-block rounded-xl bg-[#7df88f] px-3.5 py-1 text-ink font-extrabold leading-tight shadow-hair">
                {l({ en: 'not found.', bn: 'পাওয়া যায়নি।' })}
              </span>
            </div>

            {/* Error Message & Friendly Guidance */}
            <div className="mt-5 max-w-md">
              <p className="text-body font-semibold text-ink">
                {l({ en: 'Oops! Page not found.', bn: 'উফ! পাতাটি খুঁজে পাওয়া যায়নি।' })}
              </p>
              <p className="mt-1.5 text-body text-slate leading-relaxed">
                {l({
                  en: "The page you're looking for doesn't exist or may have been moved.",
                  bn: 'আপনি যে পাতাটি খুঁজছেন তা মুছে ফেলা হয়েছে, নাম পরিবর্তন করা হয়েছে অথবা সাময়িকভাবে অনুপলব্ধ।',
                })}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Button
                to="/"
                size="lg"
                iconRight={<ArrowUpRight className="h-4 w-4" />}
                className="rounded-control bg-ink text-surface hover:bg-ink/90 font-semibold px-7 py-3.5 shadow-lift transition-all hover:-translate-y-0.5"
              >
                {l({ en: 'Back to Home', bn: 'হোমে ফিরে যান' })}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={goBack}
                className="rounded-control bg-surface border border-line hover:bg-mist/40 font-semibold px-6 py-3.5 transition-all hover:-translate-y-0.5"
              >
                {l({ en: 'Go Back', bn: 'পূর্বের পাতায়' })}
              </Button>
            </div>

            {/* Quick Helper Links */}
            <div className="mt-10 pt-5 border-t border-line/70 w-full max-w-md">
              <div className="flex items-center gap-2 text-meta text-slate font-medium">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span>{l({ en: 'Need help finding something?', bn: 'কিছু খুঁজে পেতে সাহায্য চান?' })}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-meta font-semibold">
                <a href="/masterclasses" className="text-brand hover:underline">
                  {l({ en: 'Masterclasses', bn: 'মাস্টারক্লাস' })}
                </a>
                <span className="text-line">•</span>
                <a href="/#how" className="text-brand hover:underline">
                  {l({ en: 'How it works', bn: 'কীভাবে কাজ করে' })}
                </a>
                <span className="text-line">•</span>
                <a href="/#faq" className="text-brand hover:underline">
                  {l({ en: 'FAQ', bn: 'সচরাচর জিজ্ঞাসা' })}
                </a>
              </div>
            </div>
          </motion.div>

          {/* ================= Right Column: Animated Vector Artwork ================= */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center lg:justify-end"
          >
            <AnimatedPlugAndSocket />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
