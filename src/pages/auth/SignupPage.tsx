import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService, ServiceError } from '@/services';
import { Button } from '@/components/ui/Button';
import { PasswordField, TextField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Feedback';
import { AuthHeader, GoogleButton, OrDivider } from '@/components/forms/AuthBits';
import { useToast } from '@/components/ui/Toast';
import { isBlank, isEmail, isStrongPassword } from '@/utils/validation';

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'form', string>>;

export default function SignupPage() {
  const { d } = useI18n();
  useDocumentTitle(d.auth.signupTitle);
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (isBlank(form.name)) e.name = d.validation.required;
    if (!isEmail(form.email)) e.email = d.validation.email;
    if (!isStrongPassword(form.password)) e.password = d.validation.password;
    if (form.confirm !== form.password || !form.confirm) e.confirm = d.validation.match;
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`su-${Object.keys(e)[0]}`)?.querySelector('input')?.focus();
      return;
    }
    setBusy(true);
    try {
      await authService.signup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      nav(`/verify-email?email=${encodeURIComponent(form.email.trim())}${next ? `&next=${encodeURIComponent(next)}` : ''}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create account.';
      if (err instanceof ServiceError && err.code === 'email_taken') {
        setErrors({ email: 'An account with this email already exists.' });
      } else {
        setErrors({ form: msg });
      }
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AuthHeader title={d.auth.signupTitle} body={d.auth.signupBody} />
      <GoogleButton />
      <OrDivider />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {errors.form && <Notice tone="warn">{errors.form}</Notice>}
        <div id="su-name"><TextField label={d.auth.name} autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} required /></div>
        <div id="su-email"><TextField label={d.auth.email} type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} required /></div>
        <div id="su-password"><PasswordField label={d.auth.password} autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint={d.auth.passwordHint} required /></div>
        <div id="su-confirm"><PasswordField label={d.auth.confirmPassword} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} required /></div>
        <Button type="submit" size="lg" full loading={busy} className="mt-2">{busy ? d.auth.creating : d.auth.signupCta}</Button>
        <p className="text-meta text-slate">{d.auth.terms}</p>
      </form>
      <p className="mt-6 text-center text-body text-slate">
        {d.auth.haveAccount} <Link to="/login" className="link">{d.auth.loginLink}</Link>
      </p>
    </>
  );
}
