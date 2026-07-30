import { Window } from 'happy-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { DRAFT_KEY } from '../../src/lib/intake/storage';
import { initializeIntakeWizard, sendIntakeRequest, turnstileErrorMessage } from '../../src/scripts/intake-wizard';
import { createValidWebsiteSubmission } from './fixtures';

function html(): string {
  return `
  <div data-intake-wizard data-turnstile-site-key="test-key" data-submission-enabled="true">
    <section data-intake-welcome><button data-start-intake>Start Your Project</button></section>
    <section data-restore-notice hidden><button data-restore-draft>Continue Saved Project</button><button data-start-over>Start Over</button></section>
    <section data-wizard-shell hidden>
      <p data-progress-current></p>
      ${[0,1,2,3,4,5].map((index) => `<button data-progress-step="${index}" ${index ? 'disabled' : ''}></button>`).join('')}
      <form data-intake-form novalidate>
        ${[0,1,2,3,4,5].map((index) => `<section data-step-index="${index}" data-step-id="${['business','project','needs','materials','budget','review'][index]}" ${index ? 'hidden' : ''}><header class="step-heading" tabindex="-1"></header><section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section>${index === 0 ? '<div data-field-path="business.fullName"><input name="business.fullName"><p data-field-error hidden></p></div><div data-field-path="business.businessName"><input name="business.businessName"><p data-field-error hidden></p></div><div data-field-path="business.email"><input name="business.email"><p data-field-error hidden></p></div><div data-field-path="business.location"><input name="business.location"><p data-field-error hidden></p></div><div data-field-path="business.serviceAreas"><input type="checkbox" name="business.serviceAreas" value="local"><p data-field-error hidden></p></div><div data-field-path="business.offer"><textarea name="business.offer"></textarea><p data-field-error hidden></p></div><div data-field-path="business.customers"><textarea name="business.customers"></textarea><p data-field-error hidden></p></div>' : ''}${index === 1 ? '<input type="radio" name="project.primaryType" value="new-website"><input type="radio" name="project.primaryType" value="custom-tool"><input type="checkbox" name="project.addOns" value="booking">' : ''}${index === 2 ? '<div data-condition="standard-website" hidden></div><div data-condition="custom-tool" hidden></div>' : ''}${index === 5 ? '<div data-review-summary></div><div data-turnstile-widget></div><p data-turnstile-status></p><button type="button" data-turnstile-retry hidden>Try security check again</button><div data-submission-error hidden></div>' : ''}</section>`).join('')}
        <button type="button" data-back hidden>Back</button><span data-save-status></span><button type="button" data-continue>Continue</button><button type="submit" data-submit hidden>Submit</button>
      </form>
    </section>
    <section data-submission-confirmation hidden><h2></h2><span data-confirmation-reference></span><span data-confirmation-email></span><p data-confirmation-message></p><button data-new-request></button></section>
  </div>`;
}

let window: Window;
let root: HTMLElement;

beforeEach(() => {
  window = new Window({ url: 'https://example.com/start' });
  window.document.body.innerHTML = html();
  root = window.document.querySelector('[data-intake-wizard]') as unknown as HTMLElement;
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', window.document);
  vi.stubGlobal('localStorage', window.localStorage);
  vi.stubGlobal('history', window.history);
  vi.stubGlobal('location', window.location);
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('crypto', window.crypto);
  vi.stubGlobal('HTMLElement', window.HTMLElement);
  vi.stubGlobal('HTMLFormElement', window.HTMLFormElement);
  vi.stubGlobal('HTMLInputElement', window.HTMLInputElement);
  vi.stubGlobal('HTMLSelectElement', window.HTMLSelectElement);
  vi.stubGlobal('HTMLTextAreaElement', window.HTMLTextAreaElement);
});

afterEach(() => vi.unstubAllGlobals());

test('start button creates a saved draft and opens step one', () => {
  initializeIntakeWizard(root);
  (root.querySelector('[data-start-intake]') as HTMLButtonElement).click();

  expect(root.querySelector('[data-wizard-shell]')?.hasAttribute('hidden')).toBe(false);
  expect(window.localStorage.getItem(DRAFT_KEY)).toContain('"currentStep":0');
  expect(window.location.hash).toBe('#business');
});

test('continue validates required fields and focuses the error summary', () => {
  initializeIntakeWizard(root);
  (root.querySelector('[data-start-intake]') as HTMLButtonElement).click();
  (root.querySelector('[data-continue]') as HTMLButtonElement).click();

  const summary = root.querySelector('[data-step-index="0"] [data-error-summary]') as HTMLElement;
  expect(summary.hidden).toBe(false);
  expect(summary.querySelectorAll('li').length).toBeGreaterThan(0);
  expect(window.document.activeElement).toBe(summary);
  expect(root.querySelector('[data-step-index="0"]')?.hasAttribute('hidden')).toBe(false);
});

test('valid step navigation saves immediately and updates the hash', () => {
  initializeIntakeWizard(root);
  (root.querySelector('[data-start-intake]') as HTMLButtonElement).click();
  const set = (name: string, value: string) => {
    const input = root.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement;
    input.value = value;
    input.dispatchEvent(new window.Event('input', { bubbles: true }) as unknown as Event);
  };
  set('business.fullName', 'Jordan');
  set('business.businessName', 'Example Studio');
  set('business.email', 'jordan@example.com');
  set('business.location', 'Albany, NY');
  set('business.offer', 'Photography');
  set('business.customers', 'Families');
  const area = root.querySelector('[name="business.serviceAreas"]') as HTMLInputElement;
  area.checked = true;
  area.dispatchEvent(new window.Event('change', { bubbles: true }) as unknown as Event);

  (root.querySelector('[data-continue]') as HTMLButtonElement).click();

  expect(root.querySelector('[data-step-index="1"]')?.hasAttribute('hidden')).toBe(false);
  expect(window.location.hash).toBe('#project');
  expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}').currentStep).toBe(1);
});

