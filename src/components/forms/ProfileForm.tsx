import { useMemo, useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useOptions } from '@/hooks/useOptions';
import type { ProfileInput } from '@/services/businessService';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Feedback';
import { GrowBar } from '@/components/ui/Readiness';
import { isBlank, isEmail } from '@/utils/validation';

const FIELDS: (keyof ProfileInput)[] = ['businessName', 'businessType', 'industry', 'location', 'businessAge', 'ownershipType', 'ownerName', 'email'];

export const emptyProfile: ProfileInput = { businessName: '', businessType: 'sole_proprietorship', industry: '', location: '', businessAge: '', ownershipType: '', ownerName: '', email: '' };

export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ProfileInput;
  submitLabel: string;
  onSubmit: (v: ProfileInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const { d, t, formatNumber } = useI18n();
  const opts = useOptions();
  const [v, setV] = useState<ProfileInput>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileInput, string>>>({});
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const filled = useMemo(() => FIELDS.filter((k) => !isBlank(String(v[k] ?? ''))).length, [v]);
  const set = <K extends keyof ProfileInput>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const errs: typeof errors = {};
    FIELDS.forEach((k) => {
      if (isBlank(String(v[k] ?? ''))) errs[k] = d.validation.required;
    });
    if (!errs.email && !isEmail(v.email)) errs.email = d.validation.email;
    setErrors(errs);
    const first = FIELDS.find((k) => errs[k]);
    if (first) {
      document.getElementById(`pf-${first}`)?.querySelector<HTMLElement>('input,select')?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit(v);
    } finally {
      setBusy(false);
    }
  };

  const p = d.profile;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-hair sm:flex-row sm:items-center sm:gap-6">
        <p className="tnum flex-none text-meta font-semibold">
          {filled === FIELDS.length ? p.complete : t(p.incomplete, { n: formatNumber(filled), total: formatNumber(FIELDS.length) })}
        </p>
        <GrowBar value={(filled / FIELDS.length) * 100} className="flex-1" tone={filled === FIELDS.length ? 'mark' : 'soft'} />
      </div>
      {touched && Object.values(errors).some(Boolean) && <Notice tone="warn">{d.validation.fixErrors}</Notice>}

      <fieldset className="surface grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <legend className="sr-only">{p.sectionBusiness}</legend>
        <h2 className="text-card font-semibold sm:col-span-2">{p.sectionBusiness}</h2>
        <div id="pf-businessName" className="sm:col-span-2"><TextField label={p.businessName} value={v.businessName} onChange={set('businessName')} error={errors.businessName} required autoComplete="organization" /></div>
        <div id="pf-businessType"><SelectField label={p.businessType} value={v.businessType} onChange={set('businessType')} options={opts('businessType')} placeholder={p.choose} error={errors.businessType} required /></div>
        <div id="pf-industry"><SelectField label={p.industry} value={v.industry} onChange={set('industry')} options={opts('industry')} placeholder={p.choose} error={errors.industry} required /></div>
        <div id="pf-location"><SelectField label={p.location} value={v.location} onChange={set('location')} options={opts('location')} placeholder={p.choose} error={errors.location} required /></div>
        <div id="pf-businessAge"><SelectField label={p.businessAge} value={v.businessAge} onChange={set('businessAge')} options={opts('businessAge')} placeholder={p.choose} error={errors.businessAge} required /></div>
        <div id="pf-ownershipType" className="sm:col-span-2"><SelectField label={p.ownershipType} value={v.ownershipType} onChange={set('ownershipType')} options={opts('ownershipType')} placeholder={p.choose} error={errors.ownershipType} required /></div>
      </fieldset>

      <fieldset className="surface grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <legend className="sr-only">{p.sectionOwner}</legend>
        <h2 className="text-card font-semibold sm:col-span-2">{p.sectionOwner}</h2>
        <div id="pf-ownerName"><TextField label={p.ownerName} value={v.ownerName} onChange={set('ownerName')} error={errors.ownerName} required autoComplete="name" /></div>
        <div id="pf-email"><TextField label={p.email} type="email" value={v.email} onChange={set('email')} error={errors.email} required autoComplete="email" /></div>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && <Button variant="secondary" onClick={onCancel}>{d.common.cancel}</Button>}
        <Button type="submit" loading={busy}>{busy ? d.common.saving : submitLabel}</Button>
      </div>
    </form>
  );
}
