import { Window } from 'happy-dom';
import { expect, test, vi } from 'vitest';
import {
  canonicalServerIssuePath,
  installServerValidationFeedback,
  showServerValidationIssues,
  stepIndexForServerIssue
} from '../../src/scripts/intake-server-validation-feedback';

test('server issue paths map back to browser field names and steps', () => {
  expect(canonicalServerIssuePath('answers.business.socialLinks.0')).toBe('business.socialLinks');
  expect(canonicalServerIssuePath('budgetAndTiming.budgetRange')).toBe('budgetAndTiming.budgetRange');
  expect(stepIndexForServerIssue('answers.business.email')).toBe(0);
  expect(stepIndexForServerIssue('answers.budgetAndTiming.budgetRange')).toBe(4);
  expect(stepIndexForServerIssue('submissionId')).toBeNull();
});

test('server validation issues open the earliest affected step and highlight its fields', () => {
  const window = new Window({ url: 'https://calypsodigitalstudio.pages.dev/start' });
  window.document.body.innerHTML = `
    <div data-intake-wizard>
      <button data-progress-step="0"></button>
      <button data-progress-step="4"></button>
      <section data-step-index="0" hidden></section>
      <section data-step-index="4" hidden>
        <section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section>
        <div data-field-path="budgetAndTiming.budgetRange">
          <select name="budgetAndTiming.budgetRange"><option value="">Choose</option></select>
          <p data-field-error hidden></p>
        </div>
      </section>
      <div data-submission-error>Generic error</div>
    </div>`;
  const step = window.document.querySelector('[data-step-index="4"]') as unknown as HTMLElement;
  const progress = window.document.querySelector('[data-progress-step="4"]') as unknown as HTMLButtonElement;
  progress.addEventListener('click', () => {
    step.hidden = false;
  });

  const shown = showServerValidationIssues(window.document as unknown as Document, [
    { path: 'answers.budgetAndTiming.budgetRange', message: 'Choose a valid budget range.' }
  ]);

  const fieldError = window.document.querySelector('[data-field-error]') as unknown as HTMLElement;
  const submissionError = window.document.querySelector('[data-submission-error]') as unknown as HTMLElement;
  expect(shown).toBe(true);
  expect(step.hidden).toBe(false);
  expect(window.document.querySelector('[name="budgetAndTiming.budgetRange"]')?.getAttribute('aria-invalid')).toBe('true');
  expect(fieldError.hidden).toBe(false);
  expect(window.document.querySelector('[data-error-list]')?.textContent).toContain('Choose a valid budget range.');
  expect(submissionError.hidden).toBe(true);
});

test('the fetch interceptor preserves server issues and displays them after validation fails', async () => {
  const window = new Window({ url: 'https://calypsodigitalstudio.pages.dev/start' });
  window.document.body.innerHTML = `
    <div data-intake-wizard>
      <button data-progress-step="0"></button>
      <section data-step-index="0" hidden>
        <section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section>
        <div data-field-path="business.email">
          <input name="business.email" />
          <p data-field-error hidden></p>
        </div>
      </section>
      <div data-submission-error></div>
    </div>`;
  const step = window.document.querySelector('[data-step-index="0"]') as unknown as HTMLElement;
  const progress = window.document.querySelector('[data-progress-step="0"]') as unknown as HTMLButtonElement;
  progress.addEventListener('click', () => {
    step.hidden = false;
  });
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({
    ok: false,
    code: 'validation_failed',
    issues: [{ path: 'business.email', message: 'Enter a valid email address.' }]
  }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
  Object.defineProperty(window, 'fetch', { value: fetchMock, writable: true });

  installServerValidationFeedback(window as unknown as Parameters<typeof installServerValidationFeedback>[0]);
  await (window.fetch as unknown as typeof fetch)('/api/intake', { method: 'POST' });
  await new Promise((resolve) => window.setTimeout(resolve, 0));

  expect(fetchMock).toHaveBeenCalledOnce();
  expect(step.hidden).toBe(false);
  expect(window.document.querySelector('[name="business.email"]')?.getAttribute('aria-invalid')).toBe('true');
  expect(window.document.querySelector('[data-error-list]')?.textContent).toContain('Enter a valid email address.');
});
