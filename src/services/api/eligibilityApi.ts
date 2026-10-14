import type { Answers, Assessment, AssessmentResult, Question, ScoringArea } from '@/types';
import { ApiError, apiRequest } from './client';
import { ServiceError } from '../errors';
import type { EligibilityService, ResultWithUser } from '../eligibilityService';

export const apiEligibilityService: EligibilityService = {
  async getQuestions(opts) {
    try {
      const endpoint = opts?.includeInactive ? '/admin/questions' : '/questions';
      return await apiRequest<Question[]>(endpoint);
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async getDraft(userId?: string) {
    void userId;
    try {
      return await apiRequest<Assessment | null>('/assessments/current');
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async getAssessment(id: string) {
    void id;
    try {
      const current = await this.getDraft('');
      if (!current) throw new ServiceError('not_found');
      return current;
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async start(userId: string, prefill: Answers) {
    void userId;
    try {
      return await apiRequest<Assessment>('/assessments/save', {
        method: 'POST',
        json: { answers: prefill, step: 1 },
      });
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async saveProgress(id: string, answers: Answers, currentStep: number) {
    void id;
    try {
      await apiRequest<Assessment>('/assessments/save', {
        method: 'POST',
        json: { answers, step: currentStep },
      });
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async submit(id: string) {
    void id;
    try {
      const draft = await this.getDraft('');
      const answers = draft?.answers ?? {};
      return await apiRequest<AssessmentResult>('/assessments/submit', {
        method: 'POST',
        json: { answers },
      });

    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async listResults() {
    try {
      const res = await this.getResult('');
      return [res];
    } catch {
      return [];
    }
  },

  async getResult(id: string) {
    void id;
    try {
      return await apiRequest<AssessmentResult>('/assessments/result');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw new ServiceError('not_found');
      throw new ServiceError('unavailable');
    }
  },

  async saveQuestion(q: Question) {
    try {
      return await apiRequest<Question>('/admin/questions', {
        method: 'POST',
        json: q,
      });
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async setQuestionActive(id: string, active: boolean) {
    try {
      await apiRequest<void>(`/admin/questions/${encodeURIComponent(id)}/active`, {
        method: 'PATCH',
        json: { active },
      });
    } catch {
      throw new ServiceError('unavailable');
    }
  },


  async getScoringAreas() {
    try {
      return await apiRequest<ScoringArea[]>('/admin/scoring-rules');
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async saveScoringAreas(areas: ScoringArea[]) {
    try {
      const weights: Record<string, number> = {};
      for (const a of areas) {
        weights[a.key] = a.weight;
      }
      await apiRequest<void>('/admin/scoring-rules', {
        method: 'PUT',
        json: { weights },
      });
    } catch {
      throw new ServiceError('unavailable');
    }
  },

  async listAllResults(): Promise<ResultWithUser[]> {
    try {
      return await apiRequest<ResultWithUser[]>('/admin/results');
    } catch {
      throw new ServiceError('unavailable');
    }
  },
};
