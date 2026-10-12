/**
 * SAMPLE DATA — fictional businesses, registrations and results used in preview mode.
 * None of these records are real Fundly users.
 */
import type {
  AdminResultRow,
  AssessmentResult,
  AuditEntry,
  BusinessProfile,
  Localized,
  Registration,
  SmeRecord,
} from '@/types';

export const DEMO_USER_ID = 'u-demo';

/** The account you get when logging in to the SME preview. */
export const demoProfile: BusinessProfile = {
  id: 'bp-demo',
  userId: DEMO_USER_ID,
  businessName: 'Jahan Fabrics',
  businessType: 'sole_proprietorship',
  industry: 'apparel',
  location: 'chattogram',
  businessAge: '3to5',
  ownershipType: 'woman_led',
  ownerName: 'Nusrat Jahan',
  email: 'nusrat@jahanfabrics.example',
  updatedAt: '2026-09-28T10:20:00',
};

/** Values offered by "Fill sample values" on onboarding. */
export const sampleProfileValues: Omit<BusinessProfile, 'id' | 'userId' | 'updatedAt' | 'email' | 'ownerName'> = {
  businessName: 'Karnaphuli Agro Traders',
  businessType: 'partnership',
  industry: 'agriculture',
  location: 'chattogram',
  businessAge: '1to3',
  ownershipType: 'partners',
};

type Row = [string, string, string, BusinessProfile['businessType'], string, string, string, string, SmeRecord['financingIntent'], number | null];
// id, business, owner, type, industry, location, age, ownership, intent, score
const rows: Row[] = [
  ['sme-01', 'Jahan Fabrics', 'Nusrat Jahan', 'sole_proprietorship', 'apparel', 'chattogram', '3to5', 'woman_led', 'yes', 64],
  ['sme-02', 'Halishahar Hardware', 'Rafiqul Islam', 'sole_proprietorship', 'retail', 'chattogram', '5to10', 'single', 'yes', 71],
  ['sme-03', 'Meghna Food Products', 'Sabina Yasmin', 'private_limited', 'food', 'dhaka', 'gt10', 'shareholders', 'exploring', 83],
  ['sme-04', 'Padma Print House', 'Arif Hossain', 'partnership', 'manufacturing', 'rajshahi', '3to5', 'partners', 'yes', 48],
  ['sme-05', 'Surma Tea Traders', 'Jamal Uddin', 'sole_proprietorship', 'agriculture', 'sylhet', '1to3', 'single', 'yes', 36],
  ['sme-06', 'Rupsha Pharma Point', 'Maliha Rahman', 'sole_proprietorship', 'healthcare', 'khulna', '5to10', 'woman_led', 'no', 77],
  ['sme-07', 'Bay Digital Studio', 'Tahmid Chowdhury', 'private_limited', 'ict', 'chattogram', 'lt1', 'partners', 'exploring', null],
  ['sme-08', 'Karnaphuli Steel Works', 'Mizanur Rahman', 'partnership', 'construction', 'chattogram', 'gt10', 'family', 'yes', 59],
  ['sme-09', 'Teesta Handloom', 'Rokeya Begum', 'sole_proprietorship', 'apparel', 'rangpur', '3to5', 'woman_led', 'yes', 42],
  ['sme-10', 'Kirtankhola Fish Supply', 'Habibur Rahman', 'sole_proprietorship', 'food', 'barishal', '1to3', 'single', 'exploring', null],
  ['sme-11', 'Brahmaputra Agro Feed', 'Selina Parvin', 'private_limited', 'agriculture', 'mymensingh', '5to10', 'shareholders', 'yes', 68],
  ['sme-12', 'Gulshan Event Services', 'Imran Kabir', 'other', 'services', 'dhaka', '1to3', 'single', 'no', null],
];

const joined = ['2026-09-02', '2026-09-05', '2026-09-07', '2026-09-11', '2026-09-14', '2026-09-18', '2026-09-22', '2026-09-25', '2026-09-29', '2026-10-02', '2026-10-06', '2026-10-09'];

