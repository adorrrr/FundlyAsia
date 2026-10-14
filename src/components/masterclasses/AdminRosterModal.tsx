import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  QrCode,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import type { Masterclass, RosterAttendee } from '@/types';
import { manualPaymentApi } from '@/services/api/manualPaymentApi';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { LoadingBlock } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv } from '@/utils/csv';

interface AdminRosterModalProps {
  masterclass: Masterclass;
  open: boolean;
  onClose: () => void;
}

export function AdminRosterModal({ masterclass, open, onClose }: AdminRosterModalProps) {
  const { l, formatDate, formatMoney } = useI18n();
  const toast = useToast();
  const [roster, setRoster] = useState<RosterAttendee[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attended' | 'unmarked' | 'no_show'>('all');
  const [scanTicket, setScanTicket] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Direct Refund Modal State
  const [refundAttendee, setRefundAttendee] = useState<RosterAttendee | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('Masterclass session cancelled by organizer');
  const [refundMethod, setRefundMethod] = useState<string>('bkash');
  const [refundDest, setRefundDest] = useState<string>('');
  const [refundTrx, setRefundTrx] = useState<string>('');
  const [refundBusy, setRefundBusy] = useState(false);

  const openRefundModal = (att: RosterAttendee) => {
    setRefundAttendee(att);
    setRefundAmount(att.amountPaid);
    setRefundReason('Masterclass session cancelled by organizer - seat released');
    setRefundMethod('bkash');
    setRefundDest('');
    setRefundTrx('');
  };

  const handleProcessRefund = async () => {
    if (!refundAttendee) return;
    if (!refundReason.trim()) {
      toast('A refund reason is required.', 'error');
      return;
    }
    setRefundBusy(true);
    try {
      await manualPaymentApi.directRefund(refundAttendee.id, {
        amount: Number(refundAmount) || 0,
        reason: refundReason.trim(),
        destinationAccount: refundDest.trim() || undefined,
        refundMethod,
        trxId: refundTrx.trim() || undefined,
      });
      toast(`Refund completed for ${refundAttendee.name}. Seat released!`, 'success');
      setRefundAttendee(null);
      fetchRoster();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Refund failed.', 'error');
    } finally {
      setRefundBusy(false);
    }
  };

  const fetchRoster = useCallback(() => {
    setLoading(true);
    manualPaymentApi
      .getMasterclassRoster(masterclass.id)
      .then((data) => setRoster(data))
      .catch((err) => {
        toast(err instanceof Error ? err.message : 'Failed to load attendee roster.', 'error');
      })
      .finally(() => setLoading(false));
  }, [masterclass.id, toast]);

  useEffect(() => {
    if (open) {
      fetchRoster();
      setSearch('');
      setScanTicket('');
    }
  }, [open, fetchRoster]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roster.filter((att) => {
      const matchSearch =
        !q ||
        [att.name, att.email, att.businessName, att.code, att.ticketNumber || '']
          .some((val) => val.toLowerCase().includes(q));
      const matchStatus =
        statusFilter === 'all' || att.attendanceStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [roster, search, statusFilter]);

  const attendedCount = roster.filter((x) => x.attendanceStatus === 'attended').length;

  const handleTicketCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = scanTicket.trim();
    if (!t) return;

    setScanBusy(true);
    try {
      const res = await manualPaymentApi.checkInAttendee(masterclass.id, t);
      toast(res.message, res.status === 'already_checked_in' ? 'info' : 'success');
      setScanTicket('');
      fetchRoster();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Check-in failed.', 'error');
    } finally {
      setScanBusy(false);
    }
  };

  const handleRowCheckIn = async (att: RosterAttendee) => {
    if (!att.ticketNumber) {
      toast('Attendee has no active digital ticket.', 'error');
      return;
    }
    setActionBusy(att.id);
    try {
      const res = await manualPaymentApi.checkInAttendee(masterclass.id, att.ticketNumber);
      toast(res.message, 'success');
      fetchRoster();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Check-in failed.', 'error');
    } finally {
      setActionBusy(null);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      `fundly-roster-${masterclass.slug || masterclass.id}.csv`,
      roster.map((att) => ({
        ticket_number: att.ticketNumber || '',
        registration_code: att.code,
        name: att.name,
        email: att.email,
        business: att.businessName,
        industry: att.industry,
        payment_status: att.paymentStatus,
        attendance_status: att.attendanceStatus,
        amount_paid: att.amountPaid,
        checked_in_at: att.checkedInAt || '',
        registered_at: att.createdAt,
      }))
    );
    toast('Attendee roster exported successfully.', 'info');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
                <Users className="h-4 w-4" />
              </span>
              <h2 className="truncate text-card font-bold text-ink">
                Attendee Roster: {l(masterclass.title)}
              </h2>
            </div>
            <p className="tnum mt-1 text-meta text-slate">
              {formatDate(masterclass.date)} · {masterclass.startTime} – {masterclass.endTime} ·{' '}
              {roster.length} registered · {attendedCount} checked-in
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportCsv}
              disabled={!roster.length}
            >
              Export CSV
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate hover:bg-mist hover:text-ink focus:outline-none"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Ticket Scanner / Check-in input bar */}
        <div className="border-b border-line bg-paper/50 px-6 py-3">
          <form onSubmit={handleTicketCheckIn} className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate" />
              <input
                type="text"
                placeholder="Scan or type digital ticket number (e.g. TICK-2026-...) to check in"
                value={scanTicket}
                onChange={(e) => setScanTicket(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-body font-mono text-ink placeholder:text-slate focus:border-brand focus:shadow-focus focus:outline-none"
              />
            </div>
            <Button type="submit" loading={scanBusy} disabled={!scanTicket.trim()} className="flex-none">
              Check In
            </Button>
          </form>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 border-b border-line px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate" />
            <input
              type="text"
              placeholder="Search by name, email, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-line bg-surface py-1.5 pl-9 pr-3 text-meta text-ink placeholder:text-slate focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto text-meta">
            <span className="text-slate">Filter:</span>
            {(['all', 'unmarked', 'attended', 'no_show'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-brand-deep text-white'
                    : 'bg-mist/80 text-slate hover:bg-mist hover:text-ink'
                }`}
              >
                {st === 'all'
                  ? 'All'
                  : st === 'attended'
                  ? 'Attended'
                  : st === 'unmarked'
                  ? 'Pending Arrival'
                  : 'No-Show'}
              </button>
            ))}
          </div>
        </div>

        {/* Roster Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <LoadingBlock rows={4} />
          ) : !filtered.length ? (
            <div className="py-12 text-center text-slate">
              <Users className="mx-auto h-8 w-8 text-slate/50" />
              <p className="mt-2 text-body font-medium">No attendees found</p>
              <p className="text-meta">Try adjusting your search or status filter.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-meta">
                <thead className="border-b border-line bg-paper/80 font-semibold text-slate">
                  <tr>
                    <th className="px-4 py-3">Attendee</th>
                    <th className="px-4 py-3">Ticket / Ref</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {filtered.map((att) => (
                    <tr key={att.id} className="hover:bg-paper/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{att.name}</p>
                        <p className="text-[0.75rem] text-slate">
                          {att.businessName} · {att.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[0.8125rem]">
                        <p className="font-bold text-ink">{att.ticketNumber || '—'}</p>
                        <p className="text-[0.75rem] text-slate">{att.code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
                            att.paymentStatus === 'paid'
                              ? 'bg-ok-soft text-ok'
                              : 'bg-warn-soft text-warn'
                          }`}
                        >
                          {att.paymentStatus} · {formatMoney(att.amountPaid)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium ${
                            att.attendanceStatus === 'attended'
                              ? 'bg-ok-soft text-ok'
                              : att.attendanceStatus === 'no_show'
                              ? 'bg-bad-soft text-bad'
                              : 'bg-mist text-slate'
                          }`}
                        >
                          {att.attendanceStatus === 'attended' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Attended
                            </>
                          ) : att.attendanceStatus === 'no_show' ? (
                            <>
                              <UserX className="h-3 w-3" /> No-Show
                            </>
                          ) : (
                            'Unmarked'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {att.attendanceStatus !== 'attended' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<UserCheck className="h-3.5 w-3.5" />}
                              onClick={() => handleRowCheckIn(att)}
                              loading={actionBusy === att.id}
                              disabled={!att.ticketNumber}
                            >
                              Check In
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-bad hover:bg-bad-soft"
                            onClick={() => openRefundModal(att)}
                          >
                            Refund & Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-line bg-paper/40 px-6 py-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Direct Refund & Seat Release Modal */}
      {refundAttendee && (
        <Dialog
          open={!!refundAttendee}
          onClose={() => !refundBusy && setRefundAttendee(null)}
          title="Process Refund & Release Seat"
          description={`Issue a refund and cancel seat reservation for ${refundAttendee.name}.`}
          size="sm"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setRefundAttendee(null)}
                disabled={refundBusy}
              >
                Keep Seat
              </Button>
              <Button
                variant="danger"
                onClick={handleProcessRefund}
                loading={refundBusy}
              >
                Confirm Refund & Release Seat
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-paper p-3 text-meta">
              <p className="font-semibold text-ink">{refundAttendee.name}</p>
              <p className="text-slate">{refundAttendee.email} · {refundAttendee.businessName}</p>
              <p className="mt-1 font-mono font-bold text-brand-deep">
                Paid: {formatMoney(refundAttendee.amountPaid)}
              </p>
            </div>

            <div>
              <label className="block text-meta font-medium text-ink mb-1">Refund Amount (BDT)</label>
              <input
                type="number"
                min="0"
                max={refundAttendee.amountPaid}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-meta font-medium text-ink mb-1">Refund Method</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
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
                value={refundDest}
                onChange={(e) => setRefundDest(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-meta font-medium text-ink mb-1">Disbursement TrxID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. TRX123456"
                value={refundTrx}
                onChange={(e) => setRefundTrx(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-meta font-medium text-ink mb-1">Reason for Refund *</label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-meta text-ink focus:border-brand focus:outline-none"
                required
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
