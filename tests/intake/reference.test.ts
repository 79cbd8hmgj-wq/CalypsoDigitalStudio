import { expect, test } from 'vitest';
import { createSubmissionReference } from '../../src/lib/intake/reference';

test('creates a stable public reference from a UUID', () => {
  expect(createSubmissionReference('11111111-2222-4333-8444-555555555555'))
    .toBe('CDS-1111111122');
});

test('rejects malformed UUIDs', () => {
  expect(() => createSubmissionReference('bad')).toThrow('Invalid submission UUID');
});