export const sampleSmes: SmeRecord[] = rows.map((r, i) => ({
  id: r[0],
  joinedAt: joined[i],
  financingIntent: r[8],
  latestScore: r[9] ?? undefined,
  profile: {
    id: `bp-${r[0]}`,
    userId: i === 0 ? DEMO_USER_ID : `u-${r[0]}`,
    businessName: r[1],
    ownerName: r[2],
    businessType: r[3],
    industry: r[4],
    location: r[5],
    businessAge: r[6],
    ownershipType: r[7],
    email: `${r[2].split(' ')[0].toLowerCase()}@${r[1].toLowerCase().replace(/[^a-z]/g, '')}.example`,
    updatedAt: `${joined[i]}T09:00:00`,
  },
}));

const sme = (id: string) => sampleSmes.find((s) => s.id === id)!.profile;

type RegRow = [string, string, string, Registration['status'], Registration['paymentStatus'], Registration['financingIntent'], string];
// id, smeId, masterclassId, status, payment, intent, createdAt
const regRows: RegRow[] = [
  ['FL-482913', 'sme-01', 'mc-101', 'confirmed', 'paid', 'yes', '2026-10-03T11:42:00'],
  ['FL-503371', 'sme-02', 'mc-101', 'confirmed', 'paid', 'yes', '2026-10-04T09:15:00'],
  ['FL-517204', 'sme-04', 'mc-101', 'pending_payment', 'pending', 'yes', '2026-10-08T16:03:00'],
  ['FL-520885', 'sme-05', 'mc-101', 'confirmed', 'refund_requested', 'yes', '2026-10-05T13:27:00'],
  ['FL-533019', 'sme-08', 'mc-101', 'confirmed', 'paid', 'yes', '2026-10-06T10:51:00'],
  ['FL-540662', 'sme-09', 'mc-102', 'confirmed', 'paid', 'yes', '2026-10-01T14:10:00'],
  ['FL-548120', 'sme-03', 'mc-102', 'confirmed', 'paid', 'exploring', '2026-09-30T12:00:00'],
  ['FL-551784', 'sme-11', 'mc-103', 'pending_payment', 'failed', 'yes', '2026-10-10T18:22:00'],
  ['FL-559903', 'sme-06', 'mc-104', 'confirmed', 'not_required', 'no', '2026-10-09T08:40:00'],
  ['FL-563217', 'sme-07', 'mc-104', 'confirmed', 'not_required', 'exploring', '2026-10-11T19:05:00'],
  ['FL-410276', 'sme-02', 'mc-100', 'attended', 'not_required', 'yes', '2026-09-10T10:00:00'],
  ['FL-412558', 'sme-03', 'mc-100', 'attended', 'not_required', 'exploring', '2026-09-11T10:00:00'],
  ['FL-415930', 'sme-12', 'mc-100', 'no_show', 'not_required', 'no', '2026-09-12T10:00:00'],
  ['FL-418841', 'sme-06', 'mc-100', 'attended', 'not_required', 'no', '2026-09-13T10:00:00'],
  ['FL-526410', 'sme-10', 'mc-101', 'cancelled', 'refunded', 'exploring', '2026-10-02T15:30:00'],
];

const fees: Record<string, number> = { 'mc-101': 999, 'mc-102': 999, 'mc-103': 999, 'mc-104': 0, 'mc-100': 0 };

export const sampleRegistrations: Registration[] = regRows.map(([id, smeId, mcId, status, paymentStatus, intent, createdAt]) => {
  const p = sme(smeId);
  return {
    id,
    userId: p.userId,
    masterclassId: mcId,
    name: p.ownerName,
    email: p.email,
    businessName: p.businessName,
    industry: p.industry,
    businessType: p.businessType,
    financingIntent: intent,
    purpose: intent === 'yes' ? 'working_capital' : undefined,
    amountRange: intent === 'yes' ? '10_25l' : undefined,
    status,
    paymentStatus,
    amount: fees[mcId] ?? 0,
    createdAt,
    demo: true,
  };
});

