/**
 * Readiness bands and the six initial scoring weights from the Fundly 1.0 brief.
 * These are PRELIMINARY and must be validated with lenders. No question-to-area
 * mapping is defined here on purpose - it has not been approved.
 */
import type { ReadinessBand, ScoringArea } from '@/types';

export const initialScoringAreas: ScoringArea[] = [
  { key: 'documentation', label: { en: 'Documentation', bn: 'কাগজপত্র' }, weight: 20 },
  { key: 'compliance', label: { en: 'Compliance', bn: 'Compliance' }, weight: 15 },
  { key: 'financial_health', label: { en: 'Financial health', bn: 'আর্থিক স্বাস্থ্য' }, weight: 25 },
  { key: 'banking_readiness', label: { en: 'Banking readiness', bn: 'ব্যাংকিং প্রস্তুতি' }, weight: 15 },
  { key: 'debt_capacity', label: { en: 'Debt capacity', bn: 'ঋণ বহনের সক্ষমতা' }, weight: 10 },
  { key: 'funding_preparation', label: { en: 'Funding preparation', bn: 'Funding প্রস্তুতি' }, weight: 15 },
];

export const readinessBands: { band: ReadinessBand; min: number; max: number }[] = [
  { band: 'low', min: 0, max: 39 },
  { band: 'needs_improvement', min: 40, max: 59 },
  { band: 'moderate', min: 60, max: 79 },
  { band: 'stronger', min: 80, max: 100 },
];

export function bandFor(score: number): ReadinessBand {
  return readinessBands.find((b) => score >= b.min && score <= b.max)?.band ?? 'low';
}
