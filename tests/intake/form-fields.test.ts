import { expect, test } from 'vitest';
import { isIntakeAnswerFieldName } from '../../src/lib/intake/form-fields';

test('only intake answer paths are collected from the form', () => {
  expect(isIntakeAnswerFieldName('business.email')).toBe(true);
  expect(isIntakeAnswerFieldName('needs.store.productTypes')).toBe(true);
  expect(isIntakeAnswerFieldName('consent.contactPermission')).toBe(true);
  expect(isIntakeAnswerFieldName('cf-turnstile-response')).toBe(false);
  expect(isIntakeAnswerFieldName('turnstileToken')).toBe(false);
  expect(isIntakeAnswerFieldName('honeypot')).toBe(false);
});
