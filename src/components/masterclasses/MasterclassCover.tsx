import { useEffect, useRef, useState } from 'react';
import type { Masterclass } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/utils/cn';

const tones = {
  leaf: { bg: 'linear-gradient(140deg, #DDF4E7 0%, #F3FBF7 70%)', bars: ['bg-brand-mark', 'bg-brand-mark/70', 'bg-ink'] },
  sky: { bg: 'linear-gradient(140deg, #E2ECFA 0%, #F5F8FE 70%)', bars: ['bg-ink', 'bg-brand-mark', 'bg-ink/60'] },
  sand: { bg: 'linear-gradient(140deg, #E7ECF2 0%, #F7F9FB 70%)', bars: ['bg-brand-mark', 'bg-ink', 'bg-brand-mark/60'] },
};

/** Deterministic bar lengths per masterclass, so each fallback is distinct but on-brand. */
function lengths(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return [62 + (h % 25), 44 + ((h >> 4) % 30), 22 + ((h >> 8) % 20)];
}

/** Branded fallback: Fundly's three-bar motif. Used when there's no cover or it fails to load. */
function Fallback({ m, size, className }: { m: Masterclass; size: 'sm' | 'md' | 'lg'; className?: string }) {
  const { l, lang } = useI18n();
  const tone = tones[m.coverTone] ?? tones.leaf;
  const L = lengths(m.id);
  const barH = { sm: 'h-3', md: 'h-4', lg: 'h-6' }[size];
  const gap = { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' }[size];
  return (
    <div className={cn('relative overflow-hidden', className)} style={{ background: tone.bg }} role="img" aria-label={l(m.title)}>
      <div className={cn('absolute bottom-[14%] left-0 flex w-full flex-col', gap)} aria-hidden>
        {L.map((w, i) => (
          <div key={i} className={cn('rounded-r-full', barH, tone.bars[i])} style={{ width: `${w}%` }} />
        ))}
      </div>
      {size !== 'sm' && (
        <p lang={lang} aria-hidden className={cn('absolute left-5 top-4 max-w-[70%] font-semibold text-ink/70', size === 'lg' ? 'text-lead' : 'text-meta')}>
          {l(m.topic)}
        </p>
      )}
    </div>
  );
}

/**
 * Masterclass cover image.
 * - The parent sets the box (aspect ratio or height), so the layout never shifts while loading.
 * - Images are object-fit: cover, lazy-loaded unless `priority` is set, with a soft placeholder.
 * - If the image is missing or fails, the branded motif is shown instead of a broken icon.
 */
export function MasterclassCover({
  m,
  className,
  size = 'md',
  priority = false,
  decorative = false,
  sizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
}: {
  m: Masterclass;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Above-the-fold images load eagerly. */
  priority?: boolean;
  /** Set when the title is already next to the image, so screen readers don't hear it twice. */
  decorative?: boolean;
  /** Rendered width hint for picking the right srcSet candidate. */
  sizes?: string;
}) {
  const { l } = useI18n();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setFailed(false);
    // A cached image can finish before React attaches onLoad, so check once on mount.
    setLoaded(!!img.current?.complete && (img.current?.naturalWidth ?? 0) > 0);
  }, [m.cover]);

  if (!m.cover || failed) return <Fallback m={m} size={size} className={className} />;

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ background: (tones[m.coverTone] ?? tones.leaf).bg }}>
      <img
        ref={img}
        src={m.cover}
        srcSet={m.coverSrcSet}
        sizes={m.coverSrcSet ? sizes : undefined}
        alt={decorative ? '' : l(m.coverAlt) || l(m.title)}
        width={1600}
        height={900}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        // fetchpriority is a valid attribute; React 18 passes it through in lowercase
        {...(priority ? { fetchpriority: 'high' } : {})}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  );
}
