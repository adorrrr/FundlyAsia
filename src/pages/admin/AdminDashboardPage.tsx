import { useEffect } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { adminService, eligibilityService, masterclassService, registrationService } from '@/services';
import { PageHeader, SectionTitle } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback';
import { BarList, StatTile } from '@/components/admin/BarList';
import { DataTable } from '@/components/ui/DataTable';
import { readinessBands } from '@/data/scoring';
import type { Registration } from '@/types';

const bandColor = { low: 'bg-bad', needs_improvement: 'bg-warn', moderate: 'bg-brand-mark', stronger: 'bg-ok' };

export default function AdminDashboardPage() {
  const { d, l, formatNumber, formatDate } = useI18n();
  const a = d.admin.dash;
  useDocumentTitle(a.title);
  const stats = useAsync(() => adminService.stats(), []);
  const classes = useAsync(() => masterclassService.listAll(), []);
  const regs = useAsync(() => registrationService.listAll(), []);
  const results = useAsync(() => eligibilityService.listAllResults(), []);

  useEffect(() => {
    const handler = () => {
      stats.reload();
      classes.reload();
      regs.reload();
    };
    window.addEventListener('fundly:masterclasses-updated', handler);
    return () => window.removeEventListener('fundly:masterclasses-updated', handler);
  }, [stats, classes, regs]);

  if (stats.loading || classes.loading || regs.loading || results.loading) return <LoadingBlock rows={4} />;
  if (stats.error || classes.error || regs.error || results.error || !stats.data) {
    return (
      <div>
        <PageHeader title={a.title} body={a.body} />
        <ErrorState onRetry={() => { stats.reload(); classes.reload(); regs.reload(); results.reload(); }} />
      </div>
    );
  }
  const s = stats.data;
  const byClass = (classes.data ?? [])
    .filter((m) => m.status !== 'draft')
    .map((m) => ({ key: m.id, label: l(m.title), value: (regs.data ?? []).filter((r) => r.masterclassId === m.id && r.status !== 'cancelled').length }))
    .filter((x) => x.value > 0)
    .sort((x, y) => y.value - x.value);
  const byBand = readinessBands.map((b) => ({
    key: b.band,
    label: `${d.bands[b.band]} (${formatNumber(b.min)}–${formatNumber(b.max)})`,
    value: (results.data ?? []).filter((r) => r.band === b.band).length,
    colorClass: bandColor[b.band],
  }));
  const titleOf = (id: string) => l(classes.data?.find((m) => m.id === id)?.title);

  return (
    <div>
      <PageHeader title={a.title} body={a.body} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label={a.totalSmes} value={formatNumber(s.totalSmes)} />
        <StatTile label={a.totalMasterclasses} value={formatNumber(s.totalMasterclasses)} />
        <StatTile label={a.totalRegistrations} value={formatNumber(s.totalRegistrations)} />
        <StatTile label={a.upcoming} value={formatNumber(s.upcomingMasterclasses)} />
        <StatTile label={a.checks} value={formatNumber(s.eligibilityChecks)} />
        <StatTile label={a.avgScore} value={s.averageScore != null ? formatNumber(s.averageScore) : '-'} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <SectionTitle action={<Button variant="link" to="/admin/registrations">{d.dash.viewAll}</Button>}>{a.regsByClass}</SectionTitle>
          <BarList data={byClass} caption={a.regsByClass} />
        </section>
        <section className="surface p-5 sm:p-6">
          <SectionTitle action={<Button variant="link" to="/admin/eligibility/results">{d.dash.viewAll}</Button>}>{a.bandSplit}</SectionTitle>
          <BarList data={byBand} caption={a.bandSplit} />
        </section>
      </div>

      <section className="mt-6">
        <SectionTitle action={<Button variant="link" to="/admin/registrations">{d.dash.viewAll}</Button>}>{a.recentRegs}</SectionTitle>
        <DataTable<Registration>
          caption={a.recentRegs}
          rows={(regs.data ?? []).slice(0, 6)}
          rowKey={(r) => r.id}
          columns={[
            { key: 'id', header: 'ID', cell: (r) => <span className="tnum font-semibold">{r.id}</span> },
            { key: 'name', header: d.admin.regs.name, cell: (r) => <div><p className="font-medium">{r.name}</p><p className="text-meta text-slate">{r.businessName}</p></div> },
            { key: 'mc', header: d.admin.regs.masterclass, cell: (r) => titleOf(r.masterclassId), hideBelow: 'md' },
            { key: 'date', header: d.mc.date, cell: (r) => formatDate(r.createdAt), hideBelow: 'lg' },
            { key: 'pay', header: d.admin.regs.payment, cell: (r) => <StatusBadge status={r.paymentStatus} /> },
          ]}
        />
      </section>
    </div>
  );
}
