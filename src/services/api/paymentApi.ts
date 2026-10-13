import type { Registration } from '@/types';
import { apiRequest } from './client';
import { ServiceError } from '../errors';
import type { PaymentService, PreviewOutcome } from '../paymentService';
import { apiRegistrationService } from './registrationApi';

export const apiPaymentService: PaymentService = {
  async startCheckout(registrationId: string) {
    try {
      const res = await apiRequest<{ checkoutUrl?: string | null; paymentId: string }>('/payments/create', {
        method: 'POST',
        json: { registrationId },
      });
      return { checkoutUrl: res.checkoutUrl ?? null };
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async checkStatus(registrationId: string): Promise<Registration> {
    try {
      return await apiRegistrationService.get(registrationId);
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async previewOutcome(registrationId: string, outcome: PreviewOutcome): Promise<Registration> {
    try {
      if (outcome === 'paid') {
        const createRes = await apiRequest<{ paymentId: string }>('/payments/create', {
          method: 'POST',
          json: { registrationId },
        });
        await apiRequest<{ status: string }>('/payments/verify', {
          method: 'POST',
          json: { paymentId: createRes.paymentId },
        });
      }
      return await apiRegistrationService.get(registrationId);
    } catch {
      throw new ServiceError('unavailable');
    }
  },
};
