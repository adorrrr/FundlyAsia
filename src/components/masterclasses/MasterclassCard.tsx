import { Link } from 'react-router-dom';
import type { Masterclass, Speaker } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { registrationAvailability } from '@/services';
import { MasterclassCover } from './MasterclassCover';
import { MasterclassMeta } from './MasterclassMeta';
import { AvailabilityBadge } from './Availability';

export function MasterclassCard({ m, speaker }: { m: Masterclass; speaker?: Speaker }) {
  const { l, formatMoney } = useI18n();
  const avail = registrationAvailability(m);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-hair transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-float">
      <MasterclassCover m={m} className="aspect-[16/9]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <AvailabilityBadge m={m} avail={avail} />
        </div>
        <h3 className="text-card font-semibold">
          <Link to={`/masterclasses/${m.id}`} className="after:absolute after:inset-0 focus-visible:outline-none group-has-[:focus-visible]:underline">
            {l(m.title)}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-body text-slate">{l(m.summary)}</p>
        <MasterclassMeta m={m} speaker={speaker} dense className="mt-4" />
        <p className="tnum mt-auto pt-4 text-body font-semibold">{formatMoney(m.fee)}</p>
      </div>
    </article>
  );
}
