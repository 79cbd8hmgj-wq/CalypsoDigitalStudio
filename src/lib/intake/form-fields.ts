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
