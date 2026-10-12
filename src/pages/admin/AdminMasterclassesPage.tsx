import { useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
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
import { useToast } from '@/components/ui/Toast';

export const MC_STATUSES: MasterclassStatus[] = ['draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled'];

export default function AdminMasterclassesPage() {
  const { d, l, formatDate, formatMoney, formatNumber } = useI18n();
  const a = d.admin.mc;
  useDocumentTitle(a.title);
  const toast = useToast();
  const { data, loading, reload } = useAsync(() => masterclassService.listAll(), []);
  const regs = useAsync(() => registrationService.listAll(), []);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | MasterclassStatus>('all');

  const rows = useMemo(() => {
    const query = q.toLowerCase();
    return (data ?? []).filter((m) => (status === 'all' || m.status === status) && (!query || [m.title.en, m.title.bn, m.topic.en].some((s) => s.toLowerCase().includes(query))));
  }, [data, q, status]);

  const changeStatus = async (m: Masterclass, s: MasterclassStatus) => {
    await masterclassService.setStatus(m.id, s);
    toast(a.updated);
    reload();
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
                  <MasterclassCover m={m} size="sm" className="hidden h-10 w-16 flex-none rounded-md sm:block" />
                  <div className="min-w-0">
                    <p className="font-semibold">{l(m.title)}</p>
                    <p className="text-meta text-slate">{l(m.topic)}</p>
                  </div>
                </div>
              ),
            },
            { key: 'd', header: d.mc.date, cell: (m) => formatDate(m.date), hideBelow: 'md' },
            { key: 'r', header: a.registrations, cell: (m) => <span className="tnum">{formatNumber((regs.data ?? []).filter((r) => r.masterclassId === m.id).length)} / {formatNumber(m.capacity)}</span>, hideBelow: 'lg' },
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
            { key: 'e', header: <span className="sr-only">{d.common.actions}</span>, align: 'right', cell: (m) => <Button size="sm" variant="ghost" to={`/admin/masterclasses/${m.id}/edit`} icon={<Pencil className="h-3.5 w-3.5" />}>{d.common.edit}</Button> },
          ]}
        />
      )}
    </div>
  );
}
