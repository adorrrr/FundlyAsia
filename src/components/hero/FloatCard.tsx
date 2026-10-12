import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * Liquid-glass information card. The outer layer handles entrance + a slow idle float;
 * the inner layer handles hover lift, so the two motions never fight.
 */
export function FloatCard({
  children,
  className,
  from = { x: 0, y: 16 },
  delay = 0,
  drift = 6,
  period = 7,
}: {
  children: ReactNode;
  className?: string;
  from?: { x: number; y: number };
  delay?: number;
  drift?: number;
  period?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn('pointer-events-auto', className)}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: from.x, y: from.y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -drift, 0] }}
        transition={reduce ? undefined : { duration: period, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.7 }}
      >
        <div className="hero-glass rounded-[18px] p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_0_0_1px_rgb(20_32_51/0.06),0_22px_44px_-18px_rgb(20_32_51/0.28)]">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CardLabel({ icon, children, tone = 'text-slate' }: { icon: ReactNode; children: ReactNode; tone?: string }) {
  return (
    <p className="flex items-center gap-2 text-[12px] font-semibold text-slate">
      <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 shadow-[0_0_0_1px_rgb(20_32_51/0.06)]', tone)}>{icon}</span>
      {children}
    </p>
  );
}
