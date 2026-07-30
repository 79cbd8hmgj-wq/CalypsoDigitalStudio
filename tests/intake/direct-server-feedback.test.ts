import { Window } from 'happy-dom';
import { expect, test, vi } from 'vitest';
import {
  installIntakeResponseFeedback,
  showIntakeValidationIssues
} from '../../src/scripts/intake-response-feedback';

function buildWindow(): Window {
  const window = new Window({ url: 'https://calypsodigitalstudio.pages.dev/start' });
  window.document.body.innerHTML = `
    <div data-intake-wizard>
      ${[0, 1, 2, 3, 4, 5].map((index) => `<button data-progress-step="${index}"></button>`).join('')}
      ${[0, 1, 2, 3, 4, 5].map((index) => `
        <section data-step-index="${index}" ${index === 5 ? '' : 'hidden'}>
          <section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section>
          ${index === 0 ? `
            <div data-field-path="business.existingWebsite">
              <input id="business-existing-website" name="business.existingWebsite" />
              <p data-field-error hidden></p>
            </div>` : ''}
        </section>`).join('')}
      <div data-submission-error>Some project details need attention.</div>
    </div>`;

  for (const rawButton of Array.from(window.document.querySelectorAll('[data-progress-step]'))) {
    const button = rawButton as unknown as HTMLElement;
    button.addEventListener('click', () => {
      const target = Number(button.dataset.progressStep);
      for (const rawStep of Array.from(window.document.querySelectorAll('[data-step-index]'))) {
        const step = rawStep as unknown as HTMLElement;
        step.hidden = Number(step.dataset.stepIndex) !== target;
      }
    });
  }
  return window;
}

test('validation feedback opens the earliest affected step and highlights the exact field', () => {
  const window = buildWindow();

  const shown = showIntakeValidationIssues(window.document as unknown as Document, [
    { path: 'business.existingWebsite', message: 'Use an HTTP or HTTPS web address.' }
  ]);

  const step = window.document.querySelector('[data-step-index="0"]') as unknown as HTMLElement;
  const field = window.document.querySelector('[name="business.existingWebsite"]') as unknown as HTMLElement;
  const fieldError = window.document.querySelector('[data-field-path="business.existingWebsite"] [data-field-error]') as unknown as HTMLElement;
  const genericError = window.document.querySelector('[data-submission-error]') as unknown as HTMLElement;

  expect(shown).toBe(true);
  expect(step.hidden).toBe(false);
  expect(field.getAttribute('aria-invalid')).toBe('true');
  expect(fieldError.hidden).toBe(false);
  expect(fieldError.textContent).toContain('HTTP or HTTPS');
  expect(genericError.hidden).toBe(true);
});

test('response feedback runs after the wizard generic error and reveals the API issues', async () => {
  const window = buildWindow();
  const originalFetch = vi.fn(async () => new Response(JSON.stringify({
    ok: false,
    code: 'validation_failed',
    issues: [{ path: 'business.existingWebsite', message: 'Use an HTTP or HTTPS web address.' }]
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  }));
  Object.defineProperty(window, 'fetch', { value: originalFetch, writable: true });

  installIntakeResponseFeedback(window as unknown as Parameters<typeof installIntakeResponseFeedback>[0]);
  const response = await (window.fetch as unknown as typeof fetch)('/api/intake', { method: 'POST' });
  expect(response.status).toBe(400);

  const genericError = window.document.querySelector('[data-submission-error]') as unknown as HTMLElement;
  genericError.hidden = false;
  genericError.textContent = 'Some project details need attention. Review the highlighted fields and submit again.';

  await new Promise((resolve) => window.setTimeout(resolve, 0));

  const step = window.document.querySelector('[data-step-index="0"]') as unknown as HTMLElement;
  const field = window.document.querySelector('[name="business.existingWebsite"]') as unknown as HTMLElement;
  expect(originalFetch).toHaveBeenCalledOnce();
  expect(step.hidden).toBe(false);
  expect(field.getAttribute('aria-invalid')).toBe('true');
  expect(window.document.querySelector('[data-error-list]')?.textContent).toContain('HTTP or HTTPS');
  expect(genericError.hidden).toBe(true);
});
