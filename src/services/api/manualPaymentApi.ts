import type {
  DigitalTicket,
  PaymentSubmission,
  PaymentSubmissionInput,
  RefundRecord,
  Registration,
  RosterAttendee,
  UserRefundRequestInput,
} from '@/types';
import { apiRequest } from './client';

export const manualPaymentApi = {
  /** Submit manual transaction verification details for a registration */
  async submitPayment(registrationId: string, input: PaymentSubmissionInput): Promise<PaymentSubmission> {
    return await apiRequest<PaymentSubmission>(`/registrations/${encodeURIComponent(registrationId)}/submit-payment`, {
      method: 'POST',
      json: input,
    });
  },

  /** Get transaction submissions for a registration */
  async getSubmissions(registrationId: string): Promise<PaymentSubmission[]> {
    return await apiRequest<PaymentSubmission[]>(`/registrations/${encodeURIComponent(registrationId)}/submissions`);
  },

  /** Get confirmed digital ticket for a registration */
  async getTicket(registrationId: string): Promise<DigitalTicket> {
    return await apiRequest<DigitalTicket>(`/registrations/${encodeURIComponent(registrationId)}/ticket`);
  },

  /** User requests refund for a registration */
  async requestRefund(registrationId: string, input: UserRefundRequestInput): Promise<RefundRecord> {
    return await apiRequest<RefundRecord>(`/registrations/${encodeURIComponent(registrationId)}/request-refund`, {
      method: 'POST',
      json: input,
    });
  },

  /** Upload payment receipt screenshot / PDF */
  async uploadReceipt(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return await apiRequest<{ url: string }>('/uploads/receipt', {
      method: 'POST',
      body: formData,
    });
  },

  /* ---------------- Administrator Actions ---------------- */

  /** Admin cancel an individual registration with reason */
  async adminCancelRegistration(registrationId: string, reason: string): Promise<Registration> {
    return await apiRequest<Registration>(`/admin/registrations/${encodeURIComponent(registrationId)}/cancel`, {
      method: 'POST',
      json: { reason },
    });
  },

  /** Admin get payment submissions verification queue */
  async listPaymentSubmissions(filters?: { status?: string; search?: string }): Promise<PaymentSubmission[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest<PaymentSubmission[]>(`/admin/payment-submissions${query}`);
  },

  /** Admin approve payment submission */
  async approvePaymentSubmission(
    submissionId: string,
    adminNotes?: string
  ): Promise<{ submission: PaymentSubmission; ticketNumber: string; status: string }> {
    return await apiRequest<{ submission: PaymentSubmission; ticketNumber: string; status: string }>(
      `/admin/payment-submissions/${encodeURIComponent(submissionId)}/approve`,
      {
        method: 'POST',
        json: { adminNotes },
      }
    );
  },

  /** Admin reject payment submission with reason */
  async rejectPaymentSubmission(
    submissionId: string,
    reason: string,
    adminNotes?: string
  ): Promise<{ submission: PaymentSubmission; status: string; reason: string }> {
    return await apiRequest<{ submission: PaymentSubmission; status: string; reason: string }>(
      `/admin/payment-submissions/${encodeURIComponent(submissionId)}/reject`,
      {
        method: 'POST',
        json: { reason, adminNotes },
      }
    );
  },

  /** Admin list refund requests */
  async listRefunds(filters?: { status?: string; search?: string }): Promise<RefundRecord[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest<RefundRecord[]>(`/admin/refunds${query}`);
  },

  /** Admin approve refund request (marks as processing) */
  async approveRefund(refundId: string, notes?: string): Promise<RefundRecord> {
    return await apiRequest<RefundRecord>(`/admin/refunds/${encodeURIComponent(refundId)}/approve`, {
      method: 'POST',
      json: { notes },
    });
  },

  /** Admin reject refund request with reason */
  async rejectRefund(refundId: string, reason: string): Promise<RefundRecord> {
    return await apiRequest<RefundRecord>(`/admin/refunds/${encodeURIComponent(refundId)}/reject`, {
      method: 'POST',
      json: { reason },
    });
  },

  /** Admin record disbursement and complete refund */
  async completeRefund(
    refundId: string,
    data: { amount?: number; trxId?: string; notes?: string; receiptPath?: string }
  ): Promise<RefundRecord> {
    return await apiRequest<RefundRecord>(`/admin/refunds/${encodeURIComponent(refundId)}/complete`, {
      method: 'POST',
      json: data,
    });
  },

  /** Admin get session roster */
  async getMasterclassRoster(
    masterclassId: string,
    filters?: { attendanceStatus?: string; search?: string }
  ): Promise<RosterAttendee[]> {
    const params = new URLSearchParams();
    if (filters?.attendanceStatus) params.set('attendanceStatus', filters.attendanceStatus);
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest<RosterAttendee[]>(`/admin/masterclasses/${encodeURIComponent(masterclassId)}/roster${query}`);
  },

  /** Admin check in attendee by ticket number */
  async checkInAttendee(
    masterclassId: string,
    ticketNumber: string
  ): Promise<{ status: string; checkedInAt?: string; message: string }> {
    return await apiRequest<{ status: string; checkedInAt?: string; message: string }>(
      `/admin/masterclasses/${encodeURIComponent(masterclassId)}/check-in`,
      {
        method: 'POST',
        json: { ticketNumber },
      }
    );
  },

  /** Admin verify ticket */
  async verifyTicket(
    ticketNumber: string,
    masterclassId?: string
  ): Promise<{
    valid: boolean;
    alreadyCheckedIn?: boolean;
    isCancelled?: boolean;
    message: string;
    ticket?: DigitalTicket | null;
  }> {
    return await apiRequest<{
      valid: boolean;
      alreadyCheckedIn?: boolean;
      isCancelled?: boolean;
      message: string;
      ticket?: DigitalTicket | null;
    }>('/admin/tickets/verify', {
      method: 'POST',
      json: { ticketNumber, masterclassId },
    });
  },

  /** Admin direct refund & registration cancellation */
  async directRefund(
    registrationId: string | number,
    payload: {
      amount?: number;
      reason: string;
      destinationAccount?: string;
      refundMethod?: string;
      trxId?: string;
      notes?: string;
    }
  ): Promise<{ refund: RefundRecord | null; registration: Registration }> {
    const res = await apiRequest<{ refund: RefundRecord | null; registration: Registration }>(
      `/admin/registrations/${encodeURIComponent(registrationId)}/direct-refund`,
      {
        method: 'POST',
        json: payload,
      }
    );
    notifyMasterclassesChanged();
    return res;
  },
};

/** Broadcast an event across the window so all pages/tabs reload masterclasses */
export function notifyMasterclassesChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fundly:masterclasses-updated'));
  }
}

