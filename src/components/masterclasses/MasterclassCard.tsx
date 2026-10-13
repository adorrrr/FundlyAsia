import { Link } from 'react-router-dom';
import type { Masterclass, Speaker } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { registrationAvailability } from '@/services';
import { Button } from '@/components/ui/Button';
import { MasterclassCover } from './MasterclassCover';
import { MasterclassMeta } from './MasterclassMeta';
import { AvailabilityBadge } from './Availability';

export function MasterclassCard({ m, speaker }: { m: Masterclass; speaker?: Speaker }) {
  const { d, l, formatMoney } = useI18n();
  const avail = registrationAvailability(m);
  const href = `/masterclasses/${m.id}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-hair transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-float">
      <Link to={href} tabIndex={-1} aria-hidden className="block">
        <MasterclassCover m={m} decorative className="aspect-[16/9] w-full" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <AvailabilityBadge m={m} avail={avail} />
        </div>
        <p className="text-meta font-semibold text-brand">{l(m.topic)}</p>
        <h3 className="mt-1 text-card font-semibold">
          <Link to={href} className="hover:text-brand focus-visible:text-brand">{l(m.title)}</Link>
        </h3>
        <MasterclassMeta m={m} speaker={speaker} dense className="mt-4" />
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <p className="tnum text-body font-semibold">{formatMoney(m.fee)}</p>
            {avail.open ? (
              <Button to={`${href}/register`} size="sm">{d.mc.register}</Button>
            ) : (
              <Button to={href} size="sm" variant="secondary">{d.mc.details}</Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
