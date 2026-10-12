import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, CircleAlert, Compass } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { eligibilityService } from '@/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { ScoreMeter, bandText } from '@/components/ui/Readiness';
import { cn } from '@/utils/cn';

export default function ResultPage() {
  const { id = '' } = useParams();
  const { d, l, t, formatDate, formatNumber } = useI18n();
  useDocumentTitle(d.result.title);
  const reduce = useReducedMotion();
  const { data: r, loading } = useAsync(() => eligibilityService.getResult(id), [id]);
  const [soon, setSoon] = useState(false);

  if (loading) return <LoadingBlock rows={3} />;
  if (!r) return <EmptyState title={d.result.notFound} action={<Button to="/eligibility" variant="secondary">{d.elig.title}</Button>} />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{ to: '/eligibility', label: d.result.history }}
        title={d.result.title}
        body={t(d.result.assessedOn, { date: formatDate(r.createdAt) })}
        actions={<Button to="/eligibility" variant="secondary">{d.result.retake}</Button>}
      />

      {r.sample && <Notice tone="demo" title={d.result.sampleTitle} className="mb-6">{d.result.sampleBody}</Notice>}

      <section className="glass rounded-panel p-6 sm:p-8" aria-labelledby="score-h">
        <div className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-12">
          <div>
            <h2 id="score-h" className="text-meta font-semibold text-slate">{d.result.score}</h2>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="tnum mt-1 text-[5rem] font-bold leading-none tracking-tighter"
            >
              {formatNumber(r.score)}
            </motion.p>
            <p className="mt-1 text-body text-slate">{d.result.outOf}</p>
          </div>
          <div>
            <p className="text-meta font-semibold text-slate">{d.result.level}</p>
            <p className={cn('mt-1 text-section font-semibold', bandText[r.band])}>{d.bands[r.band]}</p>
            <div className="mt-6"><ScoreMeter score={r.score} band={r.band} /></div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="surface p-5 sm:p-6" aria-labelledby="str">
          <h2 id="str" className="mb-4 flex items-center gap-2 text-card font-semibold"><CheckCircle2 className="h-5 w-5 text-ok" aria-hidden />{d.result.strengths}</h2>
          <ul className="flex flex-col gap-3">
            {r.strengths.map((s) => (
              <li key={s.en} className="flex gap-3 text-body"><span aria-hidden className="mt-2.5 h-1.5 w-3 flex-none rounded-full bg-ok" />{l(s)}</li>
            ))}
          </ul>
        </section>
        <section className="surface p-5 sm:p-6" aria-labelledby="imp">
          <h2 id="imp" className="mb-4 flex items-center gap-2 text-card font-semibold"><CircleAlert className="h-5 w-5 text-warn" aria-hidden />{d.result.improve}</h2>
          <ul className="flex flex-col gap-3">
            {r.improvements.map((s) => (
              <li key={s.en} className="flex gap-3 text-body"><span aria-hidden className="mt-2.5 h-1.5 w-3 flex-none rounded-full bg-warn" />{l(s)}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-5 flex flex-col gap-5 rounded-panel bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7" aria-labelledby="nxt">
        <div className="max-w-xl">
          <h2 id="nxt" className="flex items-center gap-2 text-meta font-semibold text-white/70"><Compass className="h-4 w-4" aria-hidden />{d.result.next}</h2>
          <p className="mt-2 text-lead font-medium text-white">{l(r.nextStep)}</p>
        </div>
        <Button variant="secondary" onClick={() => setSoon(true)} className="flex-none" iconRight={<ArrowUpRight className="h-4 w-4" />}>{d.result.improveCta}</Button>
      </section>

      <section className="mt-8 grid gap-3 border-t border-line pt-6 text-meta text-slate md:grid-cols-2" aria-label="Disclaimer">
        <p lang="en">{d.result.disclaimerEn}</p>
        <p lang="bn">{d.result.disclaimerBn}</p>
      </section>

      <Dialog open={soon} onClose={() => setSoon(false)} title={d.common.comingSoon} description={d.result.comingSoonBody} size="sm" footer={<Button onClick={() => setSoon(false)} data-autofocus>{d.common.close}</Button>} />
    </div>
  );
}
