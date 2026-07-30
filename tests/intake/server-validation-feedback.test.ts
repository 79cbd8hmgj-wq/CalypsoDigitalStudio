import { Window } from 'happy-dom';
import { expect, test } from 'vitest';
import { DRAFT_KEY } from '../../src/lib/intake/storage';
import {
  canonicalServerIssuePath,
  installServerValidationFeedback,
  showServerValidationIssues,
  stepIndexForServerIssue,
  validateCurrentIntakeForm
} from '../../src/scripts/intake-server-validation-feedback';
import { createValidWebsiteSubmission } from './fixtures';

function createWindow(): Window {
  const window = new Window({ url: 'https://calypsodigitalstudio.pages.dev/start' });
  window.document.body.innerHTML = `
    <div data-intake-wizard>
      ${[0, 1, 2, 3, 4, 5].map((index) => `<button data-progress-step="${index}"></button>`).join('')}
      <form data-intake-form>
        <section data-step-index="0" hidden>
          <section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section>
          <div data-field-path="business.existingWebsite">
            <input id="business-existing-website" name="business.existingWebsite" />
            <p data-field-error hidden></p>
          </div>
          <div data-field-path="business.email">
            <input id="business-email" name="business.email" />
            <p data-field-error hidden></p>
          </div>
        </section>
        ${[1, 2, 3, 4].map((index) => `<section data-step-index="${index}" hidden><section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section></section>`).join('')}
        <section data-step-index="5">
          <section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section>
          <input name="honeypot" value="" />
          <div data-submission-error>Generic error</div>
          <button type="submit">Submit</button>
        </section>
      </form>
    </div>`;

  for (const button of Array.from(window.document.querySelectorAll('[data-progress-step]'))) {
    button.addEventListener('click', () => {
      const target = Number((button as HTMLElement).dataset.progressStep);
      for (const step of Array.from(window.document.querySelectorAll('[data-step-index]'))) {
        (step as HTMLElement).hidden = Number((step as HTMLElement).dataset.stepIndex) !== target;
      }
    });
  }
  return window;
}

function storeValidDraft(window: Window): void {
  const request = createValidWebsiteSubmission();
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify({
    version: 1,
    submissionId: request.submissionId,
    startedAt: request.startedAt,
    updatedAt: new Date().toISOString(),
    currentStep: 5,
    answers: request.answers
  }));
}

test('server issue paths map back to browser field names and steps', () => {
  expect(canonicalServerIssuePath('answers.business.socialLinks.0')).toBe('business.socialLinks');
  expect(canonicalServerIssuePath('budgetAndTiming.budgetRange')).toBe('budgetAndTiming.budgetRange');
  expect(stepIndexForServerIssue('answers.business.email')).toBe(0);
  expect(stepIndexForServerIssue('answers.budgetAndTiming.budgetRange')).toBe(4);
  expect(stepIndexForServerIssue('submissionId')).toBeNull();
});

test('server validation issues open the earliest affected step and highlight its fields', () => {
  const window = createWindow();
  const shown = showServerValidationIssues(window.document as unknown as Document, [
    { path: 'answers.business.existingWebsite', message: 'Use an HTTP or HTTPS web address.' }
  ]);

  const step = window.document.querySelector('[data-step-index="0"]') as unknown as HTMLElement;
  const fieldError = window.document.querySelector('[data-field-path="business.existingWebsite"] [data-field-error]') as unknown as HTMLElement;
  const submissionError = window.document.querySelector('[data-submission-error]') as unknown as HTMLElement;
  expect(shown).toBe(true);
  expect(step.hidden).toBe(false);
  expect(window.document.querySelector('[name="business.existingWebsite"]')?.getAttribute('aria-invalid')).toBe('true');
  expect(fieldError.hidden).toBe(false);
  expect(fieldError.textContent).toContain('HTTP or HTTPS');
  expect(submissionError.hidden).toBe(true);
});

test('the client precheck uses the server schema and returns the exact invalid field', () => {
  const window = createWindow();
  storeValidDraft(window);
  const form = window.document.querySelector('[data-intake-form]') as unknown as HTMLFormElement;
  const website = window.document.querySelector('[name="business.existingWebsite"]') as unknown as HTMLInputElement;
  const email = window.document.querySelector('[name="business.email"]') as unknown as HTMLInputElement;
  website.value = 'not a website';
  email.value = 'jordan@example.com';

  const issues = validateCurrentIntakeForm(form, window.localStorage);
  expect(issues).toContainEqual({
    path: 'business.existingWebsite',
    message: 'Use an HTTP or HTTPS web address.'
  });
});

test('invalid server-schema data is blocked and highlighted before the API request', () => {
  const window = createWindow();
  storeValidDraft(window);
  const form = window.document.querySelector('[data-intake-form]') as unknown as HTMLFormElement;
  const website = window.document.querySelector('[name="business.existingWebsite"]') as unknown as HTMLInputElement;
  const email = window.document.querySelector('[name="business.email"]') as unknown as HTMLInputElement;
  website.value = 'not a website';
  email.value = 'jordan@example.com';

  installServerValidationFeedback(window as unknown as Parameters<typeof installServerValidationFeedback>[0]);
  const event = new window.Event('submit', { bubbles: true, cancelable: true });
  const allowed = form.dispatchEvent(event);

  const step = window.document.querySelector('[data-step-index="0"]') as unknown as HTMLElement;
  expect(allowed).toBe(false);
  expect(event.defaultPrevented).toBe(true);
  expect(step.hidden).toBe(false);
  expect(website.getAttribute('aria-invalid')).toBe('true');
  expect(window.document.querySelector('[data-error-list]')?.textContent).toContain('HTTP or HTTPS');
});
