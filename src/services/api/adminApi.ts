import type { AuditEntry, BusinessProfile, Registration, SmeRecord } from '@/types';
import { apiRequest } from './client';
import { ServiceError } from '../errors';
import type { AdminService, AdminStats, SmeDetail } from '../adminService';
import type { ResultWithUser } from '../eligibilityService';

export const apiAdminService: AdminService = {
  async stats(): Promise<AdminStats> {
    try {
      const data = await apiRequest<{
        totalSmes: number;
        totalRegistrations: number;
        totalRevenue: number;
        readinessChecks: number;
      }>('/admin/dashboard');

      return {
        totalSmes: data.totalSmes,
        totalMasterclasses: 0,
        totalRegistrations: data.totalRegistrations,
        upcomingMasterclasses: 0,
        eligibilityChecks: data.readinessChecks,
        averageScore: null,
      };
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async listSmes(): Promise<SmeRecord[]> {
    try {
      return await apiRequest<SmeRecord[]>('/admin/smes');
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async getSme(id: string): Promise<SmeDetail> {
    try {
      const data = await apiRequest<{
        id: string;
        name: string;
        email: string;
        joinedAt: string;
        profile: BusinessProfile | null;
        registrations: Registration[];
        latestResult: ResultWithUser | null;
        auditTimeline: AuditEntry[];
      }>(`/admin/smes/${encodeURIComponent(id)}`);


      const smeRecord: SmeRecord = {
        id: data.id,
        profile: data.profile ?? {
          id: data.id,
          userId: data.id,
          businessName: data.name,
          businessType: 'sole_proprietorship',
          industry: '',
          location: '',
          businessAge: '',
          ownershipType: '',
          ownerName: data.name,
          email: data.email,
          updatedAt: data.joinedAt,
        },
        joinedAt: data.joinedAt,
        financingIntent: 'exploring',
        latestScore: data.latestResult?.score,
        latestBand: data.latestResult?.band,
      };

      return {
        sme: smeRecord,
        registrations: data.registrations ?? [],
        latestResult: data.latestResult ?? null,
        audit: [],
      };
    } catch {
      throw new ServiceError('not_found');
    }
  },
};
