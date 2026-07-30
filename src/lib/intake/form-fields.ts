import type { IntakeAnswers } from './types';

const TURNSTILE_WIDGET_FIELD = 'cf-turnstile-response';

const INTAKE_ANSWER_PREFIXES = [
  'business.',
  'project.',
  'needs.',
  'materials.',
  'budgetAndTiming.',
  'contact.',
  'consent.'
] as const;

export function isIntakeAnswerFieldName(name: string): boolean {
  return INTAKE_ANSWER_PREFIXES.some((prefix) => name.startsWith(prefix));
}

export function sanitizeStoredIntakeAnswers(answers: IntakeAnswers): IntakeAnswers {
  const sanitized = structuredClone(answers);
  delete (sanitized as unknown as Record<string, unknown>)[TURNSTILE_WIDGET_FIELD];
  return sanitized;
}
