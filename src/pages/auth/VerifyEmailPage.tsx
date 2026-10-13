import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService } from '@/services';
import { Button } from '@/components/ui/Button';
import { AuthHeader } from '@/components/forms/AuthBits';
import { OtpInput } from '@/components/forms/OtpInput';

const COOLDOWN = 30;

export default function VerifyEmailPage() {
  const { d, t, formatNumber } = useI18n();
  useDocumentTitle(d.auth.verifyTitle);
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(COOLDOWN);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  if (!user) return <Navigate to="/signup" replace />;
  if (user.emailVerified) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return setError(d.validation.otp);
    setBusy(true);
    setError(undefined);
    try {
      await authService.verifyEmail(user.email, code);
      const u = refresh();
      const next = params.get('next');
      nav(u?.hasBusinessProfile ? '/dashboard' : `/onboarding/business-profile${next ? `?next=${encodeURIComponent(next)}` : ''}`);
    } catch {
      setError(d.validation.otpWrong);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    await authService.resendOtp(user.email);
    setResent(true);
    setLeft(COOLDOWN);
  };

  return (
    <>
      <AuthHeader title={d.auth.verifyTitle} body={t(d.auth.verifyBody, { email: user.email })} />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <OtpInput value={code} onChange={(v) => { setCode(v); setError(undefined); }} invalid={!!error} describedBy={error ? 'otp-err' : undefined} />
        {error && (
          <p id="otp-err" role="alert" className="flex items-center gap-1.5 text-meta text-bad"><AlertCircle className="h-3.5 w-3.5" aria-hidden />{error}</p>
        )}
        <Button type="submit" size="lg" full loading={busy}>{busy ? d.auth.verifying : d.auth.verifyCta}</Button>
      </form>
      <div className="mt-5 flex items-center justify-between text-body">
        {left > 0 ? (
          <span className="tnum text-slate" aria-live="polite">{t(d.auth.resendIn, { s: formatNumber(left) })}</span>
        ) : (
          <button type="button" onClick={resend} className="link">{d.auth.resend}</button>
        )}
        <Link to="/signup" className="text-slate hover:text-ink">{d.auth.wrongEmail}</Link>
      </div>
      {resent && <p className="mt-3 text-meta text-ok" role="status">{d.auth.resent}</p>}
    </>
  );
}
