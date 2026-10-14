import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CreditCard, DollarSign, RefreshCw, Ticket } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useOptionLabel } from '@/hooks/useOptions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationService } from '@/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { SessionSummary } from '@/components/masterclasses/SessionSummary';
import { CalendarActions } from '@/components/masterclasses/CalendarActions';
import { TicketModal } from '@/components/masterclasses/TicketModal';
import { RefundModal } from '@/components/masterclasses/RefundModal';

import { onMasterclassesChanged } from '@/services/api/manualPaymentApi';

export default function RegistrationDetailPage() {
  const { id = '' } = useParams();
  const { d, t, formatDate, formatMoney } = useI18n();
  const label = useOptionLabel();
  const reg = useAsync(() => registrationService.get(id), [id]);
  const mc = useAsync(
    async () => (reg.data ? masterclassService.get(reg.data.masterclassId) : undefined),
    [reg.data?.masterclassId]
  );

  useEffect(() => {
    return onMasterclassesChanged(() => {
      reg.reload();
      mc.reload();
    });
  }, [reg, mc]);

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  useDocumentTitle(t(d.myreg.detailTitle, { id }));

  if (reg.loading || mc.loading) return <LoadingBlock rows={3} />;
  if (!reg.data || !mc.data) {
    return (
      <EmptyState
        title={d.myreg.notFound}
        action={
          <Button to="/my-registrations" variant="secondary">
            {d.myreg.title}
          </Button>
        }
      />
    );
  }

  const r = reg.data;
  const m = mc.data;
  const isPaid = r.paymentStatus === 'paid' && r.status === 'confirmed';
  const isPendingPay = r.paymentStatus === 'pending';
  const isPendingVerification = r.paymentStatus === 'pending_verification';
  const isFailed = r.paymentStatus === 'failed';
  const canRefund =
    isPaid && m.status !== 'completed' && (r.amountPaid ?? r.amount) > (r.amountRefunded ?? 0);

  const rows: [string, string][] = [
    [d.auth.name, r.name],
    [d.auth.email, r.email],
    [d.profile.businessName, r.businessName],
    [d.profile.industry, label('industry', r.industry)],
    [d.profile.businessType, label('businessType', r.businessType)],
    [d.myreg.intent, label('intent', r.financingIntent)],
    ...(r.financingIntent === 'yes'
      ? ([
          [d.reg.purpose, label('purpose', r.purpose)],
          [d.reg.amount, label('range', r.amountRange)],
        ] as [string, string][])
      : []),
  ];

  return (
    <div>
      <PageHeader
        back={{ to: '/my-registrations', label: d.myreg.title }}
        title={t(d.myreg.detailTitle, { id: r.id })}
        body={t(d.myreg.registeredOn, { date: formatDate(r.createdAt) })}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={r.status} />
            {r.paymentStatus !== 'not_required' && <StatusBadge status={r.paymentStatus} />}
            {r.ticketNumber && (
              <span className="rounded bg-paper px-2.5 py-0.5 font-mono text-meta font-bold text-ink">
                Pass: {r.ticketNumber}
              </span>
            )}
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="flex flex-col gap-6">
          {/* Confirmed Entry Pass Banner */}
          {isPaid && (
            <div className="flex flex-col gap-4 rounded-xl border border-ok/30 bg-ok-soft/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-ok">
                  Verified Registration
                </span>
                <p className="mt-0.5 text-card font-bold text-ink">
                  Your Digital Ticket is Active
                </p>
                <p className="mt-1 text-meta text-slate">
                  Ticket #{r.ticketNumber} is confirmed for venue entry.
                </p>
              </div>
              <Button
                size="lg"
                icon={<Ticket className="h-4 w-4" />}
                onClick={() => setTicketModalOpen(true)}
                className="flex-none"
              >
                View Digital Ticket
              </Button>
            </div>
          )}

          {/* Pending Payment State */}
          {isPendingPay && (
            <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-card font-semibold">
                  {d.myreg.payment}: {formatMoney(r.amount)}
                </p>
                <p className="mt-1 text-body text-slate">{d.mc.paidNote}</p>
              </div>
              <Button
                to={`/registrations/${r.id}/payment`}
                icon={<CreditCard className="h-4 w-4" />}
                className="flex-none"
              >
                {d.myreg.payNow}
              </Button>
            </div>
          )}

          {/* Verification in Progress State */}
          {isPendingVerification && (
            <Notice tone="warn" title="Payment Under Review">
              Your transaction details have been submitted for verification. Fundly administration is
              checking the deposit on our bank statement. Your entry pass will be generated once
              approved.
            </Notice>
          )}

          {/* Payment Failed / Rejected State */}
          {isFailed && (
            <div className="flex flex-col gap-3 rounded-xl border border-bad/30 bg-bad-soft/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-card font-bold text-bad">Payment Submission Rejected</p>
                <p className="mt-1 text-meta text-slate">
                  {r.latestSubmission?.rejectionReason
                    ? `Reason: ${r.latestSubmission.rejectionReason}`
                    : 'The submitted transaction ID could not be verified on our statement. Please check your transaction details and resubmit.'}
                </p>
              </div>
              <Button
                to={`/registrations/${r.id}/payment`}
                icon={<RefreshCw className="h-4 w-4" />}
                className="flex-none bg-bad hover:bg-bad/90"
              >
                Resubmit Payment
              </Button>
            </div>
          )}

          {r.paymentStatus === 'refund_requested' && (
            <Notice tone="info" title="Refund Request Under Review">
              You have submitted a refund request for this registration. Our finance team is reviewing
              it and will disburse funds to your nominated account upon approval.
            </Notice>
          )}

          {r.paymentStatus === 'refunded' && (
            <div className="flex flex-col gap-2 rounded-xl border border-ok/30 bg-ok-soft/40 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ok text-white font-bold text-xs">✓</span>
                <h3 className="text-card font-bold text-ok">Payment Refunded (টাকা রিফান্ড সম্পন্ন হয়েছে)</h3>
              </div>
              <p className="text-meta text-slate">
                Your refund of <strong>{formatMoney(r.amountRefunded || r.amount)}</strong> has been successfully processed and disbursed to your designated account by Fundly administration. The seat reservation for this session has been cancelled.
              </p>
            </div>
          )}

          {/* Registration Info */}
          <section className="surface p-5 sm:p-6" aria-labelledby="reg-details">
            <h2 id="reg-details" className="mb-4 text-card font-semibold">
              {d.myreg.registration}
            </h2>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-meta text-slate">{k}</dt>
                  <dd className="mt-0.5 break-words text-body font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Calendar Actions for Confirmed Attendee */}
          {isPaid && (
            <section className="surface p-5 sm:p-6" aria-labelledby="cal">
              <h2 id="cal" className="mb-4 text-card font-semibold">
                {d.confirm.addCalendar}
              </h2>
              <CalendarActions m={m} regId={r.id} />
            </section>
          )}

          {/* Refund Trigger Button */}
          {canRefund && (
            <div className="flex justify-start pt-2">
              <Button
                variant="ghost"
                className="text-bad hover:bg-bad-soft"
                icon={<DollarSign className="h-4 w-4" />}
                onClick={() => setRefundModalOpen(true)}
              >
                Request Refund / Cancel Seat
              </Button>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SessionSummary m={m} />
        </aside>
      </div>

      {/* Digital Ticket Modal */}
      <TicketModal
        registrationId={r.id}
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
      />

      {/* Refund Request Modal */}
      <RefundModal
        registration={r}
        open={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        onSuccess={() => reg.reload()}
      />
    </div>
  );
}
