import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notice } from '@/components/ui/Feedback';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { authService } from '@/services';

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

function loadGoogleGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    const w = window as unknown as { google?: { accounts?: unknown } };
    if (w.google?.accounts) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const s = document.createElement('script');
    s.id = 'google-gsi-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

/** Google sign-in & signup entry point. */
export function GoogleButton({ next }: { next?: string | null }) {
  const { d, l } = useI18n();
  const { refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [missingConfig, setMissingConfig] = useState(false);
  const [busy, setBusy] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const onClick = async () => {
    if (!clientId) {
      setMissingConfig(true);
      return;
    }

    setBusy(true);
    try {
      await loadGoogleGsi();
      const w = window as unknown as {
        google?: {
          accounts?: {
            oauth2?: {
              initTokenClient: (config: {
                client_id: string;
                scope: string;
                callback: (resp: GoogleTokenResponse) => void | Promise<void>;
              }) => {
                requestAccessToken: (opts?: { prompt?: string }) => void;
              };
            };
          };
        };
      };

      if (!w.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services SDK could not be initialized.');
      }

      const client = w.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (resp: GoogleTokenResponse) => {
          if (resp.error) {
            setBusy(false);
            if (resp.error !== 'popup_closed_by_user') {
              toast(resp.error_description || resp.error, 'error');
            }
            return;
          }
          if (!resp.access_token) {
            setBusy(false);
            toast('Failed to receive Google access token.', 'error');
            return;
          }

          try {
            const user = await authService.googleSignIn(undefined, resp.access_token);
            refresh();
            const target = !user?.hasBusinessProfile
              ? '/onboarding/business-profile'
              : (next && next.startsWith('/') && !next.startsWith('/onboarding') ? next : '/dashboard');
            nav(target, { replace: true });
          } catch (err: unknown) {
            setBusy(false);
            const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
            toast(msg, 'error');
          }
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err: unknown) {
      setBusy(false);
      const msg = err instanceof Error ? err.message : 'Unable to connect to Google.';
      toast(msg, 'error');
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
        {busy ? l({ en: 'Connecting to Google...', bn: 'Google-এ সংযোগ হচ্ছে...' }) : d.auth.google}
      </button>
      {missingConfig && (
        <Notice tone="info">
          <div className="flex flex-col gap-1 text-xs sm:text-sm">
            <span className="font-bold">
              {l({
                en: 'Google Client ID Required',
                bn: 'Google ক্লায়েন্ট আইডি প্রয়োজন',
              })}
            </span>
            <span>
              {l({
                en: 'Please add VITE_GOOGLE_CLIENT_ID in your .env file and GOOGLE_CLIENT_ID in backend/.env.',
                bn: 'অনুগ্রহ করে .env ফাইলে VITE_GOOGLE_CLIENT_ID এবং backend/.env ফাইলে GOOGLE_CLIENT_ID দিন।',
              })}
            </span>
          </div>
        </Notice>
      )}
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
