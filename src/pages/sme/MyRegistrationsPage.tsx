import { Link } from 'react-router-dom';
import { ChevronRight, Ticket } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationService } from '@/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback';
import { MasterclassCover } from '@/components/masterclasses/MasterclassCover';

export default function MyRegistrationsPage() {
  const { d, l, formatDate, formatMoney } = useI18n();
  useDocumentTitle(d.myreg.title);
  const { user } = useAuth();
  const regs = useAsync(() => registrationService.listMine(user!.id), [user?.id]);
  const classes = useAsync(() => masterclassService.listAll(), []);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={d.myreg.title} body={d.myreg.body} actions={<Button to="/masterclasses" variant="secondary">{d.dash.browse}</Button>} />
      {regs.loading || classes.loading ? (
        <LoadingBlock rows={3} />
      ) : regs.error ? (
        <ErrorState onRetry={regs.reload} />
      ) : !regs.data?.length ? (
        <EmptyState icon={<Ticket className="h-5 w-5" />} title={d.myreg.empty} body={d.myreg.emptyBody} action={<Button to="/masterclasses">{d.dash.browse}</Button>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {regs.data.map((r) => {
            const m = classes.data?.find((x) => x.id === r.masterclassId);
            return (
              <li key={r.id}>
                <Link to={`/registrations/${r.id}`} className="group flex items-center gap-4 rounded-card bg-surface p-3 pr-4 shadow-hair transition-shadow hover:shadow-lift sm:p-4">
                  {m && <MasterclassCover m={m} size="sm" className="hidden h-16 w-24 flex-none rounded-control sm:block" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-semibold">{l(m?.title)}</p>
                    <p className="tnum mt-0.5 truncate text-meta text-slate">{r.id} · {formatDate(m?.date ?? '')} · {formatMoney(r.amount)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <StatusBadge status={r.status} />
                      {r.paymentStatus !== 'not_required' && <StatusBadge status={r.paymentStatus} />}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-none text-slate transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
