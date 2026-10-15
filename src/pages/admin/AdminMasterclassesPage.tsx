import { useEffect, useMemo, useState } from 'react';
import { Archive, ArrowLeft, Pencil, Plus, RotateCcw, Users } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationService } from '@/services';
import type { Masterclass, MasterclassStatus } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { FilterPills, SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, LoadingBlock } from '@/components/ui/Feedback';
import { MasterclassCover } from '@/components/masterclasses/MasterclassCover';
import { AdminRosterModal } from '@/components/masterclasses/AdminRosterModal';
import { StatTile } from '@/components/admin/BarList';
import { useToast } from '@/components/ui/Toast';
import { notifyMasterclassesChanged, onMasterclassesChanged } from '@/services/api/manualPaymentApi';

export const MC_STATUSES: MasterclassStatus[] = ['registration_open', 'registration_closed', 'completed', 'cancelled'];

export default function AdminMasterclassesPage() {
  const { d, l, formatDate, formatMoney, formatNumber } = useI18n();
  const a = d.admin.mc;
  useDocumentTitle(a.title);
  const toast = useToast();
  const { data, loading, reload, setData } = useAsync(() => masterclassService.listAll(), []);
  const regs = useAsync(() => registrationService.listAll(), []);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | MasterclassStatus>('all');
  const [showingArchived, setShowingArchived] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState<string | null>(null);

  // React instantly to updates from other tabs or modals
  useEffect(() => {
    return onMasterclassesChanged(() => {
      reload();
      regs.reload();
    });
  }, [reload, regs]);

  const rows = useMemo(() => {
    const query = q.toLowerCase();
    return (data ?? []).filter((m) => Boolean(m.archived) === showingArchived && (status === 'all' || m.status === status) && (!query || [m.title.en, m.title.bn, m.topic.en].some((s) => s.toLowerCase().includes(query))));
  }, [data, q, showingArchived, status]);

  const stats = useMemo(() => {
    const allRegs = regs.data ?? [];
    const targetMcIds = new Set((rows ?? []).map((m) => m.id));
    const targetRegs = allRegs.filter((r) => targetMcIds.has(r.masterclassId));

    const totalEnroll = targetRegs.length;
    const activeEnroll = targetRegs.filter((r) => r.status !== 'cancelled').length;

    let totalPrice = 0;
    let totalRefund = 0;
    let refundCount = 0;

    for (const r of targetRegs) {
      const paid = Number(
        r.amountPaid != null
          ? r.amountPaid
          : (r.paymentStatus === 'paid' || r.paymentStatus === 'refunded' || r.paymentStatus === 'partially_refunded' ? r.amount : 0)
      );
      totalPrice += paid;

      const ref = Number(
        r.amountRefunded != null && r.amountRefunded > 0
          ? r.amountRefunded
          : (r.paymentStatus === 'refunded' ? (r.amountPaid ?? r.amount) : 0)
      );
      totalRefund += ref;
      if (r.paymentStatus === 'refunded' || r.paymentStatus === 'partially_refunded' || ref > 0) {
        refundCount++;
      }
    }

    return { totalEnroll, activeEnroll, totalPrice, totalRefund, refundCount };
  }, [regs.data, rows]);

  const [rosterMc, setRosterMc] = useState<Masterclass | null>(null);

  const toggleArchived = async (masterclass: Masterclass) => {
    if (archiveBusy) return;
    const archived = !masterclass.archived;
    setArchiveBusy(masterclass.id);
    setData((prev) => prev?.map((item) => (item.id === masterclass.id ? { ...item, archived } : item)));
    try {
      await masterclassService.setArchived(masterclass.id, archived);
      toast(archived ? a.archivedSuccess : a.restoredSuccess);
      notifyMasterclassesChanged();
    } catch (err: unknown) {
      setData((prev) => prev?.map((item) => (item.id === masterclass.id ? { ...item, archived: masterclass.archived } : item)));
      toast(err instanceof Error ? err.message : a.archiveFailed, 'error');
    } finally {
      setArchiveBusy(null);
    }
  };

  const changeStatus = async (m: Masterclass, s: MasterclassStatus) => {
    const oldStatus = m.status;
    setData((prev) => prev?.map((item) => (item.id === m.id ? { ...item, status: s } : item)));
    try {
      await masterclassService.setStatus(m.id, s);
      toast(s === 'cancelled' ? 'Masterclass session marked as Cancelled. Registrations closed.' : a.updated);
      notifyMasterclassesChanged();
      reload();
    } catch (err: unknown) {
      setData((prev) => prev?.map((item) => (item.id === m.id ? { ...item, status: oldStatus } : item)));
      toast(err instanceof Error ? err.message : d.common.errorTitle, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title={showingArchived ? a.archivedTitle : a.title}
        body={a.body}
        actions={
          <>
            <Button
              variant="secondary"
              icon={showingArchived ? <ArrowLeft className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              onClick={() => setShowingArchived((current) => !current)}
              aria-pressed={showingArchived}
            >
              {showingArchived ? a.activeSessions : a.archivedSessions}
            </Button>
            {!showingArchived && <Button to="/admin/masterclasses/create" icon={<Plus className="h-4 w-4" />}>{a.create}</Button>}
          </>
        }
      />
      {/* 4 Overview Stat Tiles: Session Total Enroll, Total Price, Total Refund, Current Total Amount */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <StatTile
          label={l({ en: 'Session Total Enroll', bn: 'সেশন মোট এনরোল' })}
          value={formatNumber(stats.totalEnroll)}
          note={
            stats.activeEnroll !== stats.totalEnroll
              ? `${formatNumber(stats.activeEnroll)} ${l({ en: 'active enrollees', bn: 'সক্রিয় এনরোলমেন্ট' })}`
              : `${formatNumber(stats.totalEnroll)} ${l({ en: 'total enrollees', bn: 'মোট নিবন্ধিত' })}`
          }
        />
        <StatTile
          label={l({ en: 'Total Price', bn: 'মোট প্রাইস' })}
          value={formatMoney(stats.totalPrice)}
          note={l({ en: 'Gross collections', bn: 'মোট সংগৃহীত ফি' })}
        />
        <StatTile
          label={l({ en: 'Total Refund', bn: 'মোট রিফান্ড' })}
          value={formatMoney(stats.totalRefund)}
          note={
            stats.refundCount > 0
              ? `${formatNumber(stats.refundCount)} ${l({ en: 'refunded registrations', bn: 'টি রিফান্ড সম্পন্ন' })}`
              : l({ en: 'No refunds issued', bn: 'কোনো রিফান্ড নেই' })
          }
        />
        <StatTile
          label={l({ en: 'Current Total Amount', bn: 'বর্তমান মোট অ্যামাউন্ট' })}
          value={formatMoney(Math.max(0, stats.totalPrice - stats.totalRefund))}
          note={l({ en: 'Net after refunds', bn: 'রিফান্ড পরবর্তী মোট জমা' })}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput value={q} onChange={setQ} placeholder={a.search} />
        <FilterPills label={d.common.status} value={status} onChange={setStatus} options={[{ value: 'all', label: d.common.all }, ...MC_STATUSES.map((s) => ({ value: s, label: d.status[s] }))]} />
      </div>
      {loading || regs.loading ? (
        <LoadingBlock rows={4} />
      ) : (
        <DataTable<Masterclass>
          caption={a.title}
          rows={rows}
          rowKey={(m) => m.id}
          empty={
            <EmptyState
              title={showingArchived ? a.archivedEmpty : data?.some((m) => !m.archived) ? d.common.noResults : a.empty}
              body={showingArchived ? undefined : data?.some((m) => !m.archived) ? undefined : a.emptyBody}
              action={!showingArchived && <Button to="/admin/masterclasses/create">{a.create}</Button>}
            />
          }
          columns={[
            {
              key: 't',
              header: d.admin.regs.masterclass,
              cell: (m) => (
                <div className="flex items-center gap-3">
                  <MasterclassCover m={m} size="sm" decorative sizes="72px" className="hidden h-10 w-[72px] flex-none rounded-md sm:block" />
                  <div className="min-w-0">
                    <p className="font-semibold">{l(m.title)}</p>
                    <p className="text-meta text-slate">{l(m.topic)}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'd',
              header: d.mc.date,
              cell: (m) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-ink">{formatDate(m.date)}</span>
                  {m.startTime && m.endTime && (
                    <span className="text-[0.75rem] text-slate">
                      {m.startTime} – {m.endTime}
                    </span>
                  )}
                </div>
              ),
              hideBelow: 'md',
            },
            {
              key: 'r',
              header: a.registrations,
              cell: (m) => {
                const activeCount = (regs.data ?? []).filter((r) => r.masterclassId === m.id && r.status !== 'cancelled').length;
                const isFull = activeCount >= m.capacity;
                return (
                  <div className="flex flex-col gap-0.5">
                    <span className="tnum font-bold text-ink">
                      {formatNumber(activeCount)} / {formatNumber(m.capacity)} seats
                    </span>
                    <span className={`text-[0.6875rem] font-medium ${isFull ? 'text-bad' : 'text-slate'}`}>
                      {isFull ? 'Full (আসন পূর্ণ)' : `${m.capacity - activeCount} seats left`}
                    </span>
                  </div>
                );
              },
              hideBelow: 'lg',
            },
            {
              key: 'f',
              header: d.mc.fee,
              cell: (m) =>
                m.fee <= 0 ? (
                  <span className="inline-flex items-center rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-bold text-ok">
                    Free
                  </span>
                ) : (
                  <span className="tnum font-bold text-ink">{formatMoney(m.fee)}</span>
                ),
              hideBelow: 'xl',
            },
            {
              key: 's',
              header: d.common.status,
              cell: (m) => (
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge status={m.status} />
                  <label className="sr-only" htmlFor={`st-${m.id}`}>{a.changeStatus}</label>
                  <select
                    id={`st-${m.id}`}
                    value={MC_STATUSES.includes(m.status) ? m.status : ''}
                    onChange={(e) => {
                      const nextStatus = e.target.value as MasterclassStatus;
                      if (MC_STATUSES.includes(nextStatus)) changeStatus(m, nextStatus);
                    }}
                    className="h-6 rounded border border-line bg-paper px-1.5 text-[0.6875rem] font-medium text-slate hover:border-brand focus:border-brand focus:outline-none"
                  >
                    {!MC_STATUSES.includes(m.status) && <option value="">{a.changeStatus}</option>}
                    {MC_STATUSES.map((s) => <option key={s} value={s}>{d.status[s]}</option>)}
                  </select>
                </div>
              ),
            },
            {
              key: 'e',
              header: <span className="sr-only">{d.common.actions}</span>,
              align: 'right',
              cell: (m) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" icon={<Users className="h-3.5 w-3.5" />} onClick={() => setRosterMc(m)}>
                    Roster
                  </Button>
                  <Button size="sm" variant="ghost" to={`/admin/masterclasses/${m.id}/edit`} icon={<Pencil className="h-3.5 w-3.5" />}>{d.common.edit}</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={m.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    onClick={() => toggleArchived(m)}
                    loading={archiveBusy === m.id}
                    disabled={archiveBusy !== null && archiveBusy !== m.id}
                  >
                    {m.archived ? a.restore : a.archive}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}
      {rosterMc && (
        <AdminRosterModal
          masterclass={rosterMc}
          open={!!rosterMc}
          onClose={() => setRosterMc(null)}
        />
      )}
    </div>
  );
}
