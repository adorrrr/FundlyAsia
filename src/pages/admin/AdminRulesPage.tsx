import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { eligibilityService } from '@/services';
import { initialScoringAreas, readinessBands } from '@/data/scoring';
import type { ScoringArea } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { BandBadge } from '@/components/ui/Readiness';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';

export default function AdminRulesPage() {
  const { d, l, t, formatNumber } = useI18n();
  const a = d.admin.rules;
  useDocumentTitle(a.title);
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => eligibilityService.getScoringAreas(), []);
  const [areas, setAreas] = useState<ScoringArea[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) setAreas(data);
  }, [data]);

  const total = areas.reduce((n, x) => n + (Number.isFinite(x.weight) ? x.weight : 0), 0);
  const valid = total === 100 && areas.every((x) => x.weight >= 0);

  const save = async () => {
    if (!valid) {
      toast(t(d.validation.weights, { n: formatNumber(total) }), 'error');
      return;
    }
    setBusy(true);
    try {
      await eligibilityService.saveScoringAreas(areas);
      toast(a.saved);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : d.common.errorTitle, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) {
    return (
      <div className="max-w-4xl">
        <PageHeader title={a.title} body={a.body} />
        <ErrorState onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title={a.title} body={a.body} />
      <Notice tone="warn" className="mb-3">{a.preliminary}</Notice>
      <Notice tone="info" className="mb-6">{a.mappingPending}</Notice>

      <section className="surface overflow-hidden" aria-labelledby="w">
        <h2 id="w" className="sr-only">{a.weight}</h2>
        <ul className="divide-y divide-line">
          {areas.map((x, i) => (
            <li key={x.key} className="grid items-center gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_96px] sm:gap-6">
              <label htmlFor={`w-${x.key}`} className="font-semibold">{l(x.label)}</label>
              <div className="h-2.5 rounded-[4px] bg-mist" aria-hidden>
                <div className="h-full rounded-[4px] bg-brand-mark transition-[width] duration-300" style={{ width: `${Math.min(100, x.weight)}%` }} />
              </div>
              <div className="relative">
                <input
                  id={`w-${x.key}`}
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  value={Number.isFinite(x.weight) ? x.weight : ''}
                  onChange={(e) => setAreas((xs) => xs.map((y, j) => (j === i ? { ...y, weight: e.target.value === '' ? NaN : Number(e.target.value) } : y)))}
                  className="tnum h-10 w-full rounded-control border border-line bg-surface pl-3 pr-8 text-right font-semibold focus:border-brand focus:shadow-focus focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-meta text-slate">%</span>
              </div>
            </li>
          ))}
        </ul>
        <div className={cn('flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between', valid ? 'border-line bg-paper/60' : 'border-bad/20 bg-bad-soft/40')}>
          <p className="font-semibold">
            {a.total}: <span className={cn('tnum', valid ? 'text-ok' : 'text-bad')}>{formatNumber(total)}%</span>
            {!valid && <span role="alert" className="mt-1 block text-meta font-normal text-bad">{t(d.validation.weights, { n: formatNumber(total) })}</span>}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setAreas(structuredClone(initialScoringAreas))}>{a.reset}</Button>
            <Button onClick={save} disabled={!valid} loading={busy}>{d.common.save}</Button>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="bands">
        <h2 id="bands" className="mb-3 text-card font-semibold">{a.bands}</h2>
        <div className="surface overflow-hidden">
          <table className="w-full text-left text-body">
            <thead>
              <tr className="border-b border-line bg-paper/70 text-meta text-slate">
                <th scope="col" className="px-5 py-3 font-semibold">{a.range}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{d.result.level}</th>
              </tr>
            </thead>
            <tbody>
              {readinessBands.map((b) => (
                <tr key={b.band} className="border-b border-line/70 last:border-0">
                  <td className="tnum px-5 py-3 font-semibold">{formatNumber(b.min)}–{formatNumber(b.max)}</td>
                  <td className="px-5 py-3"><BandBadge band={b.band} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
