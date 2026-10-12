import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock3, Lock, RotateCcw, Undo2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, paymentService, registrationService } from '@/services';
import type { PreviewOutcome } from '@/services/paymentService';
import type { Registration } from '@/types';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { DemoBadge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

type Stage = 'review' | 'preview' | 'processing' | 'result';

function BkashMark() {
  return <span className="inline-flex h-6 items-center rounded-md bg-[#E2136E] px-2 text-[0.8125rem] font-bold text-white">bKash</span>;
}

function StateCard({ tone, icon, title, body, children }: { tone: 'ok' | 'bad' | 'warn' | 'neutral'; icon: ReactNode; title: string; body: string; children?: ReactNode }) {
  const ring = { ok: 'bg-ok-soft text-ok', bad: 'bg-bad-soft text-bad', warn: 'bg-warn-soft text-warn', neutral: 'bg-mist text-slate' }[tone];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col items-center px-2 py-4 text-center" role="status">
      <span className={cn('flex h-14 w-14 items-center justify-center rounded-full', ring)}>{icon}</span>
      <h2 className="mt-4 text-section font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-body text-slate">{body}</p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{children}</div>
    </motion.div>
  );
}

export default function PaymentPage() {
  const { id = '' } = useParams();
  const { d, l, formatMoney } = useI18n();
  useDocumentTitle(d.pay.title);
  const reg = useAsync(() => registrationService.get(id), [id]);
  const mc = useAsync(async () => (reg.data ? masterclassService.get(reg.data.masterclassId) : undefined), [reg.data?.masterclassId]);
  const [stage, setStage] = useState<Stage>('review');
  const [current, setCurrent] = useState<Registration>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!reg.data) return;
    setCurrent(reg.data);
    if (['paid', 'refunded', 'refund_requested'].includes(reg.data.paymentStatus)) setStage('result');
  }, [reg.data]);

  if (reg.loading || mc.loading) return <LoadingBlock rows={2} />;
  if (!reg.data || !current || !mc.data) return <EmptyState title={d.myreg.notFound} action={<Button to="/my-registrations" variant="secondary">{d.myreg.title}</Button>} />;
  const m = mc.data;
  if (current.paymentStatus === 'not_required') return <Navigate to={`/masterclasses/${m.id}/confirmation?reg=${current.id}`} replace />;

  const start = async () => {
    setBusy(true);
    const { checkoutUrl } = await paymentService.startCheckout(current.id);
    setBusy(false);
    if (checkoutUrl) window.location.assign(checkoutUrl); // live bKash hosted checkout
    else setStage('preview');
  };
  const simulate = async (o: PreviewOutcome) => {
    setStage('processing');
    const r = await paymentService.previewOutcome!(current.id, o);
    setCurrent(r);
    setStage('result');
  };
  const check = async () => {
    setStage('processing');
    const r = await paymentService.checkStatus(current.id);
    setCurrent(r);
    setStage('result');
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back={{ to: `/registrations/${current.id}`, label: d.pay.backToReg }} title={d.pay.title} body={stage === 'review' ? d.pay.body : undefined} />
      <div className="overflow-hidden rounded-panel bg-surface shadow-float">
        <dl className="grid gap-4 border-b border-line bg-paper/60 p-5 sm:grid-cols-[1fr_auto] sm:p-6">
          <div className="min-w-0">
            <dt className="text-meta text-slate">{d.pay.masterclass}</dt>
            <dd className="text-body font-semibold">{l(m.title)}</dd>
            <dt className="mt-3 text-meta text-slate">{d.pay.payer}</dt>
            <dd className="text-body">{current.name} · {current.businessName}</dd>
            <dt className="mt-3 text-meta text-slate">{d.pay.registrationId}</dt>
            <dd className="tnum text-body font-semibold">{current.id}</dd>
          </div>
          <div className="sm:text-right">
            <dt className="text-meta text-slate">{d.pay.amount}</dt>
            <dd className="tnum text-[2rem] font-bold leading-tight">{formatMoney(current.amount)}</dd>
          </div>
        </dl>

        <div className="p-5 sm:p-8">
          <AnimatePresence mode="wait" initial={false}>
            {stage === 'review' && (
              <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                {current.paymentStatus === 'failed' && <Notice tone="warn" title={d.pay.failedTitle}>{d.pay.failedBody}</Notice>}
                <p className="flex items-start gap-2.5 text-body text-slate"><Lock className="mt-0.5 h-4 w-4 flex-none text-ink" aria-hidden />{d.pay.handoffNote}</p>
                <Button size="lg" full loading={busy} onClick={start} className="bg-[#E2136E] hover:bg-[#c00f5e]">
                  {d.pay.continue}
                </Button>
              </motion.div>
            )}
            {stage === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                <div className="flex items-center gap-2"><BkashMark /><DemoBadge /></div>
                <Notice tone="demo" title={d.pay.previewTitle}>{d.pay.previewBody}</Notice>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button variant="secondary" onClick={() => simulate('paid')} icon={<CheckCircle2 className="h-4 w-4 text-ok" />}>{d.pay.simulatePaid}</Button>
                  <Button variant="secondary" onClick={() => simulate('failed')} icon={<XCircle className="h-4 w-4 text-bad" />}>{d.pay.simulateFailed}</Button>
                  <Button variant="secondary" onClick={() => simulate('pending')} icon={<Clock3 className="h-4 w-4 text-warn" />}>{d.pay.simulatePending}</Button>
                </div>
                <Button variant="ghost" onClick={() => setStage('review')}>{d.common.back}</Button>
              </motion.div>
            )}
            {stage === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-10" role="status" aria-live="polite">
                <div className="flex flex-col gap-1.5" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-2 rounded-full bg-brand-mark" style={{ width: 64 - i * 18 }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
                <p className="mt-5 text-body font-medium text-slate">{d.pay.processing}</p>
              </motion.div>
            )}
            {stage === 'result' && (
              <motion.div key={`r-${current.paymentStatus}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {current.paymentStatus === 'paid' && (
                  <StateCard tone="ok" icon={<CheckCircle2 className="h-7 w-7" />} title={d.pay.paidTitle} body={d.pay.paidBody}>
                    <Button to={`/masterclasses/${m.id}/confirmation?reg=${current.id}`}>{d.pay.viewConfirmation}</Button>
                  </StateCard>
                )}
                {current.paymentStatus === 'failed' && (
                  <StateCard tone="bad" icon={<XCircle className="h-7 w-7" />} title={d.pay.failedTitle} body={d.pay.failedBody}>
                    <Button onClick={() => setStage('review')} icon={<RotateCcw className="h-4 w-4" />}>{d.pay.tryAgain}</Button>
                    <Button variant="secondary" to={`/registrations/${current.id}`}>{d.pay.backToReg}</Button>
                  </StateCard>
                )}
                {current.paymentStatus === 'pending' && (
                  <StateCard tone="warn" icon={<Clock3 className="h-7 w-7" />} title={d.pay.pendingTitle} body={d.pay.pendingBody}>
                    <Button onClick={check}>{d.pay.checkAgain}</Button>
                    <Button variant="secondary" onClick={() => setStage('preview')}>{d.pay.previewTitle}</Button>
                  </StateCard>
                )}
                {(current.paymentStatus === 'refunded' || current.paymentStatus === 'refund_requested') && (
                  <StateCard tone="neutral" icon={<Undo2 className="h-7 w-7" />} title={current.paymentStatus === 'refunded' ? d.pay.refundedTitle : d.status.refund_requested} body={current.paymentStatus === 'refunded' ? d.pay.refundedBody : d.myreg.refundRequested}>
                    <Button variant="secondary" to={`/registrations/${current.id}`}>{d.pay.backToReg}</Button>
                  </StateCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
