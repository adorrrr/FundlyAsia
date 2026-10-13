import { useMemo, useState } from 'react';
import { Download, Settings2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationService } from '@/services';
import type { PaymentStatus, Registration, RegistrationStatus } from '@/types';
import { PageHeader, SectionTitle } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { FilterPills, SearchInput } from '@/components/ui/SearchInput';
import { SelectField, TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv } from '@/utils/csv';
import { isBlank } from '@/utils/validation';

const PAYMENT: PaymentStatus[] = ['not_required', 'pending', 'paid', 'failed', 'refund_requested', 'refunded'];

export default function AdminRegistrationsPage() {
  const { d, l, t, formatDate, formatMoney } = useI18n();
  const a = d.admin.regs;
  useDocumentTitle(a.title);
  const toast = useToast();
  const regs = useAsync(() => registrationService.listAll(), []);
  const classes = useAsync(() => masterclassService.listAll(), []);
  const [q, setQ] = useState('');
  const [mc, setMc] = useState('');
  const [pay, setPay] = useState<'all' | PaymentStatus>('all');
  const [managing, setManaging] = useState<Registration | null>(null);
  const [correction, setCorrection] = useState<{ status: PaymentStatus; reason: string; error?: string }>({ status: 'paid', reason: '' });
  const [busy, setBusy] = useState(false);

  const titleOf = (id: string) => l(classes.data?.find((m) => m.id === id)?.title);
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (regs.data ?? []).filter(
      (r) => (!query || [r.name, r.businessName, r.email, r.id].some((v) => v.toLowerCase().includes(query))) && (!mc || r.masterclassId === mc) && (pay === 'all' || r.paymentStatus === pay),
    );
  }, [regs.data, q, mc, pay]);
  const refundQueue = (regs.data ?? []).filter((r) => r.paymentStatus === 'refund_requested');

  const replace = (r: Registration) => {
    regs.setData((xs) => xs?.map((x) => (x.id === r.id ? r : x)));
    setManaging((m) => (m && m.id === r.id ? r : m));
  };
  const setStatus = async (r: Registration, s: RegistrationStatus) => {
    try {
      replace(await registrationService.setStatus(r.id, s));
      toast(a.updated);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : d.common.errorTitle, 'error');
    }
  };
  const setPayment = async (r: Registration, s: PaymentStatus, reason?: string) => {
    try {
      replace(await registrationService.setPaymentStatus(r.id, s, reason));
      toast(a.updated);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : d.common.errorTitle, 'error');
    }
  };
  const applyCorrection = async () => {
    if (!managing) return;
    if (isBlank(correction.reason)) {
      setCorrection((c) => ({ ...c, error: d.validation.required }));
      toast(d.validation.required, 'error');
      return;
    }
    setBusy(true);
    try {
      await setPayment(managing, correction.status, correction.reason);
      setCorrection({ status: 'paid', reason: '' });
      setManaging(null);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : d.common.errorTitle, 'error');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    downloadCsv(
      'fundly-registrations.csv',
      rows.map((r) => ({ registration_id: r.id, name: r.name, business: r.businessName, email: r.email, masterclass: titleOf(r.masterclassId), registration_status: r.status, payment_status: r.paymentStatus, amount_bdt: r.amount, financing_intent: r.financingIntent, purpose: r.purpose ?? '', amount_range: r.amountRange ?? '', created_at: r.createdAt })),
    );
    toast(a.exported, 'info');
  };

  if (regs.loading || classes.loading) return <LoadingBlock rows={5} />;

  return (
    <div>
      <PageHeader title={a.title} body={a.body} actions={<Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!rows.length}>{d.common.exportCsv}</Button>} />

      <section className="mb-8" aria-labelledby="rq">
        <SectionTitle as="h2"><span id="rq">{a.refundQueue}</span></SectionTitle>
        {refundQueue.length ? (
          <ul className="flex flex-col gap-2">
            {refundQueue.map((r) => (
              <li key={r.id} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{r.name} · {r.businessName}</p>
                  <p className="tnum text-meta text-slate">{r.id} · {titleOf(r.masterclassId)} · {formatMoney(r.amount)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setPayment(r, 'refunded')}>{a.approveRefund}</Button>
                  <Button size="sm" variant="secondary" onClick={() => setPayment(r, 'paid')}>{a.rejectRefund}</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-slate">{a.refundEmpty}</p>
        )}
      </section>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SearchInput value={q} onChange={setQ} placeholder={a.search} />
          <SelectField label={<span className="sr-only">{a.masterclass}</span>} value={mc} onChange={(e) => setMc(e.target.value)} placeholder={`${a.masterclass}: ${d.common.all}`} options={(classes.data ?? []).map((m) => ({ value: m.id, label: l(m.title) }))} className="sm:w-64" />
        </div>
        <FilterPills label={a.payment} value={pay} onChange={setPay} options={[{ value: 'all', label: d.common.all }, ...PAYMENT.map((p) => ({ value: p, label: d.status[p] }))]} />
      </div>

      <DataTable<Registration>
        caption={a.title}
        rows={rows}
        rowKey={(r) => r.id}
        empty={<EmptyState title={d.common.noResults} action={<Button variant="secondary" onClick={() => { setQ(''); setMc(''); setPay('all'); }}>{d.common.clearFilters}</Button>} />}
        columns={[
          { key: 'n', header: a.name, cell: (r) => <div><p className="font-semibold">{r.name}</p><p className="tnum text-meta text-slate">{r.id}</p></div> },
          { key: 'b', header: d.admin.smes.business, cell: (r) => <div><p>{r.businessName}</p><p className="text-meta text-slate">{r.email}</p></div>, hideBelow: 'lg' },
          { key: 'm', header: a.masterclass, cell: (r) => <div><p>{titleOf(r.masterclassId)}</p><p className="text-meta text-slate">{formatDate(r.createdAt)}</p></div>, hideBelow: 'md' },
          { key: 'r', header: a.registration, cell: (r) => <StatusBadge status={r.status} /> },
          { key: 'p', header: a.payment, cell: (r) => <StatusBadge status={r.paymentStatus} /> },
          { key: 'x', header: <span className="sr-only">{d.common.actions}</span>, align: 'right', cell: (r) => <Button size="sm" variant="ghost" icon={<Settings2 className="h-3.5 w-3.5" />} onClick={() => setManaging(r)} aria-label={`${d.common.edit} ${r.id}`}>{d.common.edit}</Button> },
        ]}
      />

      <Dialog open={!!managing} onClose={() => setManaging(null)} title={managing?.id ?? ''} description={managing ? `${managing.name} · ${titleOf(managing.masterclassId)}` : undefined} size="md">
        {managing && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2"><StatusBadge status={managing.status} /><StatusBadge status={managing.paymentStatus} /></div>
            <div>
              <p className="mb-2 text-meta font-semibold">{d.myreg.registration}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={managing.status === 'attended'} onClick={() => setStatus(managing, 'attended')}>{a.markAttended}</Button>
                <Button size="sm" variant="secondary" disabled={managing.status === 'no_show'} onClick={() => setStatus(managing, 'no_show')}>{a.markNoShow}</Button>
              </div>
            </div>
            {managing.paymentStatus === 'refund_requested' && (
              <div>
                <p className="mb-2 text-meta font-semibold">{a.refundQueue}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setPayment(managing, 'refunded')}>{a.approveRefund}</Button>
                  <Button size="sm" variant="secondary" onClick={() => setPayment(managing, 'paid')}>{a.rejectRefund}</Button>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 rounded-card bg-paper p-4">
              <p className="text-meta font-semibold">{t(a.correctTitle, { id: managing.id })}</p>
              <Notice tone="info">{a.correctBody}</Notice>
              <SelectField label={a.payment} value={correction.status} onChange={(e) => setCorrection((c) => ({ ...c, status: e.target.value as PaymentStatus }))} options={PAYMENT.map((p) => ({ value: p, label: d.status[p] }))} />
              <TextField label={a.reason} placeholder={a.reasonPlaceholder} value={correction.reason} onChange={(e) => setCorrection((c) => ({ ...c, reason: e.target.value, error: undefined }))} error={correction.error} required />
              <Button className="self-start" onClick={applyCorrection} loading={busy}>{a.apply}</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
