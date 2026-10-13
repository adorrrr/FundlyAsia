import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { masterclassService, registrationService } from '@/services';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { MasterclassMeta } from '@/components/masterclasses/MasterclassMeta';
import { CalendarActions } from '@/components/masterclasses/CalendarActions';

export default function ConfirmationPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const regId = params.get('reg') ?? '';
  const { d, l, t } = useI18n();
  const reduce = useReducedMotion();
  const mc = useAsync(() => masterclassService.get(id), [id]);
  const reg = useAsync(() => registrationService.get(regId), [regId]);
  useDocumentTitle(d.confirm.title);

  if (mc.loading || reg.loading) return <LoadingBlock rows={2} />;
  if (!mc.data || !reg.data) return <EmptyState title={d.myreg.notFound} action={<Button to="/my-registrations" variant="secondary">{d.myreg.title}</Button>} />;
  const r = reg.data;
  const m = mc.data;
  if (r.paymentStatus === 'pending' || r.paymentStatus === 'failed') return <Navigate to={`/registrations/${r.id}/payment`} replace />;

  return (
    <div className="mx-auto max-w-xl">
      <div className="glass relative overflow-hidden rounded-panel p-6 text-center sm:p-10">
        <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-soft to-transparent" />
        <motion.span
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-lift"
        >
          <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />
        </motion.span>
        <h1 className="relative mt-5 text-page font-bold">{r.demo ? d.confirm.titlePending : d.confirm.title}</h1>
        <p className="relative mt-2 text-lead text-slate">{r.demo ? d.confirm.bodyPending : t(d.confirm.body, { title: l(m.title) })}</p>

        <div className="relative mt-7 rounded-card bg-surface p-5 text-left shadow-hair">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-4">
            <span className="text-meta text-slate">{d.confirm.id}</span>
            <span className="tnum text-lead font-bold tracking-wide">{r.id}</span>
          </div>
          <p className="mt-4 text-body font-semibold">{l(m.title)}</p>
          <MasterclassMeta m={m} className="mt-3" dense />
        </div>

        {r.demo && <Notice tone="info" className="relative mt-5 text-left">{d.confirm.paymentStatusNote}</Notice>}

        <div className="relative mt-7 flex flex-col items-center gap-3">
          <p className="text-meta font-semibold text-slate">{d.confirm.addCalendar}</p>
          <CalendarActions m={m} regId={r.id} />
        </div>
        <div className="relative mt-8 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:justify-center">
          <Button to={`/registrations/${r.id}`}>{d.confirm.viewMine}</Button>
          <Button to="/dashboard" variant="ghost">{d.confirm.dashboard}</Button>
        </div>
      </div>
    </div>
  );
}
