import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService } from '@/services';
import { Button } from '@/components/ui/Button';
import { PasswordField, TextField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Feedback';
import { AuthHeader, GoogleButton, OrDivider } from '@/components/forms/AuthBits';
import { isEmail, isStrongPassword } from '@/utils/validation';

import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const { d } = useI18n();
  useDocumentTitle(d.auth.loginTitle);
  const { refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!isEmail(email)) errs.email = d.validation.email;
    if (!isStrongPassword(password)) errs.password = d.validation.password;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await authService.login(email, password);
      const u = refresh();
      if (!u?.hasBusinessProfile) nav(`/onboarding/business-profile${next ? `?next=${encodeURIComponent(next)}` : ''}`);
      else nav(next && next.startsWith('/') ? next : '/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : d.auth.invalidCreds;
      setErrors({ form: msg });
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AuthHeader title={d.auth.loginTitle} body={d.auth.loginBody} />
      <GoogleButton next={next} />
      <OrDivider />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {errors.form && <Notice tone="warn">{errors.form}</Notice>}
        <TextField label={d.auth.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
        <PasswordField
          label={d.auth.password}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          badge={<Link to="/forgot-password" className="text-meta font-semibold text-brand hover:underline">{d.auth.forgot}</Link>}
        />
        <Button type="submit" size="lg" full loading={busy} className="mt-2">{busy ? d.auth.loggingIn : d.auth.loginCta}</Button>
      </form>
      <p className="mt-6 text-center text-body text-slate">
        {d.auth.noAccount} <Link to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="link">{d.auth.signupLink}</Link>
      </p>
    </>
  );
}
