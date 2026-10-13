import type { SessionUser } from '@/types';
import { ApiError, apiRequest } from './client';
import { ServiceError } from '../errors';
import type { AuthService } from '../authService';

const SESSION_KEY = 'fundly.api.session';

function saveSession(user: SessionUser | null) {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function loadSession(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const apiAuthService: AuthService = {
  getSession() {
    return loadSession();
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
      if (e instanceof ApiError && (e.status === 401 || e.status === 422 || e.status === 429)) {
        throw new ServiceError('invalid_credentials');
      }
      throw new ServiceError('unavailable');
    }
  },

  async signup(input) {
    try {
      const user = await apiRequest<SessionUser>('/auth/signup', {
        method: 'POST',
        json: input,
      });
      saveSession(user);
      return user;
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) throw new ServiceError('email_taken');
        if (e.status === 422) throw new ServiceError('validation');
      }
      throw new ServiceError('unavailable');
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
      if (e instanceof ApiError && e.status === 400) throw new ServiceError('invalid_otp');
      throw new ServiceError('unavailable');
    }
  },

  async resendOtp(email) {
    try {
      await apiRequest<{ sent: boolean }>('/auth/resend-otp', {
        method: 'POST',
        json: { email, purpose: 'signup' },
      });
    } catch {
      throw new ServiceError('unavailable');
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
      if (e instanceof ApiError && e.status === 400) throw new ServiceError('invalid_token');
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
      if (e instanceof ApiError && (e.status === 401 || e.status === 422 || e.status === 429)) {
        throw new ServiceError('invalid_credentials');
      }
      throw new ServiceError('unavailable');
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
