/** Shared domain types. These mirror the shapes the future API is expected to return. */

export type Lang = 'en' | 'bn';
export type Localized = { en: string; bn: string };
export type ISODate = string;

/* ---------------- Auth ---------------- */
export type Role = 'sme' | 'admin';
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  hasBusinessProfile: boolean;
}

/* ---------------- Business ---------------- */
export type BusinessType = 'sole_proprietorship' | 'partnership' | 'private_limited' | 'other';
export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  industry: string;
  location: string;
  businessAge: string;
  ownershipType: string;
  ownerName: string;
  email: string;
  updatedAt: ISODate;
}

/* ---------------- Masterclasses ---------------- */
export type MasterclassStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'completed'
  | 'cancelled';

export interface Speaker {
  id: string;
  name: string;
  designation: string;
  institution: string;
  bio: Localized;
  photo?: string; // object URL / data URL in demo mode
}

export interface Masterclass {
  id: string;
  slug: string;
  title: Localized;
  topic: Localized;
  description: Localized;
  summary: Localized;
  learn: Localized[];
  date: ISODate; // yyyy-mm-dd, or '' when to be announced
  startTime: string; // HH:mm
  endTime: string;
  venue: Localized;
  capacity: number;
  seatsTaken: number;
  registrationDeadline: ISODate | '';
  fee: number; // BDT, 0 = free
  status: MasterclassStatus;
  archived?: boolean;
  /** '' when the speaker is not confirmed yet. */
  speakerId: string;
  cover?: string;
  /** Responsive sources for the cover, e.g. "a.webp 640w, b.webp 1024w". */
  coverSrcSet?: string;
  coverAlt?: Localized;
  /** Photographer credit for stock covers. */
  coverCredit?: { name: string; url: string };
  coverTone: 'leaf' | 'sky' | 'sand';
  /** Demo-only event, labelled in the UI. */
  sample?: boolean;
}

export type RegistrationAvailability =
  | { open: true }
  | { open: false; reason: 'full' | 'closed' | 'cancelled' | 'deadline' | 'completed' | 'draft' };

/* ---------------- Registrations & payments ---------------- */
export type FinancingIntent = 'yes' | 'no' | 'exploring';
export type FinancingPurpose = 'working_capital' | 'inventory' | 'expansion' | 'equipment' | 'other';
export type FinancingRange = 'below_5l' | '5_10l' | '10_25l' | '25_50l' | '50l_1cr' | 'above_1cr';
export type RegistrationStatus = 'pending' | 'pending_payment' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
export type PaymentStatus =
  | 'not_required'
  | 'pending'
  | 'pending_verification'
  | 'paid'
  | 'failed'
  | 'refund_requested'
  | 'partially_refunded'
  | 'refunded';

export interface RegistrationInput {
  masterclassId: string;
  name: string;
  email: string;
  businessName: string;
  industry: string;
  businessType: BusinessType;
  financingIntent: FinancingIntent;
  purpose?: FinancingPurpose;
  amountRange?: FinancingRange;
}

export interface Registration extends RegistrationInput {
  id: string; // FL-XXXXXX
  rawId?: number;
  userId: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  amountPaid?: number;
  amountRefunded?: number;
  ticketNumber?: string;
  attendanceStatus?: 'unmarked' | 'attended' | 'no_show';
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: ISODate;
  masterclass?: {
    id: string;
    title: Localized;
    topic: Localized;
    date: string;
    startTime: string;
    endTime: string;
    venue: Localized;
    cover?: string;
  };
  latestSubmission?: {
    status: PaymentSubmissionStatus;
    rejectionReason?: string;
    trxId?: string;
    senderAccount?: string;
    paymentMethod?: string;
  };
  demo?: boolean;
}

/* ---------------- Manual QR Payments & Tickets ---------------- */
export type PaymentMethod = 'bkash' | 'nagad' | 'bank_transfer' | 'other';
export type PaymentSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentSubmission {
  id: string;
  registrationId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  senderAccount: string;
  trxId: string;
  amount: number;
  paidAt?: string;
  receiptPath?: string;
  status: PaymentSubmissionStatus;
  rejectionReason?: string;
  verifiedByAdminId?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  adminNotes?: string;
  createdAt: string;
  registrationCode?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  businessName?: string;
  payableAmount?: number;
  masterclassId?: string;
  masterclassTitle?: string;
}

