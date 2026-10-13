import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '@/services';
import { onAuthChange } from '@/services/api/authApi';
import type { SessionUser } from '@/types';

interface AuthValue {
  user: SessionUser | null;
  /** Re-read the session after a service call changed it. */
  refresh: () => SessionUser | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Interface-level session state. In preview mode this is a demo marker in
 * sessionStorage; the live app will read an httpOnly session from the server.
 * Route guards here only shape navigation - they are not security.
 */
const isVerifiedUser = (u: SessionUser | null): u is SessionUser => Boolean(u && (u.role === 'admin' || u.emailVerified));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    const s = authService.getSession();
    return isVerifiedUser(s) ? s : null;
  });

  useEffect(() => {
    // 1. Initial server session verification
    if (authService.syncSession) {
      authService.syncSession().then((u) => {
        setUser(isVerifiedUser(u) ? u : null);
      }).catch(() => {
        setUser(null);
      });
    }

    // 2. Cross-tab synchronization listener
    const unsub = onAuthChange((newUser) => {
      setUser(isVerifiedUser(newUser) ? newUser : null);
    });

    // 3. Tab visibility / window focus check
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible' && authService.syncSession) {
        authService.syncSession().then((u) => {
          setUser(isVerifiedUser(u) ? u : null);
        }).catch(() => {
          setUser(null);
        });
      }
    };
    document.addEventListener('visibilitychange', onFocusOrVisible);
    window.addEventListener('focus', onFocusOrVisible);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      window.removeEventListener('focus', onFocusOrVisible);
    };
  }, []);

  const refresh = useCallback(() => {
    const u = authService.getSession();
    setUser(isVerifiedUser(u) ? u : null);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, refresh, logout }), [user, refresh, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
