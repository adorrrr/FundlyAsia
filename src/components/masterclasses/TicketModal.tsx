import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, MapPin, Printer, QrCode, X } from 'lucide-react';
import type { DigitalTicket } from '@/types';
import { manualPaymentApi } from '@/services/api/manualPaymentApi';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/Feedback';

interface TicketModalProps {
  registrationId?: string;
  ticket?: DigitalTicket | null;
  open: boolean;
  onClose: () => void;
}

export function TicketModal({ registrationId, ticket: initialTicket, open, onClose }: TicketModalProps) {
  const { l, formatDate, formatMoney } = useI18n();
  const [ticket, setTicket] = useState<DigitalTicket | null>(initialTicket || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialTicket) {
      setTicket(initialTicket);
      return;
    }
    if (!registrationId) return;

    setLoading(true);
    setError(null);
    manualPaymentApi
      .getTicket(registrationId)
      .then((t) => setTicket(t))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load digital ticket.');
      })
      .finally(() => setLoading(false));
  }, [open, registrationId, initialTicket]);

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm print:fixed print:inset-0 print:m-0 print:bg-white print:p-0"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-surface shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
        {/* Modal Header Controls (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
              <QrCode className="h-4 w-4" />
            </span>
            <span className="text-body font-bold text-ink">Fundly Digital Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              Print Ticket
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

        {/* Modal Body / Printable Pass Card */}
        <div className="p-6 print:p-8" id="fundly-printable-pass">
          {loading ? (
            <LoadingBlock rows={4} />
          ) : error || !ticket ? (
            <div className="py-8 text-center">
              <p className="text-body text-bad">{error || 'Ticket not available yet.'}</p>
              <Button size="sm" variant="secondary" onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm print:border-2 print:border-black">
              {/* Pass Header */}
              <div className="bg-brand-deep px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-meta font-bold uppercase tracking-wider text-brand-soft">
                      Fundly Masterclass Pass
                    </span>
                    <h2 className="mt-1 text-card font-bold leading-snug text-white">
                      {l(ticket.masterclass.title)}
                    </h2>
                  </div>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-meta font-bold uppercase tracking-wider text-white">
                    {ticket.status === 'valid'
                      ? 'Valid Entry'
                      : ticket.status === 'used'
                      ? 'Attended'
                      : 'Cancelled'}
                  </span>
                </div>
              </div>

              {/* Event Details Ribbon */}
              <div className="grid grid-cols-2 gap-3 border-b border-line bg-paper/60 px-6 py-3.5 text-meta text-slate sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-mark" />
                  <span>{formatDate(ticket.masterclass.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-mark" />
                  <span>
                    {ticket.masterclass.startTime} – {ticket.masterclass.endTime}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                  <MapPin className="h-4 w-4 text-brand-mark" />
                  <span className="truncate">{l(ticket.masterclass.venue)}</span>
                </div>
              </div>

              {/* Attendee & Pass Details */}
              <div className="p-6">
                <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-3">
                    <div>
                      <span className="text-meta text-slate">Attendee</span>
                      <p className="text-card font-bold text-ink">{ticket.attendee.name}</p>
                      <p className="text-meta text-slate">{ticket.attendee.businessName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-meta text-slate">Reg Reference</span>
                        <p className="tnum font-mono text-meta font-bold text-ink">
                          {ticket.attendee.registrationCode}
                        </p>
                      </div>
                      <div>
                        <span className="text-meta text-slate">Amount Paid</span>
                        <p className="tnum font-mono text-meta font-bold text-ok">
                          {formatMoney(ticket.attendee.amountPaid)}
                        </p>
                      </div>
                    </div>

                    {ticket.masterclass.speaker?.name && (
                      <div className="pt-1">
                        <span className="text-meta text-slate">Speaker</span>
                        <p className="text-meta font-semibold text-ink">
                          {ticket.masterclass.speaker.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* QR & Barcode Section */}
                  <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-mist/30 p-4 text-center">
                    {/* SVG QR Code Simulation */}
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-lg border border-line bg-white p-2 shadow-sm">
                      <svg
                        viewBox="0 0 100 100"
                        className="h-full w-full text-ink"
                        fill="currentColor"
                        shapeRendering="crispEdges"
                      >
                        {/* Finder pattern top-left */}
                        <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                        <rect x="5" y="5" width="20" height="20" fill="white" />
                        <rect x="10" y="10" width="10" height="10" fill="currentColor" />
                        {/* Finder pattern top-right */}
                        <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                        <rect x="75" y="5" width="20" height="20" fill="white" />
                        <rect x="80" y="10" width="10" height="10" fill="currentColor" />
                        {/* Finder pattern bottom-left */}
                        <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                        <rect x="5" y="75" width="20" height="20" fill="white" />
                        <rect x="10" y="80" width="10" height="10" fill="currentColor" />
                        {/* Random crisp QR matrix modules */}
                        <rect x="36" y="6" width="6" height="6" />
                        <rect x="48" y="6" width="6" height="6" />
                        <rect x="36" y="18" width="6" height="6" />
                        <rect x="6" y="36" width="6" height="6" />
                        <rect x="18" y="48" width="6" height="6" />
                        <rect x="36" y="36" width="12" height="12" />
                        <rect x="54" y="36" width="6" height="6" />
                        <rect x="42" y="54" width="6" height="6" />
                        <rect x="66" y="42" width="6" height="6" />
                        <rect x="54" y="54" width="12" height="12" />
                        <rect x="78" y="54" width="6" height="6" />
                        <rect x="36" y="72" width="6" height="6" />
                        <rect x="48" y="72" width="12" height="6" />
                        <rect x="66" y="72" width="6" height="12" />
                        <rect x="78" y="78" width="12" height="6" />
                        <rect x="48" y="84" width="6" height="12" />
                      </svg>
                    </div>

                    <p className="mt-2.5 font-mono text-[0.75rem] font-bold tracking-wider text-ink">
                      {ticket.ticketNumber}
                    </p>
                    <span className="mt-0.5 text-[0.6875rem] text-slate">
                      Scan at venue check-in
                    </span>
                  </div>
                </div>

                {/* Verification Notice */}
                <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-ok/20 bg-ok-soft/30 p-3 text-meta text-slate">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-ok" />
                  <span>
                    This digital ticket is verified by Fundly Administration. Present this pass on
                    your phone or as a printout at the reception desk.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Hidden on Print) */}
        <div className="flex justify-end border-t border-line bg-paper/40 px-6 py-4 print:hidden">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
