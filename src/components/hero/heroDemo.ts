/**
 * ILLUSTRATIVE DEMO CONTENT for the homepage hero.
 * These values are not a real SME assessment and are never loaded from the API.
 * Labels live in the i18n dictionary (d.hero); only the numbers live here.
 */
export interface HeroDemo {
  score: number;
  /** Fill levels (0–100) for the small indicators on each floating card. */
  strongLevel: number;
  improveLevel: number;
  fundingStep: number;
  fundingSteps: number;
}

export const heroDemo: HeroDemo = {
  score: 67,
  strongLevel: 82,
  improveLevel: 38,
  fundingStep: 6,
  fundingSteps: 7,
};
