// @vitest-environment happy-dom
import { beforeEach, expect, test, vi } from 'vitest';
import {
  DRAFT_KEY,
  DRAFT_TTL_MS,
  clearDraft,
  createEmptyDraft,
  loadDraft,
  saveDraft
} from '../../src/lib/intake/storage';

beforeEach(() => {
  localStorage.clear();
});

test('creates a complete empty version-one draft', () => {
  vi.stubGlobal('crypto', { randomUUID: () => '11111111-2222-4333-8444-555555555555' });
  const draft = createEmptyDraft(new Date('2026-07-29T12:00:00.000Z'));
  expect(draft).toMatchObject({
    version: 1,
    submissionId: '11111111-2222-4333-8444-555555555555',
    startedAt: '2026-07-29T12:00:00.000Z',
    updatedAt: '2026-07-29T12:00:00.000Z',
    currentStep: 0
  });
  expect(draft.answers.business.fullName).toBe('');
  expect(draft.answers.needs.store.productTypes).toEqual([]);
  expect(draft.answers.consent.accurate).toBe(false);
});

test('round trips a valid draft', () => {
  const draft = createEmptyDraft(new Date('2026-07-29T12:00:00.000Z'));
  draft.answers.business.fullName = 'Jordan';
  expect(saveDraft(draft)).toBe(true);
  expect(loadDraft(new Date('2026-07-30T12:00:00.000Z'))?.answers.business.fullName).toBe('Jordan');
});

test('expires drafts thirty days after the last update', () => {
  const draft = createEmptyDraft(new Date('2026-06-01T12:00:00.000Z'));
  saveDraft(draft);
  expect(loadDraft(new Date(draft.updatedAt).getTime() + DRAFT_TTL_MS + 1)).toBeNull();
  expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
});

test('deletes malformed and wrong-version drafts', () => {
  localStorage.setItem(DRAFT_KEY, '{bad');
  expect(loadDraft()).toBeNull();
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 2 }));
  expect(loadDraft()).toBeNull();
  expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
});

test('blocked storage never throws and reports failure', () => {
  const draft = createEmptyDraft();
  const storage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); }
  } as unknown as Storage;
  expect(saveDraft(draft, storage)).toBe(false);
  expect(loadDraft(new Date(), storage)).toBeNull();
  expect(() => clearDraft(storage)).not.toThrow();
});

test('clear removes the saved key', () => {
  saveDraft(createEmptyDraft());
  clearDraft();
  expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
});
