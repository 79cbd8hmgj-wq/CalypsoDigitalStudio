import { describe, expect, test } from 'vitest';
import { MAX_REQUEST_BYTES, validateAndNormalizeIntake } from '../../src/lib/intake/schema';
import { createValidWebsiteSubmission } from './fixtures';

function expectValid(input = createValidWebsiteSubmission()) {
  const result = validateAndNormalizeIntake(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
}

test('accepts and normalizes a valid website submission', () => {
  const request = createValidWebsiteSubmission();
  request.answers.business.existingWebsite = 'example.com';
  request.answers.business.serviceAreas = ['regional', 'regional'];
  const value = expectValid(request);
  expect(value.reference).toBe('CDS-1111111122');
  expect(value.answers.business.existingWebsite).toBe('https://example.com/');
  expect(value.answers.business.serviceAreas).toEqual(['regional']);
});

test('removes inactive branch data', () => {
  const request = createValidWebsiteSubmission();
  request.answers.needs.store.productCount = '26-50';
  const value = expectValid(request);
  expect(value.answers.needs.store.productCount).toBe('');
});

test('rejects missing common required fields and consent', () => {
  const request = createValidWebsiteSubmission();
  request.answers.business.fullName = '';
  request.answers.consent.accurate = false;
  const result = validateAndNormalizeIntake(request);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining([
    'business.fullName',
    'consent.accurate'
  ]));
});

test('enforces phone without requiring budget or timing fields', () => {
  const request = createValidWebsiteSubmission();
  request.answers.contact.preferredMethod = 'phone';
  request.answers.budgetAndTiming = {
    budgetRange: '', supportType: '', preferredTiming: '', launchDate: '', dateFlexibility: '',
    deadlineContext: '', readiness: '', decisionMaker: '', otherApprovers: ''
  };
  const result = validateAndNormalizeIntake(request);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.issues.map((issue) => issue.path)).toContain('business.phone');
  expect(result.issues.some((issue) => issue.path.startsWith('budgetAndTiming.'))).toBe(false);
});

test('rejects malformed envelope values and unknown top-level keys', () => {
  const request = createValidWebsiteSubmission() as unknown as Record<string, unknown>;
  request.submissionId = 'bad';
  request.extra = true;
  const result = validateAndNormalizeIntake(request);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['submissionId', 'extra']));
});

test('rejects invalid email, URL scheme, and overly long text', () => {
  const request = createValidWebsiteSubmission();
  request.answers.business.email = 'not-an-email';
  request.answers.business.existingWebsite = 'javascript:alert(1)';
  request.answers.business.offer = 'x'.repeat(2001);
  const result = validateAndNormalizeIntake(request);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining([
    'business.email',
    'business.existingWebsite',
    'business.offer'
  ]));
});

test('accepts recognized historical budget data as ignored compatibility data', () => {
  const request = createValidWebsiteSubmission();
  Object.assign(request.answers.budgetAndTiming, {
    budgetRange: 'legacy-range',
    supportType: 'legacy-support',
    preferredTiming: 'legacy-timing',
    launchDate: 'not-a-date',
    dateFlexibility: 'legacy-flexibility',
    deadlineContext: 'Historical deadline context',
    readiness: 'legacy-readiness',
    decisionMaker: 'legacy-decision-maker',
    otherApprovers: 'Historical approver'
  });
  expect(validateAndNormalizeIntake(request).ok).toBe(true);
});

describe('primary project branches', () => {
  test.each([
    ['website-redesign', (request: ReturnType<typeof createValidWebsiteSubmission>) => {
      request.answers.business.existingWebsite = 'https://example.com';
      request.answers.needs.redesign.changeMost = 'Improve the structure.';
    }],
    ['online-store', (request: ReturnType<typeof createValidWebsiteSubmission>) => {
      request.answers.needs.store.productCount = '1-10';
      request.answers.needs.store.productTypes = ['physical'];
    }],
    ['custom-tool', (request: ReturnType<typeof createValidWebsiteSubmission>) => {
      Object.assign(request.answers.needs.customTool, {
        processToImprove: 'Client intake', currentProcess: 'Email', users: 'Owner',
        outputs: 'Organized request', biggestProblem: 'Missing details', successLooksLike: 'Complete requests'
      });
    }],
    ['ongoing-support', (request: ReturnType<typeof createValidWebsiteSubmission>) => {
      request.answers.business.existingWebsite = 'https://example.com';
      Object.assign(request.answers.needs.support, {
        helpTypes: ['content'], supportCadence: 'one-time', urgency: 'normal',
        currentIssue: 'Outdated copy', desiredResult: 'Updated pages', accessStatus: 'yes'
      });
    }],
    ['not-sure', (request: ReturnType<typeof createValidWebsiteSubmission>) => {
      Object.assign(request.answers.needs.notSure, {
        improveOnline: 'Generate more inquiries', currentProblem: 'Customers are confused',
        desiredCapabilities: 'Request quotes', outcomes: ['inquiries']
      });
    }]
  ] as const)('accepts a complete %s path', (primaryType, prepare) => {
    const request = createValidWebsiteSubmission();
    request.answers.project.primaryType = primaryType;
    request.answers.project.addOns = [];
    prepare(request);
    expect(validateAndNormalizeIntake(request).ok).toBe(true);
  });
});

test('uses the exact 100 KB request limit', () => {
  expect(MAX_REQUEST_BYTES).toBe(100 * 1024);
});
