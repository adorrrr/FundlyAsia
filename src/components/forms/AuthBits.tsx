import type { ReactNode } from 'react';
import { useState } from 'react';
import { Notice } from '@/components/ui/Feedback';
import { useI18n } from '@/i18n/I18nProvider';
import { authService, ServiceError } from '@/services';

export function AuthHeader({ title, body }: { title: string; body?: ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="text-page font-bold">{title}</h1>
      {body && <p className="mt-2 text-body text-slate">{body}</p>}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}

/** Integration-ready Google button. It calls authService.googleSignIn(), which is not connected in preview. */
export function GoogleButton() {
  const { d } = useI18n();
  const [notice, setNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    setBusy(true);
    try {
      await authService.googleSignIn();
    } catch (e) {
      if (e instanceof ServiceError && e.code === 'not_connected') setNotice(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-control bg-surface text-body font-semibold text-ink shadow-hair transition-shadow hover:shadow-lift disabled:opacity-60"
      >
        <GoogleMark />
        {d.auth.google}
      </button>
      {notice && <Notice tone="info">{d.auth.googleNotice}</Notice>}
    </div>
  );
}

export function OrDivider() {
  const { d } = useI18n();
  return (
    <div className="my-5 flex items-center gap-3 text-meta text-slate" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      {d.auth.or}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
