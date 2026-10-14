import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { ServiceError } from '@/services/errors';
import { Dialog } from '@/components/ui/Dialog';
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
import { useToast } from '@/components/ui/Toast';
import { notifyMasterclassesChanged } from '@/services/api/manualPaymentApi';

export const MC_STATUSES: MasterclassStatus[] = ['draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled'];

export default function AdminMasterclassesPage() {
  const { d, l, formatDate, formatMoney, formatNumber } = useI18n();
  const a = d.admin.mc;
  useDocumentTitle(a.title);
  const toast = useToast();
  const { data, loading, reload, setData } = useAsync(() => masterclassService.listAll(), []);
  const regs = useAsync(() => registrationService.listAll(), []);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | MasterclassStatus>('all');

  // React to updates from other tabs or modals (e.g. refunds in roster modal)
  useEffect(() => {
    const handler = () => {
      reload();
      regs.reload();
    };
    window.addEventListener('fundly:masterclasses-updated', handler);
    return () => window.removeEventListener('fundly:masterclasses-updated', handler);
  }, [reload, regs]);

  const rows = useMemo(() => {
    const query = q.toLowerCase();
    return (data ?? []).filter((m) => (status === 'all' || m.status === status) && (!query || [m.title.en, m.title.bn, m.topic.en].some((s) => s.toLowerCase().includes(query))));
  }, [data, q, status]);

  const [toDelete, setToDelete] = useState<Masterclass | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rosterMc, setRosterMc] = useState<Masterclass | null>(null);

  const confirmDelete = async () => {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      await masterclassService.remove(toDelete.id);
      setData((prev) => prev?.filter((x) => x.id !== toDelete.id));
      toast(a.deleted);
      setToDelete(null);
      notifyMasterclassesChanged();
      reload();
      regs.reload();
    } catch (e) {
      toast(e instanceof ServiceError && e.code === 'has_registrations' ? 'Cannot delete: active registrations exist. Please refund or cancel attendees first.' : a.deleteFailed, 'error');
    } finally {
      setDeleting(false);
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
      <PageHeader title={a.title} body={a.body} actions={<Button to="/admin/masterclasses/create" icon={<Plus className="h-4 w-4" />}>{a.create}</Button>} />
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
          empty={<EmptyState title={data?.length ? d.common.noResults : a.empty} body={data?.length ? undefined : a.emptyBody} action={<Button to="/admin/masterclasses/create">{a.create}</Button>} />}
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
            { key: 'd', header: d.mc.date, cell: (m) => formatDate(m.date), hideBelow: 'md' },
            {
              key: 'r',
              header: a.registrations,
              cell: (m) => {
                const activeCount = (regs.data ?? []).filter((r) => r.masterclassId === m.id && r.status !== 'cancelled').length;
                return <span className="tnum font-medium">{formatNumber(activeCount)} / {formatNumber(m.capacity)}</span>;
              },
              hideBelow: 'lg',
            },
            { key: 'f', header: d.mc.fee, cell: (m) => <span className="tnum">{formatMoney(m.fee)}</span>, hideBelow: 'xl' },
            {
              key: 's',
              header: d.common.status,
              cell: (m) => (
                <div className="flex flex-col items-start gap-1.5">
                  <StatusBadge status={m.status} />
                  <label className="sr-only" htmlFor={`st-${m.id}`}>{a.changeStatus}</label>
                  <select
                    id={`st-${m.id}`}
                    value={m.status}
                    onChange={(e) => changeStatus(m, e.target.value as MasterclassStatus)}
                    className="h-8 rounded-md border border-line bg-surface px-2 text-meta focus:border-brand focus:shadow-focus focus:outline-none"
                  >
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
                  <Button size="sm" variant="ghost" className="text-bad" onClick={() => setToDelete(m)} icon={<Trash2 className="h-3.5 w-3.5" />}>{a.delete}</Button>
                </div>
              ),
            },
          ]}
        />
      )}
      {toDelete && (() => {
        const activeSeats = (regs.data ?? []).filter((r) => r.masterclassId === toDelete.id && r.status !== 'cancelled').length;
        const hasActive = activeSeats > 0;
        return (
          <Dialog
            open={!!toDelete}
            onClose={() => !deleting && setToDelete(null)}
            title={a.deleteTitle}
            description={hasActive ? undefined : a.deleteBody.replace('{title}', l(toDelete.title))}
            size="sm"
            footer={
              <>
                <Button variant="secondary" data-autofocus onClick={() => setToDelete(null)} disabled={deleting}>
                  {d.common.cancel}
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDelete}
                  loading={deleting}
                  disabled={deleting || hasActive}
                >
                  {a.delete}
                </Button>
              </>
            }
          >
            {hasActive && (
              <div className="space-y-3">
                <p className="text-body text-slate">
                  {a.deleteBody.replace('{title}', l(toDelete.title))}
                </p>
                <div className="rounded-xl border border-bad/30 bg-bad-soft/30 p-4 text-meta text-bad">
                  <p className="font-bold">Cannot Delete: Active Registrations Exist</p>
                  <p className="mt-1 text-slate">
                    This masterclass currently has <strong className="text-bad">{activeSeats}</strong> active registered attendee(s).
                    Please refund or cancel all registered attendees before deleting this session. Once refunded/cancelled, the seat count returns to 0 and you can delete it.
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Users className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setRosterMc(toDelete);
                        setToDelete(null);
                      }}
                    >
                      Open Attendee Roster & Refund
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Dialog>
        );
      })()}

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