/** The fixed sample result shown after any submission in preview mode. */
export const sampleResultContent: Pick<AssessmentResult, 'score' | 'strengths' | 'improvements' | 'nextStep'> = {
  score: 64,
  strengths: [
    { en: 'The business has its own bank account in active use.', bn: 'ব্যবসার নিজস্ব ব্যাংক অ্যাকাউন্ট আছে এবং নিয়মিত ব্যবহার হয়।' },
    { en: 'Trade licence and TIN are in place.', bn: 'ট্রেড লাইসেন্স ও TIN আছে।' },
    { en: 'The business has been operating for several years.', bn: 'ব্যবসাটি কয়েক বছর ধরে চলছে।' },
  ],
  improvements: [
    { en: 'Financial records are only partly maintained.', bn: 'আর্থিক রেকর্ড আংশিকভাবে রাখা হয়।' },
    { en: 'Not all sales go through the business bank account.', bn: 'সব বিক্রি ব্যবসার ব্যাংক অ্যাকাউন্টের মাধ্যমে হয় না।' },
  ],
  nextStep: {
    en: 'Join Loan Lab to learn how lenders read records and bank statements, then retake the check once your records are in order.',
    bn: 'ঋণদাতারা কীভাবে হিসাব ও ব্যাংক স্টেটমেন্ট পড়েন তা জানতে Loan Lab-এ যোগ দিন, তারপর রেকর্ড গুছিয়ে আবার চেক দিন।',
  },
};

const gapPool: Localized[] = [
  { en: 'Financial records', bn: 'আর্থিক রেকর্ড' },
  { en: 'Bank statements', bn: 'ব্যাংক স্টেটমেন্ট' },
  { en: 'Trade licence', bn: 'ট্রেড লাইসেন্স' },
  { en: 'TIN / BIN', bn: 'TIN / BIN' },
  { en: 'Existing debt', bn: 'বিদ্যমান ঋণ' },
  { en: 'Profitability', bn: 'লাভজনকতা' },
];

type ResRow = [string, string, string, number, number[], string, AdminResultRow['amount']];
// id, smeId, date, score, gap indexes, unused, amount
const resRows: ResRow[] = [
  ['R-1001', 'sme-01', '2026-10-04', 64, [0, 1], '', '10–25 lakh'],
  ['R-1002', 'sme-02', '2026-09-24', 71, [0], '', '10–25 lakh'],
  ['R-1003', 'sme-03', '2026-09-26', 83, [4], '', '50 lakh – 1 crore'],
  ['R-1004', 'sme-04', '2026-10-09', 48, [0, 3, 1], '', '5–10 lakh'],
  ['R-1005', 'sme-05', '2026-10-06', 36, [2, 0, 1], '', 'Below 5 lakh'],
  ['R-1006', 'sme-06', '2026-10-02', 77, [1], '', '—'],
  ['R-1007', 'sme-08', '2026-10-07', 59, [4, 0], '', '25–50 lakh'],
  ['R-1008', 'sme-09', '2026-10-03', 42, [0, 5, 3], '', '5–10 lakh'],
  ['R-1009', 'sme-11', '2026-10-10', 68, [1, 3], '', '25–50 lakh'],
];

export const sampleResultRows = resRows.map(([id, smeId, date, score, gaps, , amount]) => {
  const s = sampleSmes.find((x) => x.id === smeId)!;
  return { id, smeId, date, score, gaps: gaps.map((g) => gapPool[g]), intent: s.financingIntent, amount };
});

export const sampleAudit: AuditEntry[] = [
  { id: 'a-1', smeId: 'sme-01', at: '2026-10-04T10:12:00', actor: 'Nusrat Jahan', field: 'Q-BK-02 Regular bank transactions', from: 'No', to: 'Partially' },
  { id: 'a-2', smeId: 'sme-01', at: '2026-10-04T10:14:00', actor: 'Nusrat Jahan', field: 'Q-FR-01 Financial records', from: 'Not maintained', to: 'Partial' },
  { id: 'a-3', smeId: 'sme-04', at: '2026-10-09T15:40:00', actor: 'Arif Hossain', field: 'Q-CP-01 Trade licence', from: 'Valid', to: 'Expired' },
  { id: 'a-4', smeId: 'sme-08', at: '2026-10-07T11:02:00', actor: 'Mizanur Rahman', field: 'Q-DB-03 Monthly repayment', from: '45,000', to: '38,000' },
];

/** Accounts created over time — used only by the reports funnel. */
export const sampleSignupsWithoutProfile = 5;
