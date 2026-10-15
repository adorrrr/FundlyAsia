import type { SessionUser } from '@/types';
import { db, delay, uid } from './mock/db';
import { DEMO_USER_ID } from '@/data/fixtures';
import { ServiceError } from './errors';

export interface AuthService {
  getSession(): SessionUser | null;
  syncSession?(): Promise<SessionUser | null>;
  login(email: string, password: string): Promise<SessionUser>;

  signup(input: { name: string; email: string; password: string }): Promise<SessionUser>;
  verifyEmail(email: string, code: string): Promise<SessionUser>;
  resendOtp(email: string): Promise<void>;
  cancelSignup(email: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  adminLogin(email: string, password: string): Promise<SessionUser>;
  googleSignIn(): Promise<SessionUser>;
  logout(): Promise<void>;
}

/** Demo session marker only - holds an id and role, never credentials. */
const SESSION_KEY = 'fundly.demo.session';
const DEMO_OTP = '123456';

type StoredSession = { userId: string; role: 'sme' | 'admin'; email?: string };

function writeSession(s: StoredSession | null) {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function toSessionUser(s: StoredSession): SessionUser | null {
  if (s.role === 'admin') {
    return { id: 'admin-demo', name: 'Fundly Admin', email: s.email ?? 'admin@fundly.asia', role: 'admin', emailVerified: true, hasBusinessProfile: false };
  }
  const u = db.get().users.find((x) => x.id === s.userId);
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: 'sme',
    emailVerified: u.emailVerified,
    hasBusinessProfile: db.get().profiles.some((p) => p.userId === u.id),
  };
}

export const mockAuthService: AuthService = {
  getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? toSessionUser(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  },
  async login(email) {
    await delay(600);
    // Preview: an account created this session logs in as itself; anything else opens the sample SME.
    const existing = db.get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const s: StoredSession = { userId: existing?.id ?? DEMO_USER_ID, role: 'sme' };
    writeSession(s);
    return toSessionUser(s)!;
  },
  async signup({ name, email }) {
    await delay(700);
    const existing = db.get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const id = existing?.id ?? uid('u');
    if (!existing) db.update((st) => st.users.push({ id, name, email, emailVerified: true }));
    const s: StoredSession = { userId: id, role: 'sme' };
    writeSession(s);
    return toSessionUser(s)!;
  },
  async verifyEmail(email, code) {
    await delay(600);
    if (code !== DEMO_OTP) throw new ServiceError('invalid_otp');
    db.update((st) => {
      const u = st.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
      if (u) u.emailVerified = true;
    });
    const s = this.getSession();
    if (!s) throw new ServiceError('not_found');
    return s;
  },
  async resendOtp() {
    await delay(400);
  },
  async cancelSignup() {
    await delay(100);
  },
  async requestPasswordReset() {
    await delay(600);
  },
  async resetPassword() {
    await delay(600);
  },
  async adminLogin(email) {
    await delay(600);
    const s: StoredSession = { userId: 'admin-demo', role: 'admin', email };
    writeSession(s);
    return toSessionUser(s)!;
  },
  async googleSignIn() {
    // Integration point for Google OAuth. Intentionally not simulated.
    throw new ServiceError('not_connected');
  },
  async logout() {
    writeSession(null);
  },
};
