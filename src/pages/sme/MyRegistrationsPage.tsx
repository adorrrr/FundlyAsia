import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CreditCard, RefreshCw, Ticket } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationService } from '@/services';
import type { Registration } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback';
import { MasterclassCover } from '@/components/masterclasses/MasterclassCover';
import { TicketModal } from '@/components/masterclasses/TicketModal';

export default function MyRegistrationsPage() {
  const { d, l, formatDate, formatMoney } = useI18n();
  useDocumentTitle(d.myreg.title);
  const { user } = useAuth();
  const regs = useAsync(() => registrationService.listMine(user!.id), [user?.id]);
  const classes = useAsync(() => masterclassService.listPublic(), []);

  useEffect(() => {
    const handler = () => {
      regs.reload();
      classes.reload();
    };
    window.addEventListener('fundly:masterclasses-updated', handler);
    return () => window.removeEventListener('fundly:masterclasses-updated', handler);
  }, [regs, classes]);

  const [selectedTicketReg, setSelectedTicketReg] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={d.myreg.title}
        body={d.myreg.body}
        actions={
          <Button to="/masterclasses" variant="secondary">
            {d.dash.browse}
          </Button>
        }
      />

      {regs.loading || classes.loading ? (
        <LoadingBlock rows={3} />
      ) : regs.error ? (
        <ErrorState onRetry={regs.reload} />
      ) : !regs.data?.length ? (
        <EmptyState
          icon={<Ticket className="h-5 w-5" />}
          title={d.myreg.empty}
          body={d.myreg.emptyBody}
          action={<Button to="/masterclasses">{d.dash.browse}</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {regs.data.map((r: Registration) => {
            const m = classes.data?.find((x) => x.id === r.masterclassId);
            const isPaid = r.paymentStatus === 'paid' && r.status === 'confirmed';
            const isFailed = r.paymentStatus === 'failed';
            const isPendingPay = r.paymentStatus === 'pending';
            const isReview = r.paymentStatus === 'pending_verification';

            return (
              <li key={r.id}>
                <div className="group flex flex-col gap-3 rounded-card bg-surface p-4 shadow-hair transition-shadow hover:shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <Link
                    to={`/registrations/${r.id}`}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    {m && (
                      <MasterclassCover
                        m={m}
                        size="sm"
                        decorative
                        sizes="112px"
                        className="hidden aspect-[16/9] w-28 flex-none rounded-control sm:block"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-semibold text-ink group-hover:text-brand">
                        {l(m?.title)}
                      </p>
                      <p className="tnum mt-0.5 truncate text-meta text-slate">
                        {r.id} · {formatDate(m?.date ?? '')} · {formatMoney(r.amount)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={r.status} />
                        {r.paymentStatus !== 'not_required' && (
                          <StatusBadge status={r.paymentStatus} />
                        )}
                        {r.ticketNumber && (
                          <span className="font-mono text-[0.6875rem] font-bold text-slate">
                            {r.ticketNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Contextual Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 sm:flex-none">
                    {isPaid && (
                      <Button
                        size="sm"
                        icon={<Ticket className="h-3.5 w-3.5" />}
                        onClick={() => setSelectedTicketReg(r.id)}
                      >
                        Digital Ticket
                      </Button>
                    )}

                    {isFailed && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="border-bad/40 text-bad hover:bg-bad-soft"
                        icon={<RefreshCw className="h-3.5 w-3.5" />}
                        to={`/registrations/${r.id}/payment`}
                      >
                        Resubmit Payment
                      </Button>
                    )}

                    {isPendingPay && (
                      <Button
                        size="sm"
                        icon={<CreditCard className="h-3.5 w-3.5" />}
                        to={`/registrations/${r.id}/payment`}
                      >
                        Pay Now
                      </Button>
                    )}

                    {isReview && (
                      <span className="rounded-full bg-warn-soft px-3 py-1 text-[0.75rem] font-semibold text-warn">
                        Verification Pending
                      </span>
                    )}

                    <Link
                      to={`/registrations/${r.id}`}
                      className="rounded-lg p-2 text-slate hover:bg-mist hover:text-ink"
                      aria-label="View details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Digital Ticket Modal */}
      {selectedTicketReg && (
        <TicketModal
          registrationId={selectedTicketReg}
          open={!!selectedTicketReg}
          onClose={() => setSelectedTicketReg(null)}
        />
      )}
    </div>
  );
}
