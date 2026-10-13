import type { Masterclass } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { MasterclassCover } from './MasterclassCover';
import { MasterclassMeta } from './MasterclassMeta';

export function SessionSummary({ m, title }: { m: Masterclass; title?: string }) {
  const { d, l, formatMoney } = useI18n();
  return (
    <div className="overflow-hidden rounded-panel bg-surface shadow-hair">
      <MasterclassCover m={m} size="sm" decorative sizes="340px" className="aspect-[16/9] w-full" />
      <div className="p-5">
        {title && <p className="text-meta font-semibold text-slate">{title}</p>}
        <p className="mt-1 text-card font-semibold">{l(m.title)}</p>
        <MasterclassMeta m={m} dense className="mt-4" />
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-meta text-slate">{d.mc.fee}</span>
          <span className="tnum text-lead font-bold">{formatMoney(m.fee)}</span>
        </div>
      </div>
    </div>
  );
}
