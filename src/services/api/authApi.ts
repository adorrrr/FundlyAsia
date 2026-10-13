import type { SessionUser } from '@/types';
import { ApiError, apiRequest, setUnauthorizedHandler } from './client';
import { ServiceError } from '../errors';
import type { AuthService } from '../authService';

const SESSION_STORAGE_KEY = 'fundly.api.session';
const CROSS_TAB_KEY = 'fundly.auth.sync';

type AuthEvent = { type: 'LOGIN'; user: SessionUser } | { type: 'LOGOUT'; time: number };

const listeners = new Set<(user: SessionUser | null) => void>();

export function onAuthChange(listener: (user: SessionUser | null) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel('fundly_auth_channel');
    channel.onmessage = (e: MessageEvent<AuthEvent>) => {
      const data = e.data;
      if (data?.type === 'LOGOUT') {
        try {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        listeners.forEach((fn) => fn(null));
      } else if (data?.type === 'LOGIN' && data.user) {
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.user));
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.user));
        } catch {
          /* ignore */
        }
        listeners.forEach((fn) => fn(data.user));
      }
    };
  }
} catch {
  /* ignore */
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SESSION_STORAGE_KEY || e.key === CROSS_TAB_KEY) {
      const current = loadSession();
      listeners.forEach((fn) => fn(current));
    }
  });
}

setUnauthorizedHandler(() => {
  saveSession(null);
});

export function saveSession(user: SessionUser | null) {
  try {
    if (user) {
      const str = JSON.stringify(user);
      sessionStorage.setItem(SESSION_STORAGE_KEY, str);
      localStorage.setItem(SESSION_STORAGE_KEY, str);
      localStorage.setItem(CROSS_TAB_KEY, JSON.stringify({ type: 'LOGIN', time: Date.now() }));
      channel?.postMessage({ type: 'LOGIN', user });
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.setItem(CROSS_TAB_KEY, JSON.stringify({ type: 'LOGOUT', time: Date.now() }));
      channel?.postMessage({ type: 'LOGOUT', time: Date.now() });
    }
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(user));
}

export function loadSession(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function updateSessionUser(patch: Partial<SessionUser>): SessionUser | null {
  const current = loadSession();
  if (current) {
    const updated = { ...current, ...patch };
    saveSession(updated);
    return updated;
  }
  return null;
}

export const apiAuthService: AuthService = {
  getSession() {
    return loadSession();
  },

  async syncSession() {
    try {
      const me = await apiRequest<SessionUser>('/auth/me');
      saveSession(me);
      return me;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        saveSession(null);
        return null;
      }
      return loadSession();
    }
  },


  async login(email, password) {
    try {
      const user = await apiRequest<SessionUser>('/auth/login', {
        method: 'POST',
        json: { email, password },
      });
      saveSession(user);
      return user;
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 429) {
          throw new ServiceError('too_many_attempts', e.message);
        }
        if (e.status === 401 || e.status === 422) {
          throw new ServiceError('invalid_credentials', e.message);
        }
      }
      throw new ServiceError('unavailable', e instanceof Error ? e.message : undefined);
    }
  },

  async signup(input) {
    try {
      const user = await apiRequest<SessionUser>('/auth/signup', {
        method: 'POST',
        json: input,
      });
      // Do not saveSession yet; user must verify OTP before account is created & authenticated
      return user;
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) throw new ServiceError('email_taken', e.message);
        if (e.status === 429) throw new ServiceError('too_many_attempts', e.message);
        if (e.status === 422) throw new ServiceError('validation', e.message);
      }
      throw new ServiceError('unavailable', e instanceof Error ? e.message : undefined);
    }
  },

  async verifyEmail(email, code) {
    try {
      await apiRequest<{ verified: boolean }>('/auth/verify-otp', {
        method: 'POST',
        json: { email, code, purpose: 'signup' },
      });
      const me = await apiRequest<SessionUser>('/auth/me');
      saveSession(me);
      return me;
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 429) throw new ServiceError('too_many_attempts', e.message);
        if (e.status === 400 || e.status === 422) throw new ServiceError('invalid_otp', e.message);
      }
      throw new ServiceError('unavailable', e instanceof Error ? e.message : undefined);
    }
  },

  async resendOtp(email) {
    try {
      await apiRequest<{ sent: boolean }>('/auth/resend-otp', {
        method: 'POST',
        json: { email, purpose: 'signup' },
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        throw new ServiceError('too_many_attempts', e.message);
      }
      throw new ServiceError('unavailable', e instanceof Error ? e.message : undefined);
    }
  },

  async requestPasswordReset(email) {
    try {
      await apiRequest<{ sent: boolean }>('/auth/forgot-password', {
        method: 'POST',
        json: { email },
      });
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async resetPassword(token, password) {
    try {
      await apiRequest<{ reset: boolean }>('/auth/reset-password', {
        method: 'POST',
        json: { token, password },
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) throw new ServiceError('invalid_token', e.message);
      throw new ServiceError('unavailable');
    }
  },

  async adminLogin(email, password) {
    try {
      const admin = await apiRequest<SessionUser>('/auth/admin/login', {
        method: 'POST',
        json: { email, password },
      });
      saveSession(admin);
      return admin;
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 429) {
          throw new ServiceError('too_many_attempts', e.message);
        }
        if (e.status === 401 || e.status === 422) {
          throw new ServiceError('invalid_credentials', e.message);
        }
      }
      throw new ServiceError('unavailable', e instanceof Error ? e.message : undefined);
    }
  },

  async googleSignIn() {
    throw new ServiceError('unavailable');
  },

  async logout() {
    await apiRequest<void>('/auth/logout', { method: 'POST' }).catch(() => undefined);
    saveSession(null);
  },
};

export const hybridAuthService: AuthService = apiAuthService;
