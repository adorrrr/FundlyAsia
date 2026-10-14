import type { PaymentStatus, Registration, RegistrationInput, RegistrationStatus } from '@/types';
import { db, delay, registrationId } from './mock/db';
import { ServiceError } from './errors';

export interface RegistrationService {
  listMine(userId: string): Promise<Registration[]>;
  listAll(): Promise<Registration[]>;
  get(id: string): Promise<Registration>;
  create(userId: string, input: RegistrationInput): Promise<Registration>;
  requestRefund(id: string): Promise<Registration>;
  setStatus(id: string, status: RegistrationStatus): Promise<Registration>;
  setPaymentStatus(id: string, status: PaymentStatus, reason?: string): Promise<Registration>;
}

function mutate(id: string, fn: (r: Registration) => void): Registration {
  let out!: Registration;
  db.update((s) => {
    const r = s.registrations.find((x) => x.id === id);
    if (!r) throw new ServiceError('not_found');
    fn(r);
    out = structuredClone(r);
  });
  return out;
}

const newestFirst = (a: Registration, b: Registration) => b.createdAt.localeCompare(a.createdAt);

export const mockRegistrationService: RegistrationService = {
  async listMine(userId) {
    await delay(300);
    return structuredClone(db.get().registrations.filter((r) => r.userId === userId).sort(newestFirst));
  },
  async listAll() {
    await delay(300);
    return structuredClone([...db.get().registrations].sort(newestFirst));
  },
  async get(id) {
    await delay(200);
    const r = db.get().registrations.find((x) => x.id === id);
    if (!r) throw new ServiceError('not_found');
    return structuredClone(r);
  },
  async create(userId, input) {
    await delay(700);
    const mc = db.get().masterclasses.find((m) => m.id === input.masterclassId);
    if (!mc) throw new ServiceError('not_found');
    if (mc.archived) throw new ServiceError('registration_closed');
    const paid = mc.fee > 0;
    const reg: Registration = {
      ...input,
      id: registrationId(),
      userId,
      status: paid ? 'pending_payment' : 'confirmed',
      paymentStatus: paid ? 'pending' : 'not_required',
      amount: mc.fee,
      createdAt: new Date().toISOString(),
      demo: true,
    };
    db.update((s) => {
      s.registrations.push(reg);
      const m = s.masterclasses.find((x) => x.id === mc.id);
      if (m) m.seatsTaken += 1;
      const sme = s.smes.find((x) => x.profile.userId === userId);
      if (sme) sme.financingIntent = input.financingIntent;
    });
    return structuredClone(reg);
  },
  async requestRefund(id) {
    await delay(500);
    return mutate(id, (r) => {
      r.paymentStatus = 'refund_requested';
    });
  },
  async setStatus(id, status) {
    await delay(300);
    return mutate(id, (r) => {
      r.status = status;
    });
  },
  async setPaymentStatus(id, status) {
    await delay(400);
    return mutate(id, (r) => {
      r.paymentStatus = status;
      if (status === 'paid' && r.status === 'pending_payment') r.status = 'confirmed';
      if (status === 'refunded') r.status = 'cancelled';
      if ((status === 'pending' || status === 'failed') && r.status === 'confirmed' && r.amount > 0) r.status = 'pending_payment';
    });
  },
};
