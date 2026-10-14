import { useState } from 'react';
import { AlertCircle, DollarSign, X } from 'lucide-react';
import type { Registration } from '@/types';
import { manualPaymentApi } from '@/services/api/manualPaymentApi';
import { ApiError } from '@/services/api/client';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';

interface RefundModalProps {
  registration: Registration;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RefundModal({ registration, open, onClose, onSuccess }: RefundModalProps) {
  const { formatMoney } = useI18n();
  const toast = useToast();
  const amountPaid = registration.amountPaid ?? registration.amount ?? 0;
  const amountRefunded = registration.amountRefunded ?? 0;
  const maxRefundable = Math.max(0, amountPaid - amountRefunded);

  const [amount, setAmount] = useState(maxRefundable.toString());
  const [refundMethod, setRefundMethod] = useState<'bkash' | 'nagad' | 'bank_transfer'>('bkash');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(registration.name || '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Please enter a valid refund amount.';
    } else if (numAmount > maxRefundable) {
      errs.amount = `Refund cannot exceed refundable balance (${formatMoney(maxRefundable)}).`;
    }

    if (!destinationAccount.trim()) {
      errs.destinationAccount = 'Destination account / mobile number is required.';
    } else if (
      (refundMethod === 'bkash' || refundMethod === 'nagad') &&
      !/^01[3-9]\d{8}$/.test(destinationAccount.trim().replace(/\D/g, ''))
    ) {
      errs.destinationAccount = 'Please enter a valid 11-digit Bangladeshi mobile number.';
    }

    if (!reason.trim()) {
      errs.reason = 'Please explain the reason for the cancellation or refund request.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      await manualPaymentApi.requestRefund(registration.id, {
        amount: parseFloat(amount),
        reason: reason.trim(),
        destinationAccount: destinationAccount.trim(),
        accountHolderName: accountHolderName.trim() || undefined,
        refundMethod,
        confirmAccurate: true,
        accuracyConfirmed: true,
      });

      toast('Refund request submitted successfully for administrative review.', 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.errors) {
        setErrors((prev) => ({ ...prev, ...err.errors }));
      }
      toast(err instanceof Error ? err.message : 'Failed to submit refund request.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warn-soft text-warn">
              <DollarSign className="h-4 w-4" />
            </span>
            <h3 className="text-card font-bold text-ink">Request Refund</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate hover:bg-mist hover:text-ink focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 rounded-xl border border-line bg-paper/60 p-3.5 text-meta">
            <div className="flex justify-between text-slate">
              <span>Registration ID:</span>
              <span className="font-mono font-bold text-ink">{registration.id}</span>
            </div>
            <div className="mt-1.5 flex justify-between text-slate">
              <span>Total Paid:</span>
              <span className="font-bold text-ink">{formatMoney(amountPaid)}</span>
            </div>
            <div className="mt-1.5 flex justify-between text-slate">
              <span>Max Refundable:</span>
              <span className="font-bold text-ok">{formatMoney(maxRefundable)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <TextField
              label="Refund Amount (BDT)"
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              required
            />

            <SelectField
              label="Refund Disbursement Method"
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value as 'bkash' | 'nagad' | 'bank_transfer')}
              options={[
                { value: 'bkash', label: 'bKash Mobile Wallet' },
                { value: 'nagad', label: 'Nagad Mobile Wallet' },
                { value: 'bank_transfer', label: 'Bank Account Transfer' },
              ]}
              required
            />

            <TextField
              label={
                refundMethod === 'bank_transfer'
                  ? 'Bank Account & Branch Details'
                  : `${refundMethod === 'bkash' ? 'bKash' : 'Nagad'} Mobile Number`
              }
              placeholder={refundMethod === 'bank_transfer' ? 'Account No, Bank Name, Branch' : '01XXXXXXXXX'}
              value={destinationAccount}
              onChange={(e) => setDestinationAccount(e.target.value)}
              error={errors.destinationAccount}
              required
            />

            <TextField
              label="Account Holder Name"
              placeholder="Full name as on account"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-meta font-medium text-ink">
                Reason for Refund / Cancellation <span className="text-bad">*</span>
              </label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-line bg-surface p-2.5 text-body transition-colors focus:border-brand focus:shadow-focus focus:outline-none"
                placeholder="Please state why you are requesting a refund or cancelling your seat..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {errors.reason && <p className="text-meta text-bad">{errors.reason}</p>}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-mist/50 p-3 text-meta text-slate">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-slate" />
              <span>
                Refund requests are reviewed by our finance desk. Once approved, funds are manually
                transferred to your specified account.
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" loading={busy}>
              Submit Refund Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
