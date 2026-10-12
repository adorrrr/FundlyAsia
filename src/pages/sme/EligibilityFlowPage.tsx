import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Pencil } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { eligibilityService } from '@/services';
import { QUESTION_STEPS } from '@/data/questions';
import type { Answers } from '@/types';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { Stepper } from '@/components/ui/Stepper';
import { QuestionField, useAnswerLabel } from '@/components/eligibility/QuestionField';
import { pruneHidden, validateStep, visibleForStep } from '@/components/eligibility/questionLogic';

const REVIEW = QUESTION_STEPS + 1;

export default function EligibilityFlowPage() {
  const { id = '' } = useParams();
  const { d, l } = useI18n();
  useDocumentTitle(d.elig.title);
  const nav = useNavigate();
  const reduce = useReducedMotion();
  const answerLabel = useAnswerLabel();
  const assessment = useAsync(() => eligibilityService.getAssessment(id), [id]);
  const questions = useAsync(() => eligibilityService.getQuestions(), []);

  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<number>();
  const [submitting, setSubmitting] = useState(false);
  const prefilledIds = useRef(new Set<string>());
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const a = assessment.data;
    if (!a) return;
    setAnswers(a.answers);
    setStep(a.currentStep);
    setMaxReached(a.currentStep);
    prefilledIds.current = new Set(Object.keys(a.answers).filter((k) => k.startsWith('Q-BI')));
  }, [assessment.data]);

  const qs = useMemo(() => questions.data ?? [], [questions.data]);
  const visible = useMemo(() => visibleForStep(qs, step, answers), [qs, step, answers]);

  if (assessment.loading || questions.loading) return <LoadingBlock rows={3} />;
  if (!assessment.data) return <EmptyState title={d.result.notFound} action={<Button to="/eligibility" variant="secondary">{d.elig.title}</Button>} />;
  if (assessment.data.status === 'submitted') return <Navigate to={`/eligibility/${assessment.data.id}/result`} replace />;

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    setMaxReached((m) => Math.max(m, n));
    setErrors({});
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  };

  const save = async (nextStep: number) => {
    const clean = pruneHidden(qs, answers);
    await eligibilityService.saveProgress(id, clean, nextStep);
    setSavedAt(Date.now());
  };

  const next = async () => {
    const errs = validateStep(qs, step, answers, d.validation);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`q-${Object.keys(errs)[0]}`)?.querySelector<HTMLElement>('input,select')?.focus();
      return;
    }
    await save(step + 1);
    go(step + 1);
  };

  const exit = async () => {
    await save(step);
    nav('/dashboard');
  };

  const submit = async () => {
    // re-validate every step before submitting
    for (let s = 1; s <= QUESTION_STEPS; s++) {
      const errs = validateStep(qs, s, answers, d.validation);
      if (Object.keys(errs).length) {
        go(s);
        setErrors(errs);
        return;
      }
    }
    setSubmitting(true);
    await eligibilityService.saveProgress(id, pruneHidden(qs, answers), REVIEW);
    const result = await eligibilityService.submit(id);
    nav(`/eligibility/${result.id}/result`, { replace: true });
  };

  const setAnswer = (qid: string, v: string) => {
    prefilledIds.current.delete(qid);
    setAnswers((a) => ({ ...a, [qid]: v }));
    if (errors[qid]) setErrors((e) => ({ ...e, [qid]: '' }));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Stepper steps={d.elig.steps} current={step} maxReached={maxReached} onJump={go} />
        <div className="mt-6 hidden lg:block">
          <Button variant="ghost" size="sm" onClick={exit}>{d.elig.exit}</Button>
        </div>
      </aside>

      <section className="min-w-0" aria-live="off">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={reduce ? false : { opacity: 0, x: dir * 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: dir * -16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 ref={heading} tabIndex={-1} className="text-page font-bold outline-none">
              {step === REVIEW ? d.elig.reviewTitle : d.elig.steps[step - 1]}
            </h1>
            {step === REVIEW && <p className="mt-2 text-lead text-slate">{d.elig.reviewBody}</p>}

            {step < REVIEW ? (
              <div className="surface mt-6 flex flex-col gap-7 p-5 sm:p-7">
                {visible.map((q) => (
                  <div key={q.id} id={`q-${q.id}`}>
                    <QuestionField q={q} value={answers[q.id] ?? ''} onChange={(v) => setAnswer(q.id, v)} error={errors[q.id] || undefined} prefilled={prefilledIds.current.has(q.id)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-4">
                {d.elig.steps.slice(0, QUESTION_STEPS).map((label, i) => {
                  const s = i + 1;
                  const items = visibleForStep(qs, s, answers);
                  return (
                    <section key={label} className="surface p-5 sm:p-6" aria-labelledby={`rv-${s}`}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 id={`rv-${s}`} className="text-card font-semibold">{label}</h2>
                        <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => go(s)} aria-label={`${d.elig.editStep}: ${label}`}>{d.elig.editStep}</Button>
                      </div>
                      <dl className="divide-y divide-line">
                        {items.map((q) => (
                          <div key={q.id} className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:gap-6">
                            <dt className="text-body text-slate">{l(q.text)}</dt>
                            <dd className={answers[q.id] ? 'text-body font-semibold' : 'text-body font-semibold text-bad'}>{answerLabel(q, answers[q.id])}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  );
                })}
                <Notice tone="info">{d.result.disclaimerEn}</Notice>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="sticky bottom-3 z-10 mt-8">
          <div className="glass flex items-center justify-between gap-3 rounded-[18px] p-2.5 sm:p-3">
            <div className="flex items-center gap-2">
              {step > 1 && <Button variant="ghost" onClick={() => go(step - 1)}>{d.common.previous}</Button>}
              <Button variant="ghost" size="sm" onClick={exit} className="lg:hidden">{d.elig.exit}</Button>
              {savedAt && (
                <span className="hidden items-center gap-1 text-meta text-slate sm:inline-flex" role="status">
                  <Check className="h-3.5 w-3.5 text-ok" aria-hidden />
                  {d.elig.savedDraft}
                </span>
              )}
            </div>
            {step < REVIEW ? (
              <Button onClick={next}>{d.common.continue}</Button>
            ) : (
              <Button onClick={submit} loading={submitting}>{submitting ? d.elig.submitting : d.elig.submit}</Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
