import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlaskConical, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

/** Always-visible reminder that the app is running on sample data. */
export function DemoPill({ side = "left" }: { side?: "left" | "right" }) {
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative z-[70] mx-3 mb-3 flex sm:fixed sm:bottom-3 sm:m-0 sm:max-w-[calc(100vw-1.5rem)] ${side === "left" ? "sm:left-3" : "sm:right-3"} print:hidden`}>
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="open"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="glass flex max-w-sm items-start gap-3 rounded-card p-3.5 pr-2"
            role="note"
          >
            <FlaskConical className="mt-0.5 h-4 w-4 flex-none text-warn" aria-hidden />
            <p className="text-meta text-ink">{d.common.demoBanner}</p>
            <button onClick={() => setOpen(false)} className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-slate hover:bg-mist" aria-label={d.common.close}>
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(true)}
            className="glass flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.75rem] font-semibold text-warn"
            aria-expanded={false}
          >
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            {d.common.demoShort}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
