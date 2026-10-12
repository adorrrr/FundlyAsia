import type { PaymentStatus, ReadinessBand } from '@/types';
import { db, delay } from './mock/db';

export interface DateRange {
  from: string; // yyyy-mm-dd, '' = open
  to: string;
}

export interface ReportRow {
  id: string;
  date: string;
  [key: string]: string | number;
}

export interface Reports {
  registrations: { rows: ReportRow[]; byPayment: Record<PaymentStatus, number> };
  checks: { rows: ReportRow[]; byBand: Record<ReadinessBand, number> };
  funnel: { signedUp: number; profiled: number; registered: number; assessed: number };
}

export interface ReportsService {
  get(range: DateRange): Promise<Reports>;
}

const inRange = (iso: string, r: DateRange) => {
  const d = iso.slice(0, 10);
  return (!r.from || d >= r.from) && (!r.to || d <= r.to);
};

export const mockReportsService: ReportsService = {
  async get(range) {
    await delay(350);
    const s = db.get();
    const regs = s.registrations.filter((r) => inRange(r.createdAt, range));
    const results = s.results.filter((r) => inRange(r.createdAt, range));
    const smes = s.smes.filter((x) => inRange(x.joinedAt, range));

    const byPayment = { not_required: 0, pending: 0, paid: 0, failed: 0, refund_requested: 0, refunded: 0 } as Record<PaymentStatus, number>;
    regs.forEach((r) => (byPayment[r.paymentStatus] += 1));
    const byBand = { low: 0, needs_improvement: 0, moderate: 0, stronger: 0 } as Record<ReadinessBand, number>;
    results.forEach((r) => (byBand[r.band] += 1));

    const userIds = new Set(smes.map((x) => x.profile.userId));
    const registeredUsers = new Set(s.registrations.filter((r) => userIds.has(r.userId)).map((r) => r.userId));
    const assessedUsers = new Set(s.results.filter((r) => registeredUsers.has(r.userId)).map((r) => r.userId));
    const unprofiled = s.users.filter((u) => !s.profiles.some((p) => p.userId === u.id)).length;

    return {
      registrations: {
        rows: regs.map((r) => {
          const mc = s.masterclasses.find((m) => m.id === r.masterclassId);
          return { id: r.id, date: r.createdAt.slice(0, 10), name: r.name, business: r.businessName, masterclass: mc?.title.en ?? '', status: r.status, payment: r.paymentStatus, amount: r.amount };
        }),
        byPayment,
      },
      checks: {
        rows: results.map((r) => {
          const p = s.profiles.find((x) => x.userId === r.userId);
          return { id: r.id, date: r.createdAt.slice(0, 10), business: p?.businessName ?? '', owner: p?.ownerName ?? '', score: r.score, band: r.band };
        }),
        byBand,
      },
      funnel: {
        signedUp: smes.length + (range.from || range.to ? 0 : unprofiled),
        profiled: smes.length,
        registered: registeredUsers.size,
        assessed: assessedUsers.size,
      },
    };
  },
};