export interface PaymentSubmissionInput {
  paymentMethod: PaymentMethod;
  senderAccount: string;
  trxId: string;
  amount: number;
  paidAt?: string;
  receiptPath?: string;
  confirmAccurate: boolean;
  accuracyConfirmed?: boolean;
}

export interface DigitalTicket {
  id: string;
  ticketNumber: string;
  registrationId: string;
  userId: string;
  masterclassId: string;
  status: 'valid' | 'used' | 'cancelled';
  checkedInAt?: string;
  checkedInByAdminId?: string;
  createdAt: string;
  attendee: {
    name: string;
    email: string;
    businessName: string;
    registrationCode: string;
    amountPaid: number;
  };
  masterclass: {
    id: string;
    title: Localized;
    topic: Localized;
    date: string;
    startTime: string;
    endTime: string;
    venue: Localized;
    cover?: string;
    speaker?: {
      name: string;
      designation: string;
    };
  };
}

export type RefundStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface RefundRecord {
  id: string;
  registrationId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  provider: string;
  destinationAccount: string;
  accountHolderName?: string;
  refundMethod: string;
  providerRefundId?: string;
  requestedByUserId?: string;
  requesterName?: string;
  processedByAdminId?: string;
  processedByName?: string;
  notes?: string;
  rejectionReason?: string;
  receiptPath?: string;
  createdAt: string;
  updatedAt: string;
  registrationCode?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  businessName?: string;
  amountPaid: number;
  amountRefunded: number;
  masterclassId?: string;
  masterclassTitle?: string;
}

export interface UserRefundRequestInput {
  amount: number;
  reason: string;
  destinationAccount: string;
  accountHolderName?: string;
  refundMethod: string;
  confirmAccurate?: boolean;
  accuracyConfirmed?: boolean;
}

export interface RosterAttendee {
  id: string;
  code: string;
  name: string;
  email: string;
  businessName: string;
  industry: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  attendanceStatus: 'unmarked' | 'attended' | 'no_show';
  ticketNumber?: string;
  ticketStatus?: string;
  checkedInAt?: string;
  createdAt: string;
}

/* ---------------- Eligibility ---------------- */
export type QuestionCategory =
  | 'business_information'
  | 'financials'
  | 'financial_records'
  | 'banking'
  | 'compliance'
  | 'existing_debt'
  | 'funding_requirement';

export type AnswerType = 'single_choice' | 'select' | 'number' | 'currency' | 'text';

export interface QuestionOption {
  value: string;
  label: Localized;
}

export interface Question {
  id: string;
  step: number; // 1–6, the questionnaire step it renders on
  text: Localized;
  help?: Localized;
  category: QuestionCategory;
  answerType: AnswerType;
  options?: QuestionOption[];
  required: boolean;
  /** Prefill source on the business profile, if any. */
  prefillFrom?: keyof BusinessProfile;
  /** Only show when another answer matches. */
  showWhen?: { questionId: string; equals: string };
  /** Scoring metadata is deliberately unset until the mapping is approved with lenders. */
  weight: number | null;
  ruleRef: string | null;
  active: boolean;
}

export type Answers = Record<string, string>;

export type ReadinessBand = 'low' | 'needs_improvement' | 'moderate' | 'stronger';

export interface Assessment {
  id: string;
  userId: string;
  status: 'draft' | 'submitted';
  answers: Answers;
  currentStep: number;
  startedAt: ISODate;
  submittedAt?: ISODate;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  score: number;
  band: ReadinessBand;
  strengths: Localized[];
  improvements: Localized[];
  nextStep: Localized;
  createdAt: ISODate;
  /** True when produced by the sample fixture rather than an approved scoring engine. */
  sample: boolean;
}

export interface ScoringArea {
  key: string;
  label: Localized;
  weight: number;
}

/* ---------------- Admin ---------------- */
export interface SmeRecord {
  id: string;
  profile: BusinessProfile;
  joinedAt: ISODate;
  financingIntent: FinancingIntent;
  latestScore?: number;
  latestBand?: ReadinessBand;
}

export interface AuditEntry {
  id: string;
  smeId: string;
  at: ISODate;
  actor: string;
  field: string;
  from: string;
  to: string;
}

export interface AdminResultRow {
  id: string;
  smeId: string;
  owner: string;
  business: string;
  date: ISODate;
  score: number;
  band: ReadinessBand;
  topGaps: string[];
  financingNeed: FinancingIntent;
  amount: string;
}
