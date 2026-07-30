import type { ValidationIssue } from '../lib/intake/types';

type FeedbackWindow = Window & {
  fetch: typeof fetch;
  __calypsoIntakeResponseFeedbackInstalled?: boolean;
};

const STEP_PREFIXES: ReadonlyArray<readonly string[]> = [
  ['business.'],
  ['project.'],
  ['needs.'],
  ['materials.'],
  ['budgetAndTiming.'],
  ['contact.', 'consent.']
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePath(path: string): string {
  return path
    .replace(/^answers\./, '')
    .replace(/\.\d+(?=\.|$)/g, '')
    .trim();
}

function stepForPath(path: string): number | null {
  const normalized = normalizePath(path);
  const index = STEP_PREFIXES.findIndex((prefixes) => prefixes.some((prefix) => normalized.startsWith(prefix)));
  return index >= 0 ? index : null;
}

function parseIssues(value: unknown): ValidationIssue[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.path !== 'string' || typeof item.message !== 'string') return [];
    return [{ path: normalizePath(item.path), message: item.message }];
  });
}

function isIntakeRequest(input: RequestInfo | URL, baseUrl: string): boolean {
  try {
    const raw = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    return new URL(raw, baseUrl).pathname === '/api/intake';
  } catch {
    return false;
  }
}

function visibleControl(root: ParentNode, path: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('[name]'))
    .find((element) => element.getAttribute('name') === path) ?? null;
}

function fieldContainer(step: HTMLElement, path: string): HTMLElement | null {
  return Array.from(step.querySelectorAll<HTMLElement>('[data-field-path]'))
    .find((element) => element.dataset.fieldPath === path) ?? null;
}

function fieldError(step: HTMLElement, path: string): HTMLElement | null {
  return Array.from(step.querySelectorAll<HTMLElement>('[data-field-error]'))
    .find((element) => element.dataset.fieldPath === path || element.closest<HTMLElement>('[data-field-path]')?.dataset.fieldPath === path) ?? null;
}

function focusAndReveal(element: HTMLElement | null): void {
  if (!element) return;
  element.focus?.({ preventScroll: true });
  element.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
}

function showFallback(root: HTMLElement, issues: ValidationIssue[]): void {
  const generic = root.querySelector<HTMLElement>('[data-submission-error]');
  if (!generic) return;
  const details = issues.map((issue) => `${issue.path}: ${issue.message}`).join(' ');
  generic.textContent = `Please correct the following project details: ${details}`;
  generic.hidden = false;
  focusAndReveal(generic);
}

export function showIntakeValidationIssues(document: Document, rawIssues: ValidationIssue[]): boolean {
  const root = document.querySelector<HTMLElement>('[data-intake-wizard]');
  if (!root) return false;

  const issues = rawIssues.map((issue) => ({ path: normalizePath(issue.path), message: issue.message }));
  const earliestStep = issues
    .map((issue) => stepForPath(issue.path))
    .filter((index): index is number => index !== null)
    .sort((a, b) => a - b)[0];

  if (earliestStep === undefined) {
    showFallback(root, issues);
    return false;
  }

  root.querySelector<HTMLButtonElement>(`[data-progress-step="${earliestStep}"]`)?.click();
  const step = root.querySelector<HTMLElement>(`[data-step-index="${earliestStep}"]`);
  if (!step) {
    showFallback(root, issues);
    return false;
  }

  if (step.hidden) {
    for (const candidate of root.querySelectorAll<HTMLElement>('[data-step-index]')) {
      candidate.hidden = Number(candidate.dataset.stepIndex) !== earliestStep;
    }
  }

  const stepIssues = issues.filter((issue) => stepForPath(issue.path) === earliestStep);
  const summary = step.querySelector<HTMLElement>('[data-error-summary]');
  const list = step.querySelector<HTMLElement>('[data-error-list]');
  list?.replaceChildren();

  for (const error of step.querySelectorAll<HTMLElement>('[data-field-error]')) {
    error.hidden = true;
    error.textContent = '';
  }
  for (const control of step.querySelectorAll<HTMLElement>('[aria-invalid="true"]')) {
    control.removeAttribute('aria-invalid');
  }

  for (const issue of stepIssues) {
    const control = visibleControl(step, issue.path);
    const container = fieldContainer(step, issue.path);
    control?.setAttribute('aria-invalid', 'true');

    const error = fieldError(step, issue.path);
    if (error) {
      error.textContent = issue.message;
      error.hidden = false;
    }

    if (list) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = control?.id ? `#${control.id}` : '#';
      link.textContent = issue.message;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        focusAndReveal(control ?? container);
      });
      item.append(link);
      list.append(item);
    }
  }

  if (summary) summary.hidden = false;
  const generic = root.querySelector<HTMLElement>('[data-submission-error]');
  if (generic) generic.hidden = true;
  focusAndReveal(summary ?? visibleControl(step, stepIssues[0]?.path ?? '') ?? null);
  return true;
}

export function installIntakeResponseFeedback(view: FeedbackWindow): void {
  if (view.__calypsoIntakeResponseFeedbackInstalled) return;
  view.__calypsoIntakeResponseFeedbackInstalled = true;
  const originalFetch = view.fetch.bind(view);

  view.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init);
    if (!isIntakeRequest(input, view.location.href)) return response;

    try {
      const payload: unknown = await response.clone().json();
      if (!isRecord(payload) || payload.code !== 'validation_failed') return response;
      const issues = parseIssues(payload.issues);
      if (issues.length === 0) return response;

      view.setTimeout(() => {
        showIntakeValidationIssues(view.document, issues);
      }, 0);
    } catch {
      // The wizard keeps its existing generic delivery message when the response is not JSON.
    }

    return response;
  }) as typeof fetch;
}
