import type { BusinessProfile } from '@/types';
import { ApiError, apiRequest } from './client';
import { ServiceError } from '../errors';
import type { BusinessService, ProfileInput } from '../businessService';
import { saveSession, updateSessionUser } from './authApi';

export const apiBusinessService: BusinessService = {
  async getProfile() {
    try {
      const profile = await apiRequest<BusinessProfile | null>('/business-profile');
      if (profile) {
        updateSessionUser({ hasBusinessProfile: true });
      }
      return profile;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        saveSession(null);
        throw new ServiceError('invalid_credentials');
      }
      throw new ServiceError('unavailable');
    }
  },

  async saveProfile(_userId: string, input: ProfileInput) {
    try {
      const saved = await apiRequest<BusinessProfile>('/business-profile', {
        method: 'POST',
        json: input,
      });
      updateSessionUser({ hasBusinessProfile: true });
      return saved;
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          saveSession(null);
          throw new ServiceError('invalid_credentials');
        }
        if (e.status === 422) {
          throw new ServiceError('validation');
        }
      }
      throw new ServiceError('unavailable');
    }
  },
};

