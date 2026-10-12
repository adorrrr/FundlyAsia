/**
 * DEMO-ONLY in-browser data store.
 *
 * Holds sample data so every screen works without a backend. State is kept in
 * memory and mirrored to sessionStorage so a page refresh doesn't wipe your
 * preview. It never stores passwords, OTPs or payment credentials, and it is
 * NOT a security boundary — real authorisation must live on the server.
 */
import { sampleMasterclasses, sampleSpeakers } from '@/data/masterclasses';
import { sampleQuestions } from '@/data/questions';
import { initialScoringAreas } from '@/data/scoring';
import {
  DEMO_USER_ID,
  demoProfile,
  sampleAudit,
  sampleRegistrations,
  sampleResultContent,
  sampleResultRows,
  sampleSmes,
} from '@/data/fixtures';
import { bandFor } from '@/data/scoring';
import type {
  Assessment,
  AssessmentResult,
  AuditEntry,
  BusinessProfile,
  Masterclass,
  Question,
  Registration,
  ScoringArea,
  SmeRecord,
  Speaker,
} from '@/types';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

export interface DbState {
  version: number;
  users: DemoUser[];
  profiles: BusinessProfile[];
  smes: SmeRecord[];
  masterclasses: Masterclass[];
  speakers: Speaker[];
  registrations: Registration[];
  assessments: Assessment[];
  results: (AssessmentResult & { userId: string })[];
  questions: Question[];
  scoringAreas: ScoringArea[];
  audit: AuditEntry[];
}

const STORAGE_KEY = 'fundly.demo.v1';
const VERSION = 1;

function seed(): DbState {
  const demoAssessment: Assessment = {
    id: 'as-demo-1',
    userId: DEMO_USER_ID,
    status: 'submitted',
    currentStep: 7,
    answers: {},
    startedAt: '2026-10-04T09:58:00',
    submittedAt: '2026-10-04T10:15:00',
  };
  const results = sampleResultRows.map((r) => {
    const s = sampleSmes.find((x) => x.id === r.smeId)!;
    const isDemo = s.profile.userId === DEMO_USER_ID;
    return {
      id: r.id,
      assessmentId: isDemo ? demoAssessment.id : `as-${r.id}`,
      userId: s.profile.userId,
      ...sampleResultContent,
      score: r.score,
      band: bandFor(r.score),
      improvements: isDemo ? sampleResultContent.improvements : r.gaps,
      createdAt: `${r.date}T10:15:00`,
      sample: true,
    };
  });

  return {
    version: VERSION,
    users: [{ id: DEMO_USER_ID, name: demoProfile.ownerName, email: demoProfile.email, emailVerified: true }],
    profiles: [demoProfile, ...sampleSmes.slice(1).map((s) => s.profile)],
    smes: sampleSmes.map((s) => ({ ...s, latestBand: s.latestScore != null ? bandFor(s.latestScore) : undefined })),
    masterclasses: structuredClone(sampleMasterclasses),
    speakers: structuredClone(sampleSpeakers),
    registrations: structuredClone(sampleRegistrations),
    assessments: [demoAssessment],
    results,
    questions: structuredClone(sampleQuestions),
    scoringAreas: structuredClone(initialScoringAreas),
    audit: structuredClone(sampleAudit),
  };
}

function load(): DbState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DbState;
      if (parsed.version === VERSION) return parsed;
    }
  } catch {
    /* storage unavailable — fall back to a fresh seed */
  }
  return seed();
}

let state: DbState = load();

/** blob: URLs don't survive a reload, so they are dropped when persisting. */
function stripBlobs(key: string, value: unknown) {
  if ((key === 'cover' || key === 'photo') && typeof value === 'string' && value.startsWith('blob:')) return undefined;
  return value;
}

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state, stripBlobs));
  } catch {
    /* quota or privacy mode — the in-memory copy still works */
  }
}

export const db = {
  get: () => state,
  /** Apply a mutation and persist. */
  update(mutator: (s: DbState) => void) {
    mutator(state);
    persist();
  },
  reset() {
    state = seed();
    persist();
  },
};

export const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function registrationId() {
  const existing = new Set(state.registrations.map((r) => r.id));
  let id = '';
  do id = `FL-${Math.floor(100000 + Math.random() * 900000)}`;
  while (existing.has(id));
  return id;
}
