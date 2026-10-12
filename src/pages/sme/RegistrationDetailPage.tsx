import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useOptionLabel } from '@/hooks/useOptions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationService } from '@/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { DemoBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { SessionSummary } from '@/components/masterclasses/SessionSummary';
import { CalendarActions } from '@/components/masterclasses/CalendarActions';

export default function RegistrationDetailPage() {
  const { id = '' } = useParams();
  const { d, t, formatDate, formatMoney } = useI18n();
  const label = useOptionLabel();
  const toast = useToast();
  const reg = useAsync(() => registrationService.get(id), [id]);
  const mc = useAsync(async () => (reg.data ? masterclassService.get(reg.data.masterclassId) : undefined), [reg.data?.masterclassId]);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(t(d.myreg.detailTitle, { id }));

  if (reg.loading || mc.loading) return <LoadingBlock rows={3} />;
  if (!reg.data || !mc.data) return <EmptyState title={d.myreg.notFound} action={<Button to="/my-registrations" variant="secondary">{d.myreg.title}</Button>} />;
  const r = reg.data;
  const m = mc.data;
  const needsPayment = r.paymentStatus === 'pending' || r.paymentStatus === 'failed';
  const canRefund = r.paymentStatus === 'paid' && r.status === 'confirmed' && m.status !== 'completed';

  const requestRefund = async () => {
    setBusy(true);
    const updated = await registrationService.requestRefund(r.id);
    reg.setData(updated);
    setBusy(false);
    setConfirmRefund(false);
    toast(d.myreg.refundRequested, 'info');
  };

  const rows: [string, string][] = [
    [d.auth.name, r.name],
    [d.auth.email, r.email],
    [d.profile.businessName, r.businessName],
    [d.profile.industry, label('industry', r.industry)],
    [d.profile.businessType, label('businessType', r.businessType)],
    [d.myreg.intent, label('intent', r.financingIntent)],
    ...(r.financingIntent === 'yes' ? ([[d.reg.purpose, label('purpose', r.purpose)], [d.reg.amount, label('range', r.amountRange)]] as [string, string][]) : []),
  ];

  return (
    <div>
      <PageHeader
        back={{ to: '/my-registrations', label: d.myreg.title }}
        title={t(d.myreg.detailTitle, { id: r.id })}
        body={t(d.myreg.registeredOn, { date: formatDate(r.createdAt) })}
        meta={
          <>
            <StatusBadge status={r.status} />
            {r.paymentStatus !== 'not_required' && <StatusBadge status={r.paymentStatus} />}
            {r.demo && <DemoBadge />}
          </>
        }
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="flex flex-col gap-6">
          {needsPayment && (
            <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-card font-semibold">{d.myreg.payment}: {formatMoney(r.amount)}</p>
                <p className="mt-1 text-body text-slate">{r.paymentStatus === 'failed' ? d.pay.failedBody : d.mc.paidNote}</p>
              </div>
              <Button to={`/registrations/${r.id}/payment`} className="flex-none">{d.myreg.payNow}</Button>
            </div>
          )}
          {r.paymentStatus === 'refund_requested' && <Notice tone="info">{d.myreg.refundRequested}</Notice>}
          {r.paymentStatus === 'refunded' && <Notice tone="info" title={d.pay.refundedTitle}>{d.pay.refundedBody}</Notice>}

          <section className="surface p-5 sm:p-6" aria-labelledby="reg-details">
            <h2 id="reg-details" className="mb-4 text-card font-semibold">{d.myreg.registration}</h2>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-meta text-slate">{k}</dt>
                  <dd className="mt-0.5 break-words text-body font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {r.status === 'confirmed' && (
            <section className="surface p-5 sm:p-6" aria-labelledby="cal">
              <h2 id="cal" className="mb-4 text-card font-semibold">{d.confirm.addCalendar}</h2>
              <CalendarActions m={m} regId={r.id} />
            </section>
          )}

          {canRefund && (
            <div>
              <Button variant="ghost" className="text-bad hover:bg-bad-soft" onClick={() => setConfirmRefund(true)}>{d.myreg.requestRefund}</Button>
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SessionSummary m={m} />
        </aside>
      </div>

      <Dialog
        open={confirmRefund}
        onClose={() => setConfirmRefund(false)}
        title={d.myreg.refundConfirmTitle}
        description={d.myreg.refundConfirmBody}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRefund(false)}>{d.common.cancel}</Button>
            <Button variant="danger" loading={busy} onClick={requestRefund}>{d.myreg.requestRefund}</Button>
          </>
        }
      />
    </div>
  );
}
