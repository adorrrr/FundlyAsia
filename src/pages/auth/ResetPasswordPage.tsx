import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService } from '@/services';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Feedback';
import { AuthHeader } from '@/components/forms/AuthBits';
import { isStrongPassword } from '@/utils/validation';

export default function ResetPasswordPage() {
  const { d } = useI18n();
  useDocumentTitle(d.auth.resetTitle);
  const [params] = useSearchParams();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ pw?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!isStrongPassword(pw)) errs.pw = d.validation.password;
    if (confirm !== pw || !confirm) errs.confirm = d.validation.match;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    await authService.resetPassword(params.get('token') ?? '', pw);
    setBusy(false);
    setDone(true);
  };

  return (
    <>
      <AuthHeader title={d.auth.resetTitle} body={d.auth.resetBody} />
      {done ? (
        <div className="flex flex-col gap-4" role="status">
          <Notice tone="ok">{d.auth.resetDone}</Notice>
          <Button to="/login" size="lg" full>{d.auth.loginCta}</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <PasswordField label={d.auth.newPassword} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} error={errors.pw} hint={d.auth.passwordHint} required />
          <PasswordField label={d.auth.confirmPassword} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} required />
          <Button type="submit" size="lg" full loading={busy}>{d.auth.resetCta}</Button>
        </form>
      )}
      {!done && <p className="mt-6 text-center text-body"><Link to="/login" className="link">{d.auth.backToLogin}</Link></p>}
    </>
  );
}
