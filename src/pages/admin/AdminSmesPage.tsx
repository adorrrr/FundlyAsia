import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useOptionLabel, useOptions } from '@/hooks/useOptions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { adminService } from '@/services';
import type { SmeRecord } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { FilterPills, SearchInput } from '@/components/ui/SearchInput';
import { SelectField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback';
import { BandBadge } from '@/components/ui/Readiness';
import { downloadCsv } from '@/utils/csv';
import { useToast } from '@/components/ui/Toast';

export default function AdminSmesPage() {
  const { d, formatDate, formatNumber } = useI18n();
  const s = d.admin.smes;
  useDocumentTitle(s.title);
  const nav = useNavigate();
  const toast = useToast();
  const label = useOptionLabel();
  const opts = useOptions();
  const { data, loading, error, reload } = useAsync(() => adminService.listSmes(), []);
  const [q, setQ] = useState('');
  const [intent, setIntent] = useState<'all' | 'yes' | 'no' | 'exploring'>('all');
  const [industry, setIndustry] = useState('');

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (data ?? []).filter(
      (x) =>
        (!query || [x.profile.businessName, x.profile.ownerName, x.profile.email].some((v) => v.toLowerCase().includes(query))) &&
        (intent === 'all' || x.financingIntent === intent) &&
        (!industry || x.profile.industry === industry),
    );
  }, [data, q, intent, industry]);

  const exportCsv = () => {
    downloadCsv('fundly-smes-SAMPLE.csv', rows.map((x) => ({ business: x.profile.businessName, owner: x.profile.ownerName, email: x.profile.email, industry: x.profile.industry, location: x.profile.location, business_type: x.profile.businessType, joined: x.joinedAt, financing_intent: x.financingIntent, latest_score: x.latestScore ?? '' })));
    toast(d.admin.regs.exported, 'info');
  };

  return (
    <div>
      <PageHeader title={s.title} body={s.body} actions={<Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!rows.length}>{d.common.exportCsv}</Button>} />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <SearchInput value={q} onChange={setQ} placeholder={s.search} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FilterPills label={s.intent} value={intent} onChange={setIntent} options={[{ value: 'all', label: d.common.all }, ...opts('intent').map((o) => ({ ...o, value: o.value as 'yes' | 'no' | 'exploring' }))]} />
          <SelectField label={<span className="sr-only">{s.industry}</span>} value={industry} onChange={(e) => setIndustry(e.target.value)} options={opts('industry')} placeholder={`${s.industry}: ${d.common.all}`} className="sm:w-56" />
        </div>
      </div>
      {loading ? (
        <LoadingBlock rows={5} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <DataTable<SmeRecord>
          caption={s.title}
          rows={rows}
          rowKey={(x) => x.id}
          onRowClick={(x) => nav(`/admin/smes/${x.id}`)}
          empty={<EmptyState title={d.common.noResults} action={<Button variant="secondary" onClick={() => { setQ(''); setIntent('all'); setIndustry(''); }}>{d.common.clearFilters}</Button>} />}
          columns={[
            {
              key: 'b',
              header: s.business,
              cell: (x) => (
                <a href={`/admin/smes/${x.id}`} onClick={(e) => { e.preventDefault(); nav(`/admin/smes/${x.id}`); }} className="block min-w-0">
                  <span className="block font-semibold hover:text-brand">{x.profile.businessName}</span>
                  <span className="block text-meta text-slate">{x.profile.email}</span>
                </a>
              ),
            },
            { key: 'o', header: s.owner, cell: (x) => x.profile.ownerName, hideBelow: 'md' },
            { key: 'i', header: s.industry, cell: (x) => label('industry', x.profile.industry), hideBelow: 'lg' },
            { key: 'l', header: s.location, cell: (x) => label('location', x.profile.location), hideBelow: 'xl' },
            { key: 'f', header: s.intent, cell: (x) => label('intent', x.financingIntent) },
            { key: 's', header: s.score, cell: (x) => (x.latestScore != null && x.latestBand ? <div className="flex flex-col"><span className="tnum font-semibold">{formatNumber(x.latestScore)}</span><BandBadge band={x.latestBand} /></div> : <span className="text-slate">{s.none}</span>) },
            { key: 'j', header: s.joined, cell: (x) => formatDate(x.joinedAt), hideBelow: 'lg' },
          ]}
        />
      )}
    </div>
  );
}
