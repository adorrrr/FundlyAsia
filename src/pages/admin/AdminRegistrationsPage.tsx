import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Ticket,
  X,
  XCircle,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationService } from '@/services';
import { manualPaymentApi, notifyMasterclassesChanged, onMasterclassesChanged } from '@/services/api/manualPaymentApi';
import type {
  PaymentStatus,
  PaymentSubmission,
  RefundRecord,
  Registration,
  RegistrationStatus,
} from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { FilterPills, SearchInput } from '@/components/ui/SearchInput';
import { SelectField, TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv } from '@/utils/csv';
import { isBlank } from '@/utils/validation';
import { TicketModal } from '@/components/masterclasses/TicketModal';

type ActiveTab = 'registrations' | 'verifications' | 'refunds';

const PAYMENT: PaymentStatus[] = [
  'not_required',
  'pending',
  'pending_verification',
  'paid',
  'failed',
  'refund_requested',
  'partially_refunded',
  'refunded',
];

export default function AdminRegistrationsPage() {
  const { d, l, t, formatDate, formatMoney } = useI18n();
  const a = d.admin.regs;
  useDocumentTitle('Registration & Payment Management');
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('registrations');

  // Registrations & Masterclasses state
  const regs = useAsync(() => registrationService.listAll(), []);
  const classes = useAsync(() => masterclassService.listAll(), []);

  // Submissions state
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Refunds state
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);

  // Filter states
  const [q, setQ] = useState('');
  const [mc, setMc] = useState('');
  const [pay, setPay] = useState<'all' | PaymentStatus>('all');

  // Modals & Action states
  const [managing, setManaging] = useState<Registration | null>(null);
  const [ticketModalReg, setTicketModalReg] = useState<string | null>(null);
  const [correction, setCorrection] = useState<{ status: PaymentStatus; reason: string; error?: string }>({
    status: 'paid',
    reason: '',
  });
  const [cancelModalReg, setCancelModalReg] = useState<Registration | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Payment Verification Modals
  const [rejectSubModal, setRejectSubModal] = useState<PaymentSubmission | null>(null);
  const [rejectSubReason, setRejectSubReason] = useState('');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Refund Management Modals
  const [rejectRefModal, setRejectRefModal] = useState<RefundRecord | null>(null);
  const [rejectRefReason, setRejectRefReason] = useState('');
  const [completeRefModal, setCompleteRefModal] = useState<RefundRecord | null>(null);
  const [disbursementTrxId, setDisbursementTrxId] = useState('');
  const [disbursementNotes, setDisbursementNotes] = useState('');

  // Direct Admin Refund Modal
  const [directRefundReg, setDirectRefundReg] = useState<Registration | null>(null);
  const [directRefundAmount, setDirectRefundAmount] = useState<number>(0);
  const [directRefundReason, setDirectRefundReason] = useState('Masterclass session cancelled by organizer');
  const [directRefundMethod, setDirectRefundMethod] = useState('bkash');
  const [directRefundDest, setDirectRefundDest] = useState('');
  const [directRefundTrx, setDirectRefundTrx] = useState('');

  const [busy, setBusy] = useState(false);

  const fetchSubmissions = useCallback(() => {
    setSubmissionsLoading(true);
    manualPaymentApi
      .listPaymentSubmissions()
      .then(setSubmissions)
      .catch((err) => toast(err instanceof Error ? err.message : 'Failed to load submissions.', 'error'))
      .finally(() => setSubmissionsLoading(false));
  }, [toast]);

  const fetchRefunds = useCallback(() => {
    setRefundsLoading(true);
    manualPaymentApi
      .listRefunds()
      .then(setRefunds)
      .catch((err) => toast(err instanceof Error ? err.message : 'Failed to load refunds.', 'error'))
      .finally(() => setRefundsLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchSubmissions();
    fetchRefunds();
  }, [fetchSubmissions, fetchRefunds]);

  // Synchronize immediately when masterclasses or registrations are updated anywhere
  useEffect(() => {
    return onMasterclassesChanged(() => {
      regs.reload();
      classes.reload();
      fetchSubmissions();
      fetchRefunds();
    });
  }, [regs, classes, fetchSubmissions, fetchRefunds]);

  const titleOf = (id: string) => l(classes.data?.find((m) => m.id === id)?.title);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (regs.data ?? []).filter(
      (r) =>
        (!query ||
          [r.name, r.businessName, r.email, r.id, r.ticketNumber || ''].some((v) =>
            v.toLowerCase().includes(query)
          )) &&
        (!mc || r.masterclassId === mc) &&
        (pay === 'all' || r.paymentStatus === pay)
    );
  }, [regs.data, q, mc, pay]);

  const pendingSubCount = submissions.filter((s) => s.status === 'pending').length;
  const pendingRefCount = refunds.filter((r) => r.status === 'pending' || r.status === 'processing').length;

  const replace = (r: Registration) => {
    regs.setData((xs) => xs?.map((x) => (x.id === r.id ? r : x)));
    setManaging((m) => (m && m.id === r.id ? r : m));
  };

  const handleStatusChange = async (r: Registration, s: RegistrationStatus) => {
    try {
      replace(await registrationService.setStatus(r.id, s));
      toast('Registration status updated.');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : d.common.errorTitle, 'error');
    }
  };

  const handlePaymentCorrection = async () => {
    if (!managing) return;
    if (isBlank(correction.reason)) {
      setCorrection((c) => ({ ...c, error: d.validation.required }));
      toast(d.validation.required, 'error');
      return;
    }
    setBusy(true);
    try {
      replace(await registrationService.setPaymentStatus(managing.id, correction.status, correction.reason));
      setCorrection({ status: 'paid', reason: '' });
      setManaging(null);
      toast('Payment status corrected.');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : d.common.errorTitle, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAdminCancel = async () => {
    if (!cancelModalReg || !cancelReason.trim()) {
      toast('A cancellation reason is required.', 'error');
      return;
    }
    setBusy(true);
    try {
      const updated = await manualPaymentApi.adminCancelRegistration(cancelModalReg.id, cancelReason.trim());
      replace(updated);
      setCancelModalReg(null);
      setCancelReason('');
      toast('Registration cancelled and seat released.', 'success');
      regs.reload();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Cancellation failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Payment Verification Actions
  const handleApproveSubmission = async (sub: PaymentSubmission) => {
    setBusy(true);
    try {
      const res = await manualPaymentApi.approvePaymentSubmission(sub.id);
      toast(`Submission approved! Ticket #${res.ticketNumber} generated.`, 'success');
      fetchSubmissions();
      regs.reload();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Approval failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRejectSubmission = async () => {
    if (!rejectSubModal || !rejectSubReason.trim()) {
      toast('Please enter a rejection reason.', 'error');
      return;
    }
    setBusy(true);
    try {
      await manualPaymentApi.rejectPaymentSubmission(rejectSubModal.id, rejectSubReason.trim());
      toast('Submission rejected.', 'info');
      setRejectSubModal(null);
      setRejectSubReason('');
      fetchSubmissions();
      regs.reload();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Rejection failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Refund Actions
  const handleRejectRefund = async () => {
    if (!rejectRefModal || !rejectRefReason.trim()) {
      toast('Please enter a rejection reason.', 'error');
      return;
    }
    setBusy(true);
    try {
      await manualPaymentApi.rejectRefund(rejectRefModal.id, rejectRefReason.trim());
      toast('Refund request rejected.', 'info');
      setRejectRefModal(null);
      setRejectRefReason('');
      fetchRefunds();
      regs.reload();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Rejection failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Account number copied to clipboard!', 'info');
  };

  const handleCompleteRefund = async () => {
    if (!completeRefModal) return;
    setBusy(true);
    try {
      await manualPaymentApi.completeRefund(completeRefModal.id, {
        trxId: disbursementTrxId.trim() || undefined,
        notes: disbursementNotes.trim() || undefined,
      });
      toast('Refund disbursement confirmed! Registration cancelled and seat released.', 'success');
      notifyMasterclassesChanged();
      setCompleteRefModal(null);
      setDisbursementTrxId('');
      setDisbursementNotes('');
      fetchRefunds();
      regs.reload();
      classes.reload();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Disbursement recording failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDirectRefund = async () => {
    if (!directRefundReg || !directRefundReason.trim()) {
      toast('A refund reason is required.', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await manualPaymentApi.directRefund(directRefundReg.id, {
        amount: Number(directRefundAmount) || undefined,
        reason: directRefundReason.trim(),
        destinationAccount: directRefundDest.trim() || undefined,
        refundMethod: directRefundMethod,
        trxId: directRefundTrx.trim() || undefined,
      });
      replace(res.registration);
      toast(`Refund processed and seat released for ${directRefundReg.name}!`, 'success');
      setDirectRefundReg(null);
      setManaging(null);
      regs.reload();
      classes.reload();
      fetchRefunds();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Refund failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    downloadCsv(
      'fundly-registrations.csv',
      rows.map((r) => ({
        registration_id: r.id,
        ticket_number: r.ticketNumber || '',
        name: r.name,
        business: r.businessName,
        email: r.email,
        masterclass: titleOf(r.masterclassId),
        registration_status: r.status,
        payment_status: r.paymentStatus,
        amount_bdt: r.amount,
        amount_paid: r.amountPaid || 0,
        amount_refunded: r.amountRefunded || 0,
        attendance: r.attendanceStatus || 'unmarked',
        created_at: r.createdAt,
      }))
    );
    toast(a.exported, 'info');
  };

  return (
    <div>
      <PageHeader
        title="Masterclass Registrations & Revenue"
        body="Verify manual Bangla QR payments, issue digital tickets, manage attendee records, and process refund requests."
        actions={
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            onClick={exportCsv}
            disabled={!rows.length}
          >
            {d.common.exportCsv}
          </Button>
        }
      />

      {/* Primary Tab Navigation */}
      <div className="mb-6 flex border-b border-line">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-body font-semibold transition-colors ${
            activeTab === 'registrations'
              ? 'border-brand-deep text-brand-deep'
              : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          <span>All Registrations</span>
          <span className="rounded-full bg-mist px-2 py-0.5 text-[0.75rem] font-bold text-slate">
            {regs.data?.length ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-body font-semibold transition-colors ${
            activeTab === 'verifications'
              ? 'border-brand-deep text-brand-deep'
              : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          <span>Payment Verification Queue</span>
          {pendingSubCount > 0 ? (
            <span className="rounded-full bg-warn px-2 py-0.5 text-[0.75rem] font-bold text-white animate-pulse">
              {pendingSubCount}
            </span>
          ) : (
            <span className="rounded-full bg-mist px-2 py-0.5 text-[0.75rem] font-bold text-slate">
              {submissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-body font-semibold transition-colors ${
            activeTab === 'refunds'
              ? 'border-brand-deep text-brand-deep'
              : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          <span>Refund Requests</span>
          {pendingRefCount > 0 ? (
            <span className="rounded-full bg-bad px-2 py-0.5 text-[0.75rem] font-bold text-white">
              {pendingRefCount}
            </span>
          ) : (
            <span className="rounded-full bg-mist px-2 py-0.5 text-[0.75rem] font-bold text-slate">
              {refunds.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ALL REGISTRATIONS */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <SearchInput value={q} onChange={setQ} placeholder="Search name, email, code, ticket..." />
              <SelectField
                label={<span className="sr-only">{a.masterclass}</span>}
                value={mc}
                onChange={(e) => setMc(e.target.value)}
                placeholder={`${a.masterclass}: ${d.common.all}`}
                options={(classes.data ?? []).map((m) => ({ value: m.id, label: l(m.title) }))}
                className="sm:w-64"
              />
            </div>
            <FilterPills
              label={a.payment}
              value={pay}
              onChange={setPay}
              options={[
                { value: 'all', label: d.common.all },
                ...PAYMENT.map((p) => ({ value: p, label: d.status[p] })),
              ]}
            />
          </div>

          {regs.loading || classes.loading ? (
            <LoadingBlock rows={5} />
          ) : regs.error || classes.error ? (
            <ErrorState
              onRetry={() => {
                regs.reload();
                classes.reload();
              }}
            />
          ) : (
            <DataTable<Registration>
              caption={a.title}
              rows={rows}
              rowKey={(r) => r.id}
              empty={
                <EmptyState
                  title={d.common.noResults}
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQ('');
                        setMc('');
                        setPay('all');
                      }}
                    >
                      {d.common.clearFilters}
                    </Button>
                  }
                />
              }
              columns={[
                {
                  key: 'n',
                  header: a.name,
                  cell: (r) => (
                    <div>
                      <p className="font-semibold text-ink">{r.name}</p>
                      <p className="tnum font-mono text-meta text-slate">{r.id}</p>
                      {r.ticketNumber && (
                        <p className="font-mono text-[0.6875rem] font-bold text-brand-deep">
                          Pass: {r.ticketNumber}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'b',
                  header: 'Business',
                  cell: (r) => (
                    <div>
                      <p className="font-medium text-ink">{r.businessName}</p>
                      <p className="text-meta text-slate">{r.email}</p>
                    </div>
                  ),
                  hideBelow: 'lg',
                },
                {
                  key: 'm',
                  header: a.masterclass,
                  cell: (r) => (
                    <div>
                      <p className="font-medium text-ink">{titleOf(r.masterclassId)}</p>
                      <p className="text-meta text-slate">{formatDate(r.createdAt)}</p>
                    </div>
                  ),
                  hideBelow: 'md',
                },
                {
                  key: 'r',
                  header: 'Registration',
                  cell: (r) => <StatusBadge status={r.status} />,
                },
                {
                  key: 'p',
                  header: 'Payment Status',
                  cell: (r) => (
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={r.paymentStatus} />
                      <span className="tnum text-[0.75rem] font-bold text-ink">
                        {formatMoney(r.amountPaid ?? r.amount)}
                      </span>
                    </div>
                  ),
                },
                {
                  key: 'x',
                  header: <span className="sr-only">{d.common.actions}</span>,
                  align: 'right',
                  cell: (r) => (
                    <div className="flex justify-end gap-1.5">
                      {r.ticketNumber && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Ticket className="h-3.5 w-3.5" />}
                          onClick={() => setTicketModalReg(r.id)}
                          aria-label="View Ticket"
                        >
                          Pass
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Settings2 className="h-3.5 w-3.5" />}
                        onClick={() => setManaging(r)}
                      >
                        Manage
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}

      {/* TAB 2: PAYMENT VERIFICATION QUEUE */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-body text-slate">
              Match the submitted Transaction ID and Sender Mobile with your bKash/Nagad/Bank
              statement. Approving will automatically confirm the seat and issue a digital ticket.
            </p>
            <Button size="sm" variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={fetchSubmissions}>
              Refresh Queue
            </Button>
          </div>

          {submissionsLoading ? (
            <LoadingBlock rows={4} />
          ) : !submissions.length ? (
            <EmptyState
              icon={<ShieldCheck className="h-8 w-8 text-ok" />}
              title="No Payment Submissions"
              body="No attendees have submitted manual payments for verification yet."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <table className="w-full text-left text-meta">
                <thead className="border-b border-line bg-paper/80 font-semibold text-slate">
                  <tr>
                    <th className="px-4 py-3">Attendee / Ref</th>
                    <th className="px-4 py-3">Masterclass</th>
                    <th className="px-4 py-3">Method & Sender</th>
                    <th className="px-4 py-3">TrxID & Amount</th>
                    <th className="px-4 py-3">Receipt</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {submissions.map((sub) => {
                    const isPending = sub.status === 'pending';
                    return (
                      <tr key={sub.id} className="hover:bg-paper/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-ink">{sub.attendeeName}</p>
                          <p className="tnum font-mono text-[0.75rem] text-slate">{sub.registrationCode}</p>
                          <p className="text-[0.75rem] text-slate">{sub.businessName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink truncate max-w-[180px]">{sub.masterclassTitle}</p>
                          <p className="text-[0.75rem] text-slate">{formatDate(sub.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-brand-soft px-2 py-0.5 font-bold uppercase text-brand-deep text-[0.6875rem]">
                            {sub.paymentMethod}
                          </span>
                          <p className="font-mono font-medium text-ink mt-1">{sub.senderAccount}</p>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <p className="font-bold text-ink">{sub.trxId}</p>
                          <p className="text-body font-bold text-ok">{formatMoney(sub.amount)}</p>
                        </td>
                        <td className="px-4 py-3">
                          {sub.receiptPath ? (
                            <button
                              type="button"
                              onClick={() => setPreviewReceiptUrl(sub.receiptPath!)}
                              className="inline-flex items-center gap-1 rounded bg-paper px-2 py-1 text-[0.75rem] font-semibold text-brand hover:underline"
                            >
                              <Eye className="h-3 w-3" /> View
                            </button>
                          ) : (
                            <span className="text-[0.75rem] text-slate">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold ${
                              sub.status === 'approved'
                                ? 'bg-ok-soft text-ok'
                                : sub.status === 'rejected'
                                ? 'bg-bad-soft text-bad'
                                : 'bg-warn-soft text-warn'
                            }`}
                          >
                            {sub.status === 'approved'
                              ? 'Approved'
                              : sub.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending Verification'}
                          </span>
                          {sub.rejectionReason && (
                            <p className="mt-1 text-[0.6875rem] text-bad max-w-[160px] truncate" title={sub.rejectionReason}>
                              {sub.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isPending ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleApproveSubmission(sub)}
                                loading={busy}
                                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-bad hover:bg-bad-soft"
                                onClick={() => setRejectSubModal(sub)}
                                icon={<XCircle className="h-3.5 w-3.5" />}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[0.75rem] text-slate">
                              Processed {sub.verifiedByName ? `by ${sub.verifiedByName}` : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REFUND REQUESTS */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-body text-slate">
              Review cancellation and refund requests from attendees. Approve to processing, then
              manually send payment and record the disbursement TrxID to complete.
            </p>
            <Button size="sm" variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={fetchRefunds}>
              Refresh Refunds
            </Button>
          </div>

          {refundsLoading ? (
            <LoadingBlock rows={4} />
          ) : !refunds.length ? (
            <EmptyState
              icon={<DollarSign className="h-8 w-8 text-slate" />}
              title="No Refund Requests"
              body="No attendees have requested a refund."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <table className="w-full text-left text-meta">
                <thead className="border-b border-line bg-paper/80 font-semibold text-slate">
                  <tr>
                    <th className="px-4 py-3">Requester / Ref</th>
                    <th className="px-4 py-3">Masterclass</th>
                    <th className="px-4 py-3">Amount Requested</th>
                    <th className="px-4 py-3">Disbursement Destination</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {refunds.map((refRecord) => {
                    const isPending = refRecord.status === 'pending';
                    const isProcessing = refRecord.status === 'processing';
                    return (
                      <tr key={refRecord.id} className="hover:bg-paper/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-ink">{refRecord.attendeeName}</p>
                          <p className="font-mono text-[0.75rem] text-slate">{refRecord.registrationCode}</p>
                          <p className="text-[0.75rem] text-slate">{refRecord.businessName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink truncate max-w-[160px]">{refRecord.masterclassTitle}</p>
                          <p className="text-[0.75rem] text-slate">{formatDate(refRecord.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-body font-bold text-ink">{formatMoney(refRecord.amount)}</p>
                          <p className="text-[0.6875rem] text-slate">
                            Paid: {formatMoney(refRecord.amountPaid)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-paper px-2 py-0.5 font-bold uppercase text-[0.6875rem]">
                            {refRecord.refundMethod}
                          </span>
                          <p className="font-mono font-medium text-ink mt-0.5">{refRecord.destinationAccount}</p>
                          {refRecord.accountHolderName && (
                            <p className="text-[0.6875rem] text-slate">{refRecord.accountHolderName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-[180px] text-[0.75rem] text-slate leading-relaxed truncate" title={refRecord.reason}>
                            {refRecord.reason}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold ${
                              refRecord.status === 'completed'
                                ? 'bg-ok-soft text-ok'
                                : refRecord.status === 'rejected'
                                ? 'bg-bad-soft text-bad'
                                : refRecord.status === 'processing'
                                ? 'bg-brand-soft text-brand-deep'
                                : 'bg-warn-soft text-warn'
                            }`}
                          >
                            {refRecord.status === 'completed'
                              ? 'Disbursed'
                              : refRecord.status === 'processing'
                              ? 'Processing'
                              : refRecord.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending Review'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {isPending || isProcessing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => setCompleteRefModal(refRecord)}
                                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                >
                                  Review & Refund
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-bad hover:bg-bad-soft"
                                  onClick={() => setRejectRefModal(refRecord)}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : refRecord.status === 'completed' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setCompleteRefModal(refRecord)}
                                icon={<Eye className="h-3.5 w-3.5" />}
                              >
                                View Record
                              </Button>
                            ) : (
                              <span className="text-[0.75rem] text-slate italic">
                                {refRecord.rejectionReason ? `Rejected: ${refRecord.rejectionReason}` : 'Rejected'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MANAGE REGISTRATION MODAL */}
      <Dialog
        open={!!managing}
        onClose={() => setManaging(null)}
        title={managing?.id ?? ''}
        description={managing ? `${managing.name} · ${titleOf(managing.masterclassId)}` : undefined}
        size="md"
      >
        {managing && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={managing.status} />
              <StatusBadge status={managing.paymentStatus} />
              {managing.ticketNumber && (
                <span className="font-mono text-meta font-bold text-brand-deep">
                  Pass: {managing.ticketNumber}
                </span>
              )}
            </div>

            {/* Attendance quick toggle */}
            <div>
              <p className="mb-2 text-meta font-semibold">Attendance Management</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={managing.status === 'attended'}
                  onClick={() => handleStatusChange(managing, 'attended')}
                >
                  Mark Attended
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={managing.status === 'no_show'}
                  onClick={() => handleStatusChange(managing, 'no_show')}
                >
                  Mark No-Show
                </Button>
              </div>
            </div>

            {/* Direct Refund & Seat Release */}
            {(managing.amountPaid || 0) > 0 && ((managing.amountPaid || 0) - (managing.amountRefunded || 0)) > 0 && (
              <div className="rounded-xl border border-brand/30 bg-brand-soft/20 p-4">
                <p className="text-meta font-bold text-brand-deep">Direct Refund & Seat Release</p>
                <p className="mt-1 text-meta text-slate">
                  Issue an immediate refund of {formatMoney((managing.amountPaid || 0) - (managing.amountRefunded || 0))} to this attendee and automatically release their seat.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setDirectRefundReg(managing);
                    setDirectRefundAmount((managing.amountPaid || 0) - (managing.amountRefunded || 0));
                    setDirectRefundReason('Masterclass session cancelled by organizer - seat released');
                    setDirectRefundMethod('bkash');
                    setDirectRefundDest('');
                    setDirectRefundTrx('');
                    setManaging(null);
                  }}
                >
                  Issue Direct Refund
                </Button>
              </div>
            )}

            {/* Admin Cancel Registration */}
            {managing.status !== 'cancelled' && (
              <div className="rounded-xl border border-bad/30 bg-bad-soft/30 p-4">
                <p className="text-meta font-bold text-bad">Cancel Registration & Release Seat</p>
                <p className="mt-1 text-meta text-slate">
                  This will cancel the attendee’s seat reservation and invalidate their digital ticket.
                </p>
                <Button
                  size="sm"
                  variant="danger"
                  className="mt-3"
                  onClick={() => {
                    setCancelModalReg(managing);
                    setManaging(null);
                  }}
                >
                  Cancel Registration
                </Button>
              </div>
            )}

            {/* Payment status manual correction */}
            <div className="flex flex-col gap-3 rounded-card bg-paper p-4">
              <p className="text-meta font-semibold">{t(a.correctTitle, { id: managing.id })}</p>
              <Notice tone="info">{a.correctBody}</Notice>
              <SelectField
                label={a.payment}
                value={correction.status}
                onChange={(e) =>
                  setCorrection((c) => ({ ...c, status: e.target.value as PaymentStatus }))
                }
                options={PAYMENT.map((p) => ({ value: p, label: d.status[p] }))}
              />
              <TextField
                label={a.reason}
                placeholder={a.reasonPlaceholder}
                value={correction.reason}
                onChange={(e) =>
                  setCorrection((c) => ({ ...c, reason: e.target.value, error: undefined }))
                }
                error={correction.error}
                required
              />
              <Button className="self-start" onClick={handlePaymentCorrection} loading={busy}>
                {a.apply}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ADMIN CANCEL CONFIRMATION MODAL */}
      <Dialog
        open={!!cancelModalReg}
        onClose={() => setCancelModalReg(null)}
        title="Confirm Administrative Cancellation"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModalReg(null)} disabled={busy}>
              Keep Registration
            </Button>
            <Button variant="danger" onClick={handleAdminCancel} loading={busy}>
              Confirm Cancellation
            </Button>
          </>
        }
      >
        {cancelModalReg && (
          <div className="space-y-4">
            <p className="text-body text-slate">
              Are you sure you want to cancel the registration for{' '}
              <strong>{cancelModalReg.name}</strong> ({cancelModalReg.id})?
            </p>
            <TextField
              label="Cancellation Reason (Required)"
              placeholder="e.g. Requested by user via phone / Seat duplicate"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </div>
        )}
      </Dialog>

      {/* DIRECT ADMIN REFUND & CANCEL MODAL */}
      <Dialog
        open={!!directRefundReg}
        onClose={() => !busy && setDirectRefundReg(null)}
        title="Process Direct Refund & Release Seat"
        description={directRefundReg ? `Issue an immediate refund and cancel registration for ${directRefundReg.name} (${directRefundReg.id}).` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDirectRefundReg(null)} disabled={busy}>
              Keep Seat
            </Button>
            <Button variant="danger" onClick={handleDirectRefund} loading={busy}>
              Confirm Refund & Release Seat
            </Button>
          </>
        }
      >
        {directRefundReg && (
          <div className="space-y-4">
            <div className="rounded-lg bg-paper p-3 text-meta">
              <p className="font-semibold text-ink">{directRefundReg.name}</p>
              <p className="text-slate">{directRefundReg.email} · {directRefundReg.businessName}</p>
              <p className="mt-1 font-mono font-bold text-brand-deep">
                Paid: {formatMoney(directRefundReg.amountPaid || 0)} · Refunded: {formatMoney(directRefundReg.amountRefunded || 0)}
              </p>
            </div>

            <div>
              <label className="block text-meta font-medium text-ink mb-1">Refund Amount (BDT) *</label>
              <input
                type="number"
                min="0"
                max={(directRefundReg.amountPaid || 0) - (directRefundReg.amountRefunded || 0)}
                step="0.01"
                value={directRefundAmount}
                onChange={(e) => setDirectRefundAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-meta font-medium text-ink mb-1">Refund Method</label>
              <select
                value={directRefundMethod}
                onChange={(e) => setDirectRefundMethod(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-brand focus:outline-none"
              >
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash / Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-meta font-medium text-ink mb-1">Destination Account / Mobile</label>
              <input
                type="text"
                placeholder="e.g. 017XXXXXXXX"
                value={directRefundDest}
                onChange={(e) => setDirectRefundDest(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-meta font-medium text-ink mb-1">Disbursement TrxID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. TRX123456"
                value={directRefundTrx}
                onChange={(e) => setDirectRefundTrx(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-meta font-medium text-ink mb-1">Reason for Refund *</label>
              <textarea
                rows={2}
                value={directRefundReason}
                onChange={(e) => setDirectRefundReason(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-brand focus:outline-none"
                required
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* REJECT SUBMISSION MODAL */}
      <Dialog
        open={!!rejectSubModal}
        onClose={() => setRejectSubModal(null)}
        title="Reject Payment Submission"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectSubModal(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRejectSubmission} loading={busy}>
              Reject Submission
            </Button>
          </>
        }
      >
        {rejectSubModal && (
          <div className="space-y-4">
            <p className="text-body text-slate">
              State the reason this submission is rejected. The attendee will see this message and be
              allowed to resubmit.
            </p>
            <TextField
              label="Rejection Reason"
              placeholder="e.g. Transaction ID not found on statement / Amount mismatch"
              value={rejectSubReason}
              onChange={(e) => setRejectSubReason(e.target.value)}
              required
            />
          </div>
        )}
      </Dialog>

      {/* REJECT REFUND MODAL */}
      <Dialog
        open={!!rejectRefModal}
        onClose={() => setRejectRefModal(null)}
        title="Reject Refund Request"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectRefModal(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRejectRefund} loading={busy}>
              Reject Refund
            </Button>
          </>
        }
      >
        {rejectRefModal && (
          <div className="space-y-4">
            <p className="text-body text-slate">
              Please enter the reason for rejecting this refund request.
            </p>
            <TextField
              label="Reason for Rejection"
              placeholder="e.g. Cancellation requested after the deadline"
              value={rejectRefReason}
              onChange={(e) => setRejectRefReason(e.target.value)}
              required
            />
          </div>
        )}
      </Dialog>

      {/* COMPLETE REFUND DISBURSEMENT MODAL */}
      <Dialog
        open={!!completeRefModal}
        onClose={() => setCompleteRefModal(null)}
        title={
          completeRefModal?.status === 'completed'
            ? 'Refund Disbursement Record (রিফান্ড বিবরণ)'
            : 'Review Refund & Confirm Disbursement (টাকা ফেরত নিশ্চিতকরণ)'
        }
        size="md"
        footer={
          completeRefModal?.status === 'completed' ? (
            <Button variant="secondary" onClick={() => setCompleteRefModal(null)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setCompleteRefModal(null)} disabled={busy}>
                Cancel
              </Button>
              <Button
                onClick={handleCompleteRefund}
                loading={busy}
                icon={<CheckCircle2 className="h-4 w-4" />}
                className="bg-ok hover:bg-ok/90 text-white"
              >
                Confirm Refund Sent (টাকা ফেরত নিশ্চিত করুন)
              </Button>
            </>
          )
        }
      >
        {completeRefModal && (
          <div className="space-y-4">
            {/* Attendee & Registration Information */}
            <div className="rounded-xl border border-line bg-paper/60 p-4">
              <h4 className="text-meta font-bold text-ink mb-3 uppercase tracking-wider">
                Attendee & Session Details (অংশগ্রহণকারীর তথ্য)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-meta">
                <div>
                  <span className="text-slate block text-[0.75rem]">Attendee Name</span>
                  <span className="font-semibold text-ink">{completeRefModal.attendeeName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate block text-[0.75rem]">Email Address</span>
                  <span className="font-medium text-ink">{completeRefModal.attendeeEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate block text-[0.75rem]">Business Name</span>
                  <span className="font-medium text-ink">{completeRefModal.businessName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate block text-[0.75rem]">Registration Code</span>
                  <span className="font-mono font-medium text-ink">{completeRefModal.registrationCode || completeRefModal.registrationId}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate block text-[0.75rem]">Masterclass Session</span>
                  <span className="font-semibold text-ink">{completeRefModal.masterclassTitle || 'Masterclass'}</span>
                </div>
                <div>
                  <span className="text-slate block text-[0.75rem]">Amount Paid</span>
                  <span className="font-semibold text-ink">{formatMoney(completeRefModal.amountPaid)}</span>
                </div>
                <div>
                  <span className="text-slate block text-[0.75rem]">Requested Refund Amount</span>
                  <span className="font-bold text-bad">{formatMoney(completeRefModal.amount)}</span>
                </div>
              </div>
            </div>

            {/* Refund Target Account Card (What admin needs to send money to) */}
            <div className="rounded-xl border-2 border-brand/30 bg-brand-soft/30 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-meta font-bold text-brand-deep uppercase tracking-wider">
                  Disbursement Destination (যেখানে টাকা পাঠাতে হবে)
                </span>
                <span className="rounded-md bg-brand text-white px-2 py-0.5 text-[0.6875rem] font-bold uppercase">
                  {completeRefModal.refundMethod}
                </span>
              </div>

              <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-line">
                <div>
                  <div className="text-[0.75rem] text-slate">Account / Mobile Number:</div>
                  <div className="font-mono text-lg font-bold text-ink tracking-wider">
                    {completeRefModal.destinationAccount}
                  </div>
                  {completeRefModal.accountHolderName && (
                    <div className="text-meta text-slate mt-0.5">
                      Account Name: <strong className="text-ink">{completeRefModal.accountHolderName}</strong>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Copy className="h-3.5 w-3.5" />}
                  onClick={() => copyToClipboard(completeRefModal.destinationAccount)}
                  className="sm:self-center"
                >
                  Copy Number
                </Button>
              </div>

              {/* User Reason */}
              <div className="mt-3 rounded-lg bg-surface/80 p-2.5 text-meta border border-line/60">
                <span className="font-semibold text-ink">User's Refund Reason:</span>
                <p className="mt-0.5 text-slate italic whitespace-pre-wrap">{completeRefModal.reason}</p>
              </div>
            </div>

            {/* Admin Input or Completed Record */}
            {completeRefModal.status === 'completed' ? (
              <div className="rounded-xl border border-ok/30 bg-ok-soft/30 p-3 text-meta">
                <p className="font-semibold text-ok flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Refund has been disbursed and confirmed.
                </p>
                {completeRefModal.providerRefundId && (
                  <p className="mt-1 text-slate">
                    <strong>Disbursement TrxID:</strong> {completeRefModal.providerRefundId}
                  </p>
                )}
                {completeRefModal.notes && (
                  <p className="mt-0.5 text-slate">
                    <strong>Notes:</strong> {completeRefModal.notes}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-mist/60 p-2.5 text-[0.75rem] text-slate">
                  💡 <strong>Admin নির্দেশিকা:</strong> অনুগ্রহ করে আপনার bKash / Nagad / Bank একাউন্ট থেকে উপরের নম্বরে <strong>{formatMoney(completeRefModal.amount)}</strong> টাকা ম্যানুয়ালি পাঠিয়ে দিন। টাকা পাঠানো শেষ হলে নিচের <strong>"Confirm Refund Sent"</strong> বাটনে চাপ দিন। সাথে সাথে ব্যবহারকারীর প্যানেলে রিফান্ড কমপ্লিট দেখাবে এবং সিট খালি হয়ে যাবে।
                </div>
                <TextField
                  label="Disbursement Transaction ID (ঐচ্ছিক)"
                  placeholder="e.g. bKash / Nagad TrxID or Bank Payout Ref"
                  value={disbursementTrxId}
                  onChange={(e) => setDisbursementTrxId(e.target.value)}
                />
                <TextField
                  label="Disbursement Notes (ঐচ্ছিক)"
                  placeholder="e.g. Sent via Fundly merchant wallet"
                  value={disbursementNotes}
                  onChange={(e) => setDisbursementNotes(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* RECEIPT PREVIEW LIGHTBOX */}
      {previewReceiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-xl bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-card font-bold text-ink">Payment Receipt</span>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="rounded-lg p-1 text-slate hover:bg-mist"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={previewReceiptUrl}
              alt="Payment Receipt"
              className="max-h-[75vh] w-auto rounded-lg object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* DIGITAL TICKET MODAL */}
      {ticketModalReg && (
        <TicketModal
          registrationId={ticketModalReg}
          open={!!ticketModalReg}
          onClose={() => setTicketModalReg(null)}
        />
      )}
    </div>
  );
}
