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
  speakerId: string;
  cover?: string;
  coverTone: 'leaf' | 'sky' | 'sand';
}

export type RegistrationAvailability =
  | { open: true }
  | { open: false; reason: 'full' | 'closed' | 'cancelled' | 'deadline' | 'completed' | 'draft' };

/* ---------------- Registrations & payments ---------------- */
export type FinancingIntent = 'yes' | 'no' | 'exploring';
export type FinancingPurpose = 'working_capital' | 'inventory' | 'expansion' | 'equipment' | 'other';
export type FinancingRange = 'below_5l' | '5_10l' | '10_25l' | '25_50l' | '50l_1cr' | 'above_1cr';
export type RegistrationStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
export type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'failed' | 'refund_requested' | 'refunded';

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
  userId: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  createdAt: ISODate;
  demo: true;
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
