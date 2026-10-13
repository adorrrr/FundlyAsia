import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService, ServiceError } from '@/services';
import { saveSession } from '@/services/api/authApi';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { AuthHeader } from '@/components/forms/AuthBits';
import { OtpInput } from '@/components/forms/OtpInput';
import { useToast } from '@/components/ui/Toast';

const COOLDOWN = 30;
const TOTAL_EXPIRY_SECONDS = 300; // 5 minutes

export default function VerifyEmailPage() {
  const { d, t, formatNumber } = useI18n();
  useDocumentTitle(d.auth.verifyTitle);
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const targetEmail = user?.email || params.get('email') || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(COOLDOWN);
  const [expiryLeft, setExpiryLeft] = useState(TOTAL_EXPIRY_SECONDS);
  const [resent, setResent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const verifiedRef = useRef(false);

  // Resend cooldown timer
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  // 5-minute expiry countdown (runs in background without displaying countdown UI)
  useEffect(() => {
    if (expiryLeft <= 0) {
      setIsExpired(true);
      setError(d.auth.otpExpiredNotice);
      if (!verifiedRef.current && targetEmail) {
        authService.cancelSignup(targetEmail);
        saveSession(null);
      }
      return;
    }
    const id = setTimeout(() => setExpiryLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [expiryLeft, targetEmail, d.auth.otpExpiredNotice]);

  // Handle browser back button or page leave: cancel signup session and clear session so user must sign up again
  useEffect(() => {
    const onPopState = () => {
      if (!verifiedRef.current && targetEmail) {
        authService.cancelSignup(targetEmail);
        saveSession(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (!verifiedRef.current && targetEmail) {
        authService.cancelSignup(targetEmail);
        saveSession(null);
      }
    };
  }, [targetEmail]);

  if (!targetEmail) return <Navigate to="/signup" replace />;
  if (user?.emailVerified) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      setError(d.auth.otpExpiredNotice);
      return;
    }
    if (code.length !== 6) return setError(d.validation.otp);
    setBusy(true);
    setError(undefined);
    try {
      await authService.verifyEmail(targetEmail, code);
      verifiedRef.current = true;
      const u = refresh();
      const next = params.get('next');
      nav(u?.hasBusinessProfile ? '/dashboard' : `/onboarding/business-profile${next ? `?next=${encodeURIComponent(next)}` : ''}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : d.validation.otpWrong;
      if (err instanceof ServiceError && err.code === 'otp_expired') {
        setIsExpired(true);
      }
      setError(msg);
      toast(msg, 'error');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (isExpired) return;
    try {
      await authService.resendOtp(targetEmail);
      setResent(true);
      setLeft(COOLDOWN);
      setExpiryLeft(TOTAL_EXPIRY_SECONDS);
      setIsExpired(false);
      setError(undefined);
      toast(d.auth.resent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not resend code.';
      toast(msg, 'error');
    }
  };

  const handleBackToSignup = async () => {
    if (targetEmail) {
      await authService.cancelSignup(targetEmail);
      saveSession(null);
    }
    nav('/signup', { replace: true });
  };

  return (
    <>
      <AuthHeader title={d.auth.verifyTitle} body={t(d.auth.verifyBody, { email: targetEmail })} />

      {isExpired ? (
        <div className="flex flex-col gap-4">
          <Notice tone="warn">{d.auth.otpExpiredNotice}</Notice>
          <Button type="button" size="lg" full onClick={handleBackToSignup}>
            {d.auth.createAccountAgain}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {error && <Notice tone="warn">{error}</Notice>}
          <OtpInput
            value={code}
            onChange={(v) => { setCode(v); setError(undefined); }}
            invalid={!!error}
            describedBy={error ? 'otp-err' : undefined}
          />
          {error && (
            <p id="otp-err" role="alert" className="flex items-center gap-1.5 text-meta text-bad">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />{error}
            </p>
          )}
          <Button type="submit" size="lg" full loading={busy}>{busy ? d.auth.verifying : d.auth.verifyCta}</Button>
        </form>
      )}

      <div className="mt-5 flex items-center justify-between text-body">
        {!isExpired && (
          left > 0 ? (
            <span className="tnum text-slate" aria-live="polite">{t(d.auth.resendIn, { s: formatNumber(left) })}</span>
          ) : (
            <button type="button" onClick={resend} className="link">{d.auth.resend}</button>
          )
        )}
        <button
          type="button"
          onClick={handleBackToSignup}
          className="ml-auto inline-flex items-center gap-1.5 text-slate hover:text-ink transition-colors link"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {d.auth.backToSignup}
        </button>
      </div>
      {resent && !isExpired && <p className="mt-3 text-meta text-ok" role="status">{d.auth.resent}</p>}
    </>
  );
}
