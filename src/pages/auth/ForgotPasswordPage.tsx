import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService } from '@/services';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Feedback';
import { AuthHeader } from '@/components/forms/AuthBits';
import { isEmail } from '@/utils/validation';

export default function ForgotPasswordPage() {
  const { d, t } = useI18n();
  useDocumentTitle(d.auth.forgotTitle);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setError(d.validation.email);
    setError(undefined);
    setBusy(true);
    await authService.requestPasswordReset(email);
    setBusy(false);
    setDone(true);
  };

  return (
    <>
      <AuthHeader title={d.auth.forgotTitle} body={d.auth.forgotBody} />
      {done ? (
        <div className="flex flex-col gap-4" role="status">
          <Notice tone="demo">{t(d.auth.forgotDone, { email })}</Notice>
          <Button to="/reset-password?token=demo" size="lg" full>{d.auth.forgotContinue}</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <TextField label={d.auth.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} required />
          <Button type="submit" size="lg" full loading={busy}>{d.auth.forgotCta}</Button>
        </form>
      )}
      <p className="mt-6 text-center text-body"><Link to="/login" className="link">{d.auth.backToLogin}</Link></p>
    </>
  );
}
