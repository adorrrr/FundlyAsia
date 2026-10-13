import { useParams } from 'react-router-dom';
import { History } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useOptionLabel } from '@/hooks/useOptions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { adminService, masterclassService } from '@/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingBlock } from '@/components/ui/Feedback';
import { BandBadge, ScoreMeter } from '@/components/ui/Readiness';

export default function AdminSmeDetailPage() {
  const { id = '' } = useParams();
  const { d, l, t, formatDate, formatNumber } = useI18n();
  const s = d.admin.smes;
  const label = useOptionLabel();
  const detail = useAsync(() => adminService.getSme(id), [id]);
  const classes = useAsync(() => masterclassService.listAll(), []);
  useDocumentTitle(detail.data?.sme.profile.businessName);

  if (detail.loading || classes.loading) return <LoadingBlock rows={4} />;
  if (!detail.data) return <EmptyState title={s.notFound} action={<Button to="/admin/smes" variant="secondary">{s.title}</Button>} />;
  const { sme, registrations, latestResult, audit } = detail.data;
  const p = sme.profile;
  const info: [string, string][] = [
    [d.profile.businessName, p.businessName],
    [d.profile.businessType, label('businessType', p.businessType)],
    [d.profile.industry, label('industry', p.industry)],
    [d.profile.location, label('location', p.location)],
    [d.profile.businessAge, label('businessAge', p.businessAge)],
    [d.profile.ownershipType, label('ownershipType', p.ownershipType)],
    [d.profile.ownerName, p.ownerName],
    [d.profile.email, p.email],
    [s.intent, label('intent', sme.financingIntent)],
    [s.joined, formatDate(sme.joinedAt)],
  ];

  return (
    <div>
      <PageHeader back={{ to: '/admin/smes', label: s.title }} title={p.businessName} body={p.ownerName} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <section className="surface p-5 sm:p-6" aria-labelledby="info">
            <h2 id="info" className="mb-4 text-card font-semibold">{s.detailInfo}</h2>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div key={k}><dt className="text-meta text-slate">{k}</dt><dd className="mt-0.5 break-words font-medium">{v}</dd></div>
              ))}
            </dl>
          </section>
          <section className="surface p-5 sm:p-6" aria-labelledby="regs">
            <h2 id="regs" className="mb-3 text-card font-semibold">{s.detailRegs}</h2>
            {registrations.length ? (
              <ul className="divide-y divide-line">
                {registrations.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l(classes.data?.find((m) => m.id === r.masterclassId)?.title)}</p>
                      <p className="tnum text-meta text-slate">{r.id} · {formatDate(r.createdAt)} · {s.intent}: {label('intent', r.financingIntent)}{r.purpose ? `, ${label('purpose', r.purpose)}, ${label('range', r.amountRange)}` : ''}</p>
                    </div>
                    <div className="flex flex-none gap-1.5"><StatusBadge status={r.status} />{r.paymentStatus !== 'not_required' && <StatusBadge status={r.paymentStatus} />}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body text-slate">{s.noRegs}</p>
            )}
          </section>
        </div>
        <div className="flex flex-col gap-5">
          <section className="surface p-5 sm:p-6" aria-labelledby="res">
            <h2 id="res" className="mb-4 text-card font-semibold">{s.detailResult}</h2>
            {latestResult ? (
              <>
                <div className="flex items-end justify-between gap-3">
                  <p className="tnum text-[2.5rem] font-bold leading-none">{formatNumber(latestResult.score)}</p>
                  <BandBadge band={latestResult.band} />
                </div>
                <div className="mt-4"><ScoreMeter score={latestResult.score} band={latestResult.band} compact /></div>
                <p className="mt-4 text-meta font-semibold">{d.result.improve}</p>
                <ul className="mt-1 list-disc pl-5 text-body text-slate">{latestResult.improvements.map((g) => <li key={g.en}>{l(g)}</li>)}</ul>
                <p className="mt-3 text-meta text-slate">{t(d.result.assessedOn, { date: formatDate(latestResult.createdAt) })}</p>
              </>
            ) : (
              <p className="text-body text-slate">{s.noResult}</p>
            )}
          </section>
          <section className="surface p-5 sm:p-6" aria-labelledby="audit">
            <h2 id="audit" className="mb-4 flex items-center gap-2 text-card font-semibold"><History className="h-4 w-4 text-slate" aria-hidden />{s.audit}</h2>
            {audit.length ? (
              <ol className="relative flex flex-col gap-4 border-l border-line pl-5">
                {audit.map((e) => (
                  <li key={e.id} className="relative">
                    <span aria-hidden className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-ink ring-4 ring-surface" />
                    <p className="text-body font-medium">{t(s.auditChanged, { actor: e.actor, field: e.field })}</p>
                    <p className="mt-0.5 text-meta"><span className="text-slate line-through">{e.from}</span> <span aria-hidden>→</span> <span className="font-semibold">{e.to}</span></p>
                    <p className="text-[0.75rem] text-slate">{formatDate(e.at, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-body text-slate">{s.auditEmpty}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
