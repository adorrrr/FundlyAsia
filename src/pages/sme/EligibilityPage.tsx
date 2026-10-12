import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ClipboardList, Clock } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { businessService, eligibilityService } from '@/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingBlock } from '@/components/ui/Feedback';
import { BandBadge } from '@/components/ui/Readiness';
import { DemoBadge } from '@/components/ui/Badge';
import { prefillFromProfile } from '@/components/eligibility/questionLogic';

export default function EligibilityPage() {
  const { d, t, formatDate, formatNumber } = useI18n();
  useDocumentTitle(d.elig.title);
  const { user } = useAuth();
  const nav = useNavigate();
  const draft = useAsync(() => eligibilityService.getDraft(user!.id), [user?.id]);
  const results = useAsync(() => eligibilityService.listResults(user!.id), [user?.id]);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    const [questions, profile] = await Promise.all([eligibilityService.getQuestions(), businessService.getProfile(user!.id)]);
    const a = await eligibilityService.start(user!.id, prefillFromProfile(questions, profile));
    nav(`/eligibility/${a.id}`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={d.elig.title} body={d.elig.body} />
      {draft.loading || results.loading ? (
        <LoadingBlock rows={2} />
      ) : (
        <>
          <section className="glass relative overflow-hidden rounded-panel p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <ol className="flex flex-wrap gap-x-2 gap-y-1 text-meta text-slate" aria-label={d.elig.title}>
                  {d.elig.steps.map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="tnum font-semibold text-ink">{formatNumber(i + 1)}</span> {s}
                      {i < d.elig.steps.length - 1 && <span aria-hidden className="text-line">/</span>}
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-body text-ink">{d.elig.whatYouGet}</p>
                <p className="mt-2 flex items-center gap-1.5 text-meta text-slate"><Clock className="h-3.5 w-3.5" aria-hidden />{d.elig.aboutTime}</p>
              </div>
              {draft.data ? (
                <div className="flex flex-col gap-2">
                  <Button to={`/eligibility/${draft.data.id}`} size="lg" icon={<ClipboardList className="h-4 w-4" />}>{d.elig.resume}</Button>
                  <p className="text-center text-meta text-slate">{t(d.elig.started, { date: formatDate(draft.data.startedAt) })}</p>
                </div>
              ) : (
                <Button size="lg" onClick={start} loading={busy} icon={<ClipboardList className="h-4 w-4" />}>{results.data?.length ? d.result.retake : d.dash.startCheck}</Button>
              )}
            </div>
          </section>

          <section className="mt-10" aria-labelledby="hist">
            <h2 id="hist" className="mb-4 text-card font-semibold">{d.elig.historyTitle}</h2>
            {results.data?.length ? (
              <ul className="flex flex-col gap-2">
                {results.data.map((r) => (
                  <li key={r.id}>
                    <Link to={`/eligibility/${r.id}/result`} className="group flex items-center gap-4 rounded-card bg-surface p-4 shadow-hair transition-shadow hover:shadow-lift">
                      <span className="tnum w-14 flex-none text-[1.75rem] font-bold leading-none">{formatNumber(r.score)}</span>
                      <span className="min-w-0 flex-1">
                        <BandBadge band={r.band} />
                        <span className="block text-meta text-slate">{t(d.elig.submittedOn, { date: formatDate(r.createdAt) })}</span>
                      </span>
                      {r.sample && <DemoBadge />}
                      <ChevronRight className="h-4 w-4 flex-none text-slate" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={d.elig.historyEmpty} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
