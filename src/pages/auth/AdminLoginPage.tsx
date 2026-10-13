import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService } from '@/services';
import { Button } from '@/components/ui/Button';
import { PasswordField, TextField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Feedback';
import { AuthHeader } from '@/components/forms/AuthBits';
import { useToast } from '@/components/ui/Toast';
import { isEmail, isStrongPassword } from '@/utils/validation';

export default function AdminLoginPage() {
  const { d } = useI18n();
  useDocumentTitle(d.admin.login);
  const { refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
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
      await authService.adminLogin(email, password);
      refresh();
      nav('/admin');
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
      <span className="mb-4 inline-flex rounded-full bg-ink px-2.5 py-0.5 text-[0.75rem] font-bold text-white">{d.admin.panel}</span>
      <AuthHeader title={d.auth.adminTitle} body={d.auth.adminBody} />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {errors.form && <Notice tone="warn">{errors.form}</Notice>}
        <TextField label={d.auth.email} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
        <PasswordField label={d.auth.password} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} required />
        <Button type="submit" size="lg" full loading={busy} className="mt-2">{busy ? d.auth.loggingIn : d.auth.loginCta}</Button>
      </form>
      <p className="mt-6 text-center text-body"><Link to="/" className="text-slate hover:text-ink">{d.admin.backToSite}</Link></p>
    </>
  );
}
