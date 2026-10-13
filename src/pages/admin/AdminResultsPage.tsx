import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useOptionLabel } from '@/hooks/useOptions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAdminResultRows, type ResultRow } from '@/hooks/useAdminResultRows';
import type { ReadinessBand } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { FilterPills, SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { DemoBadge } from '@/components/ui/Badge';
import { EmptyState, LoadingBlock } from '@/components/ui/Feedback';
import { BandBadge } from '@/components/ui/Readiness';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv } from '@/utils/csv';

export default function AdminResultsPage() {
  const { d, l, formatDate, formatNumber } = useI18n();
  const a = d.admin.results;
  useDocumentTitle(a.title);
  const label = useOptionLabel();
  const toast = useToast();
  const { rows: all, loading } = useAdminResultRows();
  const [q, setQ] = useState('');
  const [band, setBand] = useState<'all' | ReadinessBand>('all');

  const rows = useMemo(() => {
    const query = q.toLowerCase();
    return all.filter((r) => (band === 'all' || r.band === band) && (!query || [r.owner, r.business].some((s) => s.toLowerCase().includes(query))));
  }, [all, q, band]);

  const exportCsv = () => {
    downloadCsv('fundly-eligibility-results-SAMPLE.csv', rows.map((r) => ({ result_id: r.id, sme: r.owner, business: r.business, assessed_on: r.date.slice(0, 10), score: r.score, readiness_level: d.bands[r.band], top_gaps: r.gaps.map((g) => g.en).join('; '), financing_need: r.intent ?? '', funding_amount: r.amountRange ? label('range', r.amountRange) : '', sample_data: 'yes' })));
    toast(d.admin.regs.exported, 'info');
  };

  if (loading) return <LoadingBlock rows={5} />;

  return (
    <div>
      <PageHeader title={a.title} body={a.body} meta={<DemoBadge />} actions={<Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!rows.length}>{d.common.exportCsv}</Button>} />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput value={q} onChange={setQ} placeholder={a.search} />
        <FilterPills label={a.level} value={band} onChange={setBand} options={[{ value: 'all', label: d.common.all }, ...(['low', 'needs_improvement', 'moderate', 'stronger'] as const).map((b) => ({ value: b, label: d.bands[b] }))]} />
      </div>
      <DataTable<ResultRow>
        caption={a.title}
        rows={rows}
        rowKey={(r) => r.id}
        empty={<EmptyState title={d.common.noResults} />}
        columns={[
          { key: 'sme', header: a.sme, cell: (r) => (r.smeId ? <Link to={`/admin/smes/${r.smeId}`} className="font-semibold hover:text-brand">{r.owner}</Link> : r.owner) },
          { key: 'b', header: a.business, cell: (r) => r.business, hideBelow: 'md' },
          { key: 'd', header: a.date, cell: (r) => formatDate(r.date), hideBelow: 'lg' },
          { key: 's', header: a.score, cell: (r) => <span className="tnum text-lead font-bold">{formatNumber(r.score)}</span> },
          { key: 'l', header: a.level, cell: (r) => <BandBadge band={r.band} /> },
          { key: 'g', header: a.gaps, cell: (r) => <span className="text-meta">{r.gaps.map((g) => l(g)).join(', ')}</span>, hideBelow: 'xl', className: 'max-w-[220px]' },
          { key: 'n', header: a.need, cell: (r) => label('intent', r.intent), hideBelow: 'lg' },
          { key: 'a', header: a.amount, cell: (r) => (r.amountRange ? label('range', r.amountRange) : '-'), hideBelow: 'xl' },
        ]}
      />
    </div>
  );
}
