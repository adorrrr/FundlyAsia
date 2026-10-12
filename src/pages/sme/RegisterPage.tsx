import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { useOptions } from '@/hooks/useOptions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { businessService, masterclassService, registrationAvailability, registrationService } from '@/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { ChoiceGroup, SelectField, TextField } from '@/components/ui/Field';
import { EmptyState, LoadingBlock, Notice } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { SessionSummary } from '@/components/masterclasses/SessionSummary';
import { useAvailabilityText } from '@/components/masterclasses/Availability';
import type { BusinessType, FinancingIntent, FinancingPurpose, FinancingRange, RegistrationInput } from '@/types';
import { isBlank, isEmail } from '@/utils/validation';

type Form = Omit<RegistrationInput, 'masterclassId' | 'financingIntent'> & { financingIntent: FinancingIntent | '' };
type Errors = Partial<Record<keyof Form, string>>;

export default function RegisterPage() {
  const { id = '' } = useParams();
  const { d, l, t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const opts = useOptions();
  const availText = useAvailabilityText();
  const mc = useAsync(() => masterclassService.get(id), [id]);
  const profile = useAsync(() => businessService.getProfile(user!.id), [user?.id]);
  const mine = useAsync(() => registrationService.listMine(user!.id), [user?.id]);
  useDocumentTitle(mc.data ? t(d.reg.title, { title: l(mc.data.title) }) : undefined);

  const [form, setForm] = useState<Form>({ name: '', email: '', businessName: '', industry: '', businessType: 'sole_proprietorship', financingIntent: '' });
  const [prefilled, setPrefilled] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = profile.data;
    if (p) {
      setForm((f) => ({ ...f, name: p.ownerName, email: p.email, businessName: p.businessName, industry: p.industry, businessType: p.businessType }));
      setPrefilled(true);
    }
  }, [profile.data]);

  if (mc.loading || profile.loading || mine.loading) return <LoadingBlock rows={3} />;
  if (!mc.data || mc.data.status === 'draft') return <EmptyState title={d.mc.notFound} action={<Button to="/masterclasses" variant="secondary">{d.mc.backToList}</Button>} />;
  const m = mc.data;
  const existing = mine.data?.find((r) => r.masterclassId === m.id && r.status !== 'cancelled');
  if (existing) return <Navigate to={`/registrations/${existing.id}`} replace />;
  const avail = registrationAvailability(m);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    (['name', 'businessName', 'industry', 'businessType'] as const).forEach((k) => isBlank(form[k]) && (errs[k] = d.validation.required));
    if (!isEmail(form.email)) errs.email = d.validation.email;
    if (!form.financingIntent) errs.financingIntent = d.validation.required;
    if (form.financingIntent === 'yes') {
      if (!form.purpose) errs.purpose = d.validation.required;
      if (!form.amountRange) errs.amountRange = d.validation.required;
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    const input: RegistrationInput = {
      ...form,
      masterclassId: m.id,
      financingIntent: form.financingIntent as FinancingIntent,
      purpose: form.financingIntent === 'yes' ? form.purpose : undefined,
      amountRange: form.financingIntent === 'yes' ? form.amountRange : undefined,
    };
    const reg = await registrationService.create(user!.id, input);
    setBusy(false);
    nav(reg.paymentStatus === 'pending' ? `/registrations/${reg.id}/payment` : `/masterclasses/${m.id}/confirmation?reg=${reg.id}`);
  };

  return (
    <div>
      <PageHeader back={{ to: `/masterclasses/${m.id}`, label: l(m.title) }} title={t(d.reg.title, { title: l(m.title) })} body={avail.open ? d.reg.body : undefined} />
      {!avail.open ? (
        <EmptyState title={d.reg.closedTitle} body={availText(avail)} action={<Button to="/masterclasses" variant="secondary">{d.mc.backToList}</Button>} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          <form onSubmit={submit} noValidate className="flex flex-col gap-6">
            <fieldset className="surface grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
                <legend className="contents"><h2 className="text-card font-semibold">{d.reg.you}</h2></legend>
                {prefilled && <Badge tone="brand">{d.reg.prefilled}</Badge>}
              </div>
              <TextField label={d.auth.name} value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} required autoComplete="name" />
              <TextField label={d.auth.email} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} required autoComplete="email" />
            </fieldset>

            <fieldset className="surface grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <legend className="contents"><h2 className="text-card font-semibold sm:col-span-2">{d.reg.business}</h2></legend>
              <TextField className="sm:col-span-2" label={d.profile.businessName} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} error={errors.businessName} required />
              <SelectField label={d.profile.industry} value={form.industry} onChange={(e) => set('industry', e.target.value)} options={opts('industry')} placeholder={d.profile.choose} error={errors.industry} required />
              <SelectField label={d.profile.businessType} value={form.businessType} onChange={(e) => set('businessType', e.target.value as BusinessType)} options={opts('businessType')} error={errors.businessType} required />
            </fieldset>

            <div className="surface flex flex-col gap-6 p-5 sm:p-6">
              <ChoiceGroup legend={d.reg.intent} name="intent" value={form.financingIntent} onChange={(v) => set('financingIntent', v as FinancingIntent)} options={opts('intent')} error={errors.financingIntent} required columns={3} />
              <AnimatePresence initial={false}>
                {form.financingIntent === 'yes' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-6 border-t border-line pt-6">
                      <ChoiceGroup legend={d.reg.purpose} name="purpose" value={form.purpose} onChange={(v) => set('purpose', v as FinancingPurpose)} options={opts('purpose')} error={errors.purpose} required columns={3} />
                      <ChoiceGroup legend={d.reg.amount} name="amount" value={form.amountRange} onChange={(v) => set('amountRange', v as FinancingRange)} options={opts('range')} error={errors.amountRange} required columns={3} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {Object.values(errors).some(Boolean) && <Notice tone="warn">{d.validation.fixErrors}</Notice>}
            <div className="flex justify-end">
              <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto">{busy ? d.reg.submitting : m.fee > 0 ? d.reg.submitPaid : d.reg.submitFree}</Button>
            </div>
          </form>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <SessionSummary m={m} title={d.reg.summary} />
            {m.fee > 0 && <p className="mt-3 px-1 text-meta text-slate">{d.mc.paidNote}</p>}
          </aside>
        </div>
      )}
    </div>
  );
}
