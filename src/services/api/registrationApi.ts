import type { PaymentStatus, Registration, RegistrationInput, RegistrationStatus } from '@/types';
import { ApiError, apiRequest } from './client';
import { ServiceError } from '../errors';
import type { RegistrationService } from '../registrationService';

export const apiRegistrationService: RegistrationService = {
  async listMine() {
    try {
      return await apiRequest<Registration[]>('/registrations');
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async listAll() {
    try {
      return await apiRequest<Registration[]>('/admin/registrations');
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async get(id: string) {
    try {
      return await apiRequest<Registration>(`/registrations/${encodeURIComponent(id)}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw new ServiceError('not_found');
      throw new ServiceError('unavailable');
    }
  },

  async create(_userId: string, input: RegistrationInput) {
    try {
      return await apiRequest<Registration>('/registrations', {
        method: 'POST',
        json: input,
      });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'already_registered') throw new ServiceError('already_registered');
        if (e.code === 'masterclass_full') throw new ServiceError('masterclass_full');
        if (e.code === 'registration_closed') throw new ServiceError('registration_closed');
        if (e.status === 422) throw new ServiceError('validation');
      }
      throw new ServiceError('unavailable');
    }
  },

  async requestRefund(id: string) {
    try {
      await apiRequest<void>(`/registrations/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
      return await this.get(id);
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async setStatus(id: string, status: RegistrationStatus) {
    try {
      await apiRequest<void>(`/admin/registrations/${encodeURIComponent(id)}/attendance`, {
        method: 'PATCH',
        json: { status },
      });
      return await this.get(id);
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async setPaymentStatus(id: string, status: PaymentStatus, reason?: string) {
    try {
      await apiRequest<void>(`/admin/registrations/${encodeURIComponent(id)}/payment`, {
        method: 'PATCH',
        json: { status, reason: reason || 'Admin manual update' },
      });
      return await this.get(id);
    } catch {
      throw new ServiceError('unavailable');
    }
  },
};
