import { useEffect, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  ShieldCheck,
  Ticket,
  UploadCloud,
  X,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationService } from '@/services';
import { manualPaymentApi } from '@/services/api/manualPaymentApi';
import type { PaymentMethod, Registration } from '@/types';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SelectField, TextField } from '@/components/ui/Field';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { TicketModal } from '@/components/masterclasses/TicketModal';

export default function PaymentPage() {
  const { id = '' } = useParams();
  const { d, l, formatDate, formatMoney } = useI18n();
  const toast = useToast();
  useDocumentTitle('Masterclass Payment');

  const reg = useAsync(() => registrationService.get(id), [id]);
  const mc = useAsync(
    async () => (reg.data ? masterclassService.get(reg.data.masterclassId) : undefined),
    [reg.data?.masterclassId]
  );

  const [current, setCurrent] = useState<Registration>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [senderAccount, setSenderAccount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!reg.data) return;
    setCurrent(reg.data);
    setAmount(reg.data.amount.toString());
  }, [reg.data]);

  if (reg.loading || mc.loading) return <LoadingBlock rows={3} />;
  if (!reg.data || !current || !mc.data) {
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

  const m = mc.data;
  if (current.paymentStatus === 'not_required') {
    return <Navigate to={`/masterclasses/${m.id}/confirmation?reg=${current.id}`} replace />;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast('Receipt image must be smaller than 4 MB.', 'error');
      return;
    }

    setUploadingReceipt(true);
    try {
      const res = await manualPaymentApi.uploadReceipt(file);
      setReceiptPath(res.url);
      toast('Receipt uploaded successfully.', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Receipt upload failed.', 'error');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!senderAccount.trim()) {
      errs.senderAccount = 'Sender account or mobile number is required.';
    } else if (
      (paymentMethod === 'bkash' || paymentMethod === 'nagad') &&
      !/^01[3-9]\d{8}$/.test(senderAccount.trim().replace(/\D/g, ''))
    ) {
      errs.senderAccount = 'Please enter a valid 11-digit Bangladeshi mobile number.';
    }

    if (!trxId.trim()) {
      errs.trxId = 'Transaction ID is required.';
    } else if (trxId.trim().length < 5) {
      errs.trxId = 'Please enter a valid Transaction ID.';
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || Math.abs(numAmount - current.amount) > 0.01) {
      errs.amount = `Submitted amount must equal payable fee (${formatMoney(current.amount)}).`;
    }

    if (!confirmAccurate) {
      errs.confirm = 'Please confirm that the submitted information is accurate.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await manualPaymentApi.submitPayment(current.id, {
        paymentMethod,
        senderAccount: senderAccount.trim(),
        trxId: trxId.trim().toUpperCase(),
        amount: parseFloat(amount),
        receiptPath: receiptPath || undefined,
        confirmAccurate: true,
      });

      setSubmittedSuccess(true);
      toast('Payment details submitted for verification.', 'success');
      const updated = await registrationService.get(current.id);
      setCurrent(updated);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isPendingVerification =
    submittedSuccess || current.paymentStatus === 'pending_verification';
  const isPaid = current.paymentStatus === 'paid';
  const isFailed = current.paymentStatus === 'failed';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: `/registrations/${current.id}`, label: 'Back to Registration' }}
        title="Masterclass Payment"
        body="Scan Bangla QR using bKash, Nagad or your banking app, then submit your transaction details below."
      />

      {/* Main Container */}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-float">
        {/* Session & Fee Header */}
        <div className="border-b border-line bg-paper/60 p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="text-meta font-bold uppercase tracking-wider text-brand-deep">
                Masterclass Registration
              </span>
              <h2 className="mt-1 text-card font-bold text-ink">{l(m.title)}</h2>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-slate">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-brand-mark" />
                  {formatDate(m.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-brand-mark" />
                  {m.startTime} – {m.endTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-mark" />
                  {l(m.venue)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4 text-left sm:text-right">
              <span className="text-meta font-medium text-slate">Total Payable</span>
              <p className="tnum text-2xl font-bold leading-tight text-ink">
                {formatMoney(current.amount)}
              </p>
              <p className="mt-0.5 font-mono text-[0.75rem] text-slate">Ref: {current.id}</p>
            </div>
          </div>
        </div>

        {/* State Views */}
        <div className="p-6 sm:p-8">
          {/* 1. Already Paid State */}
          {isPaid && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft text-ok">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h3 className="mt-4 text-section font-bold text-ink">Payment Verified & Confirmed</h3>
              <p className="mt-2 max-w-md text-body text-slate">
                Your payment of {formatMoney(current.amount)} has been approved by Fundly
                Administration. Your digital ticket is ready.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  icon={<Ticket className="h-4 w-4" />}
                  onClick={() => setTicketModalOpen(true)}
                >
                  View Digital Ticket
                </Button>
                <Button variant="secondary" to="/my-registrations">
                  My Registrations
                </Button>
              </div>
            </div>
          )}

          {/* 2. Pending Verification State */}
          {isPendingVerification && !isPaid && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warn-soft text-warn">
                <ShieldCheck className="h-9 w-9" />
              </div>
              <h3 className="mt-4 text-section font-bold text-ink">Payment Under Review</h3>
              <p className="mt-2 max-w-md text-body text-slate">
                Your transaction details have been submitted. Our finance desk is verifying the
                deposit against our merchant statement.
              </p>
              <div className="mt-4 rounded-xl border border-line bg-paper/70 p-4 text-meta text-slate sm:w-80">
                <div className="flex justify-between">
                  <span>Registration Ref:</span>
                  <span className="font-mono font-bold text-ink">{current.id}</span>
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold text-ink">{formatMoney(current.amount)}</span>
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span>Estimated Time:</span>
                  <span className="font-medium text-ink">15 – 30 minutes</span>
                </div>
              </div>
              <p className="mt-4 text-meta text-slate">
                You will be notified once verified, and your digital entry pass will appear in{' '}
                <Link to="/my-registrations" className="font-semibold text-brand underline">
                  My Registrations
                </Link>
                .
              </p>
              <div className="mt-6">
                <Button to="/my-registrations" variant="secondary">
                  Go to My Registrations
                </Button>
              </div>
            </div>
          )}

          {/* 3. Payment Flow (Form & Bangla QR) */}
          {!isPaid && !isPendingVerification && (
            <div className="space-y-8">
              {/* Previous Rejection Alert */}
              {isFailed && (
                <Notice
                  tone="warn"
                  title="Previous Payment Submission Rejected"
                >
                  {current.latestSubmission?.rejectionReason
                    ? `Reason: ${current.latestSubmission.rejectionReason}`
                    : 'The transaction ID or account could not be verified on our bank statement. Please verify your receipt and resubmit the correct transaction ID below.'}
                </Notice>
              )}

              {/* Bangla QR Presentation & Instructions */}
              <div className="grid gap-6 rounded-2xl border border-line bg-paper/40 p-5 sm:grid-cols-[220px_1fr] sm:p-6">
                {/* Official Bangla QR Code Image (Aspect-Ratio Preserved) */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-white p-3 shadow-sm">
                  <img
                    src="/bangla-qr.jpg"
                    alt="Official Bangladesh QR Payment Code"
                    className="h-auto max-h-56 w-full max-w-[200px] object-contain"
                  />
                  <span className="mt-2 text-center text-[0.6875rem] font-bold uppercase tracking-wider text-slate">
                    National Bangla QR Standard
                  </span>
                </div>

                {/* Instructions & Accounts */}
                <div className="flex flex-col justify-center space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-brand-deep px-2 py-0.5 text-[0.6875rem] font-bold uppercase text-white">
                      Step 1
                    </span>
                    <h3 className="text-body font-bold text-ink">Scan & Pay via Any App</h3>
                  </div>

                  <p className="text-meta leading-relaxed text-slate">
                    Scan the QR above using <strong>bKash, Nagad, Upay, Cellfin</strong> or any
                    Bangla QR compatible bank app, or transfer manually to our merchant numbers:
                  </p>

                  <div className="grid gap-2 text-meta sm:grid-cols-2">
                    <div className="rounded-lg border border-line bg-surface p-2.5">
                      <span className="text-[0.6875rem] font-semibold text-slate">
                        bKash Merchant (Payment)
                      </span>
                      <p className="font-mono font-bold text-ink">01711-000000</p>
                    </div>
                    <div className="rounded-lg border border-line bg-surface p-2.5">
                      <span className="text-[0.6875rem] font-semibold text-slate">
                        Nagad Merchant (Payment)
                      </span>
                      <p className="font-mono font-bold text-ink">01811-000000</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-mist/60 p-2.5 text-meta text-slate">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-brand-deep" />
                    <span>
                      Enter Reference: <strong>{current.id}</strong> when submitting payment in your
                      app.
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Submission Form */}
              <form onSubmit={handleSubmitTransaction} className="space-y-5">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <span className="rounded bg-brand-deep px-2 py-0.5 text-[0.6875rem] font-bold uppercase text-white">
                    Step 2
                  </span>
                  <h3 className="text-body font-bold text-ink">
                    Submit Transaction Verification Details
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    options={[
                      { value: 'bkash', label: 'bKash Mobile Wallet' },
                      { value: 'nagad', label: 'Nagad Mobile Wallet' },
                      { value: 'bank_transfer', label: 'Bank Account Transfer' },
                      { value: 'other', label: 'Other Bangla QR Provider' },
                    ]}
                    required
                  />

                  <TextField
                    label={
                      paymentMethod === 'bank_transfer'
                        ? 'Sender Account Number / Bank'
                        : `${paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Sender'} Mobile Number`
                    }
                    placeholder={
                      paymentMethod === 'bank_transfer'
                        ? 'e.g. City Bank 123456789'
                        : '01XXXXXXXXX'
                    }
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    error={errors.senderAccount}
                    required
                  />

                  <TextField
                    label="Transaction ID (TrxID)"
                    placeholder="e.g. BL7A9X2M1K"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    error={errors.trxId}
                    required
                  />

                  <TextField
                    label="Amount Paid (BDT)"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    error={errors.amount}
                    required
                  />
                </div>

                {/* Receipt Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-meta font-medium text-ink">
                    Payment Receipt / Screenshot (Optional, Recommended)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line bg-paper/60 px-4 py-3 text-meta text-slate hover:border-brand hover:bg-paper">
                      <UploadCloud className="h-4 w-4 text-brand-mark" />
                      <span>{uploadingReceipt ? 'Uploading...' : 'Upload receipt (JPG, PNG, PDF)'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadingReceipt}
                      />
                    </label>

                    {receiptPath && (
                      <div className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-1.5 text-meta font-medium text-ok">
                        <FileText className="h-4 w-4" />
                        <span>Receipt attached</span>
                        <button
                          type="button"
                          onClick={() => setReceiptPath(null)}
                          className="text-slate hover:text-bad"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accuracy Confirmation Checkbox */}
                <div className="pt-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper/40 p-3.5">
                    <input
                      type="checkbox"
                      checked={confirmAccurate}
                      onChange={(e) => setConfirmAccurate(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand"
                    />
                    <span className="text-meta text-slate">
                      I confirm that I have sent <strong>{formatMoney(current.amount)}</strong> to
                      Fundly’s designated account and the Transaction ID provided is accurate.
                    </span>
                  </label>
                  {errors.confirm && <p className="mt-1 text-meta text-bad">{errors.confirm}</p>}
                </div>

                {/* Submit Action */}
                <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-end">
                  <Button variant="secondary" to={`/registrations/${current.id}`} type="button">
                    Cancel
                  </Button>
                  <Button size="lg" type="submit" loading={submitting}>
                    Submit Payment for Verification
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Digital Ticket Modal */}
      <TicketModal
        registrationId={current.id}
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
      />
    </div>
  );
}
