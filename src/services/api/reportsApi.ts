import { apiRequest } from './client';
import { ServiceError } from '../errors';
import type { DateRange, Reports, ReportsService } from '../reportsService';

export const apiReportsService: ReportsService = {
  async get(range: DateRange): Promise<Reports> {
    try {
      const q = new URLSearchParams();
      if (range.from) q.set('from', range.from);
      if (range.to) q.set('to', range.to);
      const qs = q.toString() ? `?${q.toString()}` : '';
      return await apiRequest<Reports>(`/admin/reports${qs}`);
    } catch (e) {
      throw new ServiceError('unavailable', e instanceof Error ? e.message : undefined);
    }
  },
};
