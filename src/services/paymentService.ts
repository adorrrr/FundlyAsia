/**
 * bKash payment adapter — PREVIEW ONLY.
 *
 * Production flow: the server creates a bKash checkout (create payment), the browser
 * is redirected to bKash's hosted page, and bKash calls back the server, which executes
 * and verifies the payment before marking the registration paid. The browser never
 * handles a PIN or OTP and never decides that a payment succeeded.
 *
 * In preview mode there is no bKash connection. `previewOutcome` lets the UI show each
 * state and is clearly labelled as a simulation on screen.
 */
import type { Registration } from '@/types';
import { delay } from './mock/db';
import { mockRegistrationService } from './registrationService';

export type PreviewOutcome = 'paid' | 'failed' | 'pending';

export interface PaymentService {
  /** Live: returns bKash's hosted checkout URL. Preview: returns null. */
  startCheckout(registrationId: string): Promise<{ checkoutUrl: string | null }>;
  /** Live: asks the server for the verified status. */
  checkStatus(registrationId: string): Promise<Registration>;
  /** Preview only — never present in the live adapter. */
  previewOutcome?(registrationId: string, outcome: PreviewOutcome): Promise<Registration>;
}

export const mockPaymentService: PaymentService = {
  async startCheckout() {
    await delay(500);
    return { checkoutUrl: null };
  },
  async checkStatus(registrationId) {
    await delay(700);
    return mockRegistrationService.get(registrationId);
  },
  async previewOutcome(registrationId, outcome) {
    await delay(1100);
    return mockRegistrationService.setPaymentStatus(registrationId, outcome);
  },
};
