import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '@/services';
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
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => authService.getSession());

  useEffect(() => {
    if (authService.syncSession) {
      authService.syncSession().then((u) => {
        if (u) setUser(u);
      }).catch(() => undefined);
    }
  }, []);

  const refresh = useCallback(() => {
    const u = authService.getSession();
    setUser(u);
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