test('project selection updates conditional sections', () => {
  initializeIntakeWizard(root);
  (root.querySelector('[data-start-intake]') as HTMLButtonElement).click();
  (root.querySelector('[data-step-index="0"]') as HTMLElement).hidden = true;
  (root.querySelector('[data-step-index="1"]') as HTMLElement).hidden = false;
  const type = root.querySelector('[name="project.primaryType"][value="custom-tool"]') as HTMLInputElement;
  type.checked = true;
  type.dispatchEvent(new window.Event('change', { bubbles: true }) as unknown as Event);

  expect(root.querySelector('[data-condition="custom-tool"]')?.hasAttribute('hidden')).toBe(false);
  expect(root.querySelector('[data-condition="standard-website"]')?.hasAttribute('hidden')).toBe(true);
});

test('a valid stored draft reveals the restore choice', () => {
  const timestamp = new Date().toISOString();
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify({
    version: 1,
    submissionId: '11111111-2222-4333-8444-555555555555',
    startedAt: timestamp,
    updatedAt: timestamp,
    currentStep: 2,
    answers: {
      business: { fullName: 'Jordan', businessName: 'Example', email: 'jordan@example.com', phone: '', location: 'Albany', serviceAreas: ['local'], existingWebsite: '', socialLinks: [], offer: 'Photos', customers: 'Families', difference: '' },
      project: { primaryType: 'new-website', addOns: [], otherAddOn: '' },
      needs: { goals: [], otherGoal: '', pages: [], otherPage: '', features: [], otherFeature: '', redesign: {}, store: {}, customTool: {}, support: {}, notSure: {}, booking: {}, payments: {}, customForms: {}, maintenance: {} },
      materials: { available: [], visualWords: [], customVisualWord: '', brandMustRemain: '', avoid: '', likedSites: [], likedReasons: '', dislikedSites: [], dislikedReasons: '' },
      budgetAndTiming: { budgetRange: '', supportType: '', preferredTiming: '', launchDate: '', dateFlexibility: '', deadlineContext: '', readiness: '', decisionMaker: '', otherApprovers: '' },
      contact: { preferredMethod: '', preferredTime: '', timeZone: '', socialAccount: '', additionalInfo: '', referralSource: '' },
      consent: { accurate: false, contactPermission: false }
    }
  }));

  initializeIntakeWizard(root);
  expect(root.querySelector('[data-restore-notice]')?.hasAttribute('hidden')).toBe(false);
});

test('Turnstile hidden response is never saved as a project answer', () => {
  initializeIntakeWizard(root);
  (root.querySelector('[data-start-intake]') as HTMLButtonElement).click();

  const form = root.querySelector('[data-intake-form]') as HTMLFormElement;
  const hiddenResponse = window.document.createElement('input') as unknown as HTMLInputElement;
  hiddenResponse.type = 'hidden';
  hiddenResponse.name = 'cf-turnstile-response';
  hiddenResponse.value = 'verified-token';
  form.append(hiddenResponse);
  hiddenResponse.dispatchEvent(new window.Event('input', { bubbles: true }) as unknown as Event);
  (root.querySelector('[data-progress-step="0"]') as HTMLButtonElement).click();

  const stored = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}');
  expect(stored.answers).not.toHaveProperty('cf-turnstile-response');
});

test('sendIntakeRequest posts JSON and returns the safe success payload', async () => {
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init?.body)).answers.business.businessName).toBe('Example Studio');
    return new Response(JSON.stringify({ ok: true, reference: 'CDS-1111111122', confirmationEmailSent: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  });

  const result = await sendIntakeRequest(createValidWebsiteSubmission(), fetchMock as unknown as typeof fetch, 1000);
  expect(result).toEqual({ ok: true, reference: 'CDS-1111111122', confirmationEmailSent: true });
});

test('sendIntakeRequest maps a server code without exposing provider details', async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: false, code: 'verification_failed' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  }));
  const result = await sendIntakeRequest(createValidWebsiteSubmission(), fetchMock as unknown as typeof fetch, 1000);
  expect(result).toEqual({ ok: false, code: 'verification_failed' });
});

test('missing Turnstile key disables final submission', () => {
  root.dataset.turnstileSiteKey = '';
  root.dataset.submissionEnabled = 'false';
  initializeIntakeWizard(root);
  (root.querySelector('[data-start-intake]') as HTMLButtonElement).click();
  const submit = root.querySelector('[data-submit]') as HTMLButtonElement;
  const status = root.querySelector('[data-turnstile-status]') as HTMLElement | null;
  expect(submit.disabled).toBe(true);
  expect(status?.textContent ?? '').toContain('temporarily unavailable');
});

test('Turnstile configuration errors expose the exact diagnostic code', () => {
  expect(turnstileErrorMessage('110200')).toContain('110200');
  expect(turnstileErrorMessage('110200')).toContain('hostname');
  expect(turnstileErrorMessage('110100')).toContain('site key');
});

test('Turnstile network and challenge failures expose recovery guidance', () => {
  expect(turnstileErrorMessage('200500')).toContain('200500');
  expect(turnstileErrorMessage('200500')).toContain('connection');
  expect(turnstileErrorMessage('600123')).toContain('600123');
  expect(turnstileErrorMessage('600123')).toContain('different browser');
});
