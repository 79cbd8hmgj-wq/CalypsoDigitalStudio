const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createSubmissionReference(submissionId: string): string {
  if (!UUID_PATTERN.test(submissionId)) throw new Error('Invalid submission UUID');
  return `CDS-${submissionId.replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}

export function isValidSubmissionId(submissionId: string): boolean {
  return UUID_PATTERN.test(submissionId);
}
