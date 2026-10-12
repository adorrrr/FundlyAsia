import type { Answers, Assessment, AssessmentResult, Question, ScoringArea } from '@/types';
import { db, delay, uid } from './mock/db';
import { ServiceError } from './errors';
import { sampleResultContent } from '@/data/fixtures';
import { bandFor } from '@/data/scoring';

export type ResultWithUser = AssessmentResult & { userId: string };

export interface EligibilityService {
  getQuestions(opts?: { includeInactive?: boolean }): Promise<Question[]>;
  getDraft(userId: string): Promise<Assessment | null>;
  getAssessment(id: string): Promise<Assessment>;
  start(userId: string, prefill: Answers): Promise<Assessment>;
  saveProgress(id: string, answers: Answers, currentStep: number): Promise<void>;
  /** Live: the server scores the answers. Preview: returns the labelled sample result. */
  submit(id: string): Promise<AssessmentResult>;
  listResults(userId: string): Promise<AssessmentResult[]>;
  getResult(id: string): Promise<AssessmentResult>;
  // admin
  saveQuestion(q: Question): Promise<Question>;
  setQuestionActive(id: string, active: boolean): Promise<void>;
  getScoringAreas(): Promise<ScoringArea[]>;
  saveScoringAreas(areas: ScoringArea[]): Promise<void>;
  listAllResults(): Promise<ResultWithUser[]>;
}

const newest = (a: AssessmentResult, b: AssessmentResult) => b.createdAt.localeCompare(a.createdAt);

export const mockEligibilityService: EligibilityService = {
  async getQuestions(opts) {
    await delay(250);
    const qs = db.get().questions;
    return structuredClone(opts?.includeInactive ? qs : qs.filter((q) => q.active));
  },
  async getDraft(userId) {
    await delay(200);
    const d = db.get().assessments.find((a) => a.userId === userId && a.status === 'draft');
    return d ? structuredClone(d) : null;
  },
  async getAssessment(id) {
    await delay(200);
    const a = db.get().assessments.find((x) => x.id === id);
    if (!a) throw new ServiceError('not_found');
    return structuredClone(a);
  },
  async start(userId, prefill) {
    await delay(300);
    const existing = db.get().assessments.find((a) => a.userId === userId && a.status === 'draft');
    if (existing) return structuredClone(existing);
    const a: Assessment = { id: uid('as'), userId, status: 'draft', answers: prefill, currentStep: 1, startedAt: new Date().toISOString() };
    db.update((s) => s.assessments.push(a));
    return structuredClone(a);
  },
  async saveProgress(id, answers, currentStep) {
    await delay(150);
    db.update((s) => {
      const a = s.assessments.find((x) => x.id === id);
      if (a) {
        a.answers = answers;
        a.currentStep = currentStep;
      }
    });
  },
  async submit(id) {
    await delay(1400);
    let result!: ResultWithUser;
    db.update((s) => {
      const a = s.assessments.find((x) => x.id === id);
      if (!a) throw new ServiceError('not_found');
      a.status = 'submitted';
      a.submittedAt = new Date().toISOString();
      result = {
        id: uid('R'),
        assessmentId: a.id,
        userId: a.userId,
        ...sampleResultContent,
        band: bandFor(sampleResultContent.score),
        createdAt: a.submittedAt,
        sample: true,
      };
      s.results.push(result);
    });
    return structuredClone(result);
  },
  async listResults(userId) {
    await delay(250);
    return structuredClone(db.get().results.filter((r) => r.userId === userId).sort(newest));
  },
  async getResult(id) {
    await delay(250);
    const r = db.get().results.find((x) => x.id === id || x.assessmentId === id);
    if (!r) throw new ServiceError('not_found');
    return structuredClone(r);
  },
  async saveQuestion(q) {
    await delay(400);
    db.update((s) => {
      const i = s.questions.findIndex((x) => x.id === q.id);
      if (i >= 0) s.questions[i] = q;
      else s.questions.push(q);
    });
    return structuredClone(q);
  },
  async setQuestionActive(id, active) {
    await delay(250);
    db.update((s) => {
      const q = s.questions.find((x) => x.id === id);
      if (q) q.active = active;
    });
  },
  async getScoringAreas() {
    await delay(200);
    return structuredClone(db.get().scoringAreas);
  },
  async saveScoringAreas(areas) {
    await delay(400);
    if (areas.reduce((n, a) => n + a.weight, 0) !== 100) throw new ServiceError('validation');
    db.update((s) => {
      s.scoringAreas = areas;
    });
  },
  async listAllResults() {
    await delay(300);
    return structuredClone([...db.get().results].sort(newest));
  },
};
