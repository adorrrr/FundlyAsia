import type { AuditEntry, Registration, SmeRecord } from '@/types';
import { db, delay } from './mock/db';
import { ServiceError } from './errors';
import type { ResultWithUser } from './eligibilityService';
import { todayISO } from '@/utils/date';

export interface AdminStats {
  totalSmes: number;
  totalMasterclasses: number;
  totalRegistrations: number;
  upcomingMasterclasses: number;
  eligibilityChecks: number;
  averageScore: number | null;
}

export interface SmeDetail {
  sme: SmeRecord;
  registrations: Registration[];
  latestResult: ResultWithUser | null;
  audit: AuditEntry[];
}

export interface AdminService {
  stats(): Promise<AdminStats>;
  listSmes(): Promise<SmeRecord[]>;
  getSme(id: string): Promise<SmeDetail>;
}

export const mockAdminService: AdminService = {
  async stats() {
    await delay(300);
    const s = db.get();
    const today = todayISO();
    const scores = s.results.map((r) => r.score);
    return {
      totalSmes: s.smes.length,
      totalMasterclasses: s.masterclasses.filter((m) => m.status !== 'draft').length,
      totalRegistrations: s.registrations.length,
      upcomingMasterclasses: s.masterclasses.filter((m) => m.date >= today && !['draft', 'cancelled', 'completed'].includes(m.status)).length,
      eligibilityChecks: s.results.length,
      averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    };
  },
  async listSmes() {
    await delay(300);
    const s = db.get();
    return structuredClone(
      s.smes.map((sme) => {
        const latest = s.results.filter((r) => r.userId === sme.profile.userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        return latest ? { ...sme, latestScore: latest.score, latestBand: latest.band } : sme;
      }),
    );
  },
  async getSme(id) {
    await delay(300);
    const s = db.get();
    const sme = s.smes.find((x) => x.id === id);
    if (!sme) throw new ServiceError('not_found');
    const latest = s.results.filter((r) => r.userId === sme.profile.userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
    return structuredClone({
      sme,
      registrations: s.registrations.filter((r) => r.userId === sme.profile.userId),
      latestResult: latest,
      audit: s.audit.filter((a) => a.smeId === id).sort((a, b) => b.at.localeCompare(a.at)),
    });
  },
};
