import type { Masterclass } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/utils/cn';

const tones = {
  leaf: { bg: 'linear-gradient(140deg, #DDF4E7 0%, #F3FBF7 70%)', bars: ['bg-brand-mark', 'bg-brand-mark/70', 'bg-ink'] },
  sky: { bg: 'linear-gradient(140deg, #E2ECFA 0%, #F5F8FE 70%)', bars: ['bg-ink', 'bg-brand-mark', 'bg-ink/60'] },
  sand: { bg: 'linear-gradient(140deg, #E7ECF2 0%, #F7F9FB 70%)', bars: ['bg-brand-mark', 'bg-ink', 'bg-brand-mark/60'] },
};

/** Deterministic bar lengths per masterclass, so each cover is distinct but on-brand. */
function lengths(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return [62 + (h % 25), 44 + ((h >> 4) % 30), 22 + ((h >> 8) % 20)];
}

/**
 * Masterclass cover. Uses the uploaded image when there is one; otherwise draws
 * Fundly's three-bar motif so covers never fall back to stock photography.
 */
export function MasterclassCover({ m, className, size = 'md' }: { m: Masterclass; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const { l, lang } = useI18n();
  const tone = tones[m.coverTone] ?? tones.leaf;
  if (m.cover) {
    return (
      <div className={cn('relative overflow-hidden bg-mist', className)}>
        <img src={m.cover} alt={l(m.title)} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
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
        <p lang={lang} className={cn('absolute left-5 top-4 max-w-[70%] font-semibold text-ink/70', size === 'lg' ? 'text-lead' : 'text-meta')}>
          {l(m.topic)}
        </p>
      )}
    </div>
  );
}
