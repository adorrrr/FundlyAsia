import type { Answers, BusinessProfile, Question } from '@/types';

/** Whether a question applies given the current answers (conditional display). */
export function isVisible(q: Question, answers: Answers) {
  if (!q.active) return false;
  if (!q.showWhen) return true;
  return answers[q.showWhen.questionId] === q.showWhen.equals;
}

export function visibleForStep(questions: Question[], step: number, answers: Answers) {
  return questions.filter((q) => q.step === step && isVisible(q, answers));
}

/** Drop answers to questions that no longer apply, so hidden values are never submitted. */
export function pruneHidden(questions: Question[], answers: Answers): Answers {
  const out: Answers = {};
  questions.forEach((q) => {
    if (isVisible(q, answers) && answers[q.id] != null && answers[q.id] !== '') out[q.id] = answers[q.id];
  });
  return out;
}

export function prefillFromProfile(questions: Question[], profile: BusinessProfile | null): Answers {
  const a: Answers = {};
  if (!profile) return a;
  questions.forEach((q) => {
    if (q.prefillFrom && profile[q.prefillFrom]) a[q.id] = String(profile[q.prefillFrom]);
  });
  return a;
}

/** Validate only what the schema states: required + numeric format. No business rules are invented here. */
export function validateStep(questions: Question[], step: number, answers: Answers, msg: { required: string; number: string; positive: string }) {
  const errors: Record<string, string> = {};
  visibleForStep(questions, step, answers).forEach((q) => {
    const v = (answers[q.id] ?? '').trim();
    if (q.required && !v) errors[q.id] = msg.required;
    else if (v && (q.answerType === 'number' || q.answerType === 'currency')) {
      const n = Number(v.replace(/,/g, ''));
      if (Number.isNaN(n)) errors[q.id] = msg.number;
      else if (n < 0) errors[q.id] = msg.positive;
    }
  });
  return errors;
}
