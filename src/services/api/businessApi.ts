import type { BusinessProfile } from '@/types';
import { apiRequest } from './client';
import { ServiceError } from '../errors';
import type { BusinessService, ProfileInput } from '../businessService';

export const apiBusinessService: BusinessService = {
  async getProfile() {
    try {
      return await apiRequest<BusinessProfile | null>('/business-profile');
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async saveProfile(_userId: string, input: ProfileInput) {
    try {
      return await apiRequest<BusinessProfile>('/business-profile', {
        method: 'POST',
        json: input,
      });
    } catch {
      throw new ServiceError('unavailable');
    }
  },
};
