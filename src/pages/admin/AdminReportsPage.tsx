import { useState } from 'react';
import { Download } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { reportsService } from '@/services';
import type { DateRange } from '@/services/reportsService';
import { readinessBands } from '@/data/scoring';
import { PageHeader, SectionTitle } from '@/components/ui/PageHeader';
import { TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback';
import { BarList, StatTile } from '@/components/admin/BarList';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv } from '@/utils/csv';
import type { PaymentStatus } from '@/types';

const bandColor = { low: 'bg-bad', needs_improvement: 'bg-warn', moderate: 'bg-brand-mark', stronger: 'bg-ok' };

export default function AdminReportsPage() {
  const { d, formatNumber } = useI18n();
  const a = d.admin.reports;
  useDocumentTitle(a.title);
  const toast = useToast();
  const [range, setRange] = useState<DateRange>({ from: '', to: '' });
  const { data, loading, error, reload } = useAsync(() => reportsService.get(range), [range.from, range.to]);
  const exported = () => toast(d.admin.regs.exported, 'info');

  return (
    <div>
      <PageHeader title={a.title} body={a.body} />
      <fieldset className="surface mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
        <legend className="sr-only">{a.range}</legend>
        <TextField label={d.common.from} type="date" value={range.from} max={range.to || undefined} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="sm:w-48" />
        <TextField label={d.common.to} type="date" value={range.to} min={range.from || undefined} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="sm:w-48" />
        {(range.from || range.to) && <Button variant="ghost" onClick={() => setRange({ from: '', to: '' })}>{d.common.clearFilters}</Button>}
      </fieldset>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error || !data ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label={a.regs} value={formatNumber(data.registrations.rows.length)} />
            <StatTile label={a.checks} value={formatNumber(data.checks.rows.length)} />
            <StatTile label={d.status.paid} value={formatNumber(data.registrations.byPayment?.paid ?? 0)} />
            <StatTile label={d.status.refund_requested} value={formatNumber(data.registrations.byPayment?.refund_requested ?? 0)} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="surface p-5 sm:p-6">
              <SectionTitle action={<Button size="sm" variant="ghost" icon={<Download className="h-3.5 w-3.5" />} disabled={!data.registrations.rows.length} onClick={() => { downloadCsv('fundly-report-registrations.csv', data.registrations.rows); exported(); }}>{d.common.exportCsv}</Button>}>
                {a.regs} · {a.byStatus}
              </SectionTitle>
              {data.registrations.rows.length ? (
                <BarList caption={`${a.regs} ${a.byStatus}`} data={(Object.keys(data.registrations.byPayment || {}) as PaymentStatus[]).map((k) => ({ key: k, label: d.status[k] || k, value: data.registrations.byPayment[k] ?? 0 }))} />
              ) : (
                <p className="text-body text-slate">{a.empty}</p>
              )}
            </section>
            <section className="surface p-5 sm:p-6">
              <SectionTitle action={<Button size="sm" variant="ghost" icon={<Download className="h-3.5 w-3.5" />} disabled={!data.checks.rows.length} onClick={() => { downloadCsv('fundly-report-eligibility.csv', data.checks.rows); exported(); }}>{d.common.exportCsv}</Button>}>
                {a.checks} · {a.byBand}
              </SectionTitle>
              {data.checks.rows.length ? (
                <BarList caption={`${a.checks} ${a.byBand}`} data={readinessBands.map((b) => ({ key: b.band, label: d.bands[b.band] || b.band, value: data.checks.byBand?.[b.band] ?? 0, colorClass: bandColor[b.band] }))} />
              ) : (
                <p className="text-body text-slate">{a.empty}</p>
              )}
            </section>
          </div>

          <section className="surface p-5 sm:p-6">
            <SectionTitle
              action={
                <Button size="sm" variant="ghost" icon={<Download className="h-3.5 w-3.5" />} onClick={() => { downloadCsv('fundly-report-funnel.csv', a.funnelSteps.map((s, i) => ({ step: s, count: [data.funnel.signedUp ?? 0, data.funnel.profiled ?? 0, data.funnel.registered ?? 0, data.funnel.assessed ?? 0][i] }))); exported(); }}>
                  {d.common.exportCsv}
                </Button>
              }
            >
              {a.funnel}
            </SectionTitle>
            <BarList
              caption={a.funnel}
              data={a.funnelSteps.map((s, i) => ({ key: String(i), label: s, value: [data.funnel.signedUp ?? 0, data.funnel.profiled ?? 0, data.funnel.registered ?? 0, data.funnel.assessed ?? 0][i], colorClass: i === 3 ? 'bg-ink' : undefined }))}
            />
          </section>
        </div>
      )}
    </div>
  );
}
