import type { ValidationIssue } from '../lib/intake/types';

type FeedbackWindow = Window & {
  fetch: typeof fetch;
  __calypsoValidationFeedbackInstalled?: boolean;
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

function validIssues(value: unknown): ValidationIssue[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.path !== 'string' || typeof item.message !== 'string') return [];
    return [{ path: item.path, message: item.message }];
  });
}

export function canonicalServerIssuePath(path: string): string {
  return path
    .replace(/^answers\./, '')
    .replace(/\.\d+(?=\.|$)/g, '')
    .trim();
}

export function stepIndexForServerIssue(path: string): number | null {
  const canonical = canonicalServerIssuePath(path);
  const index = STEP_PREFIXES.findIndex((prefixes) => prefixes.some((prefix) => canonical.startsWith(prefix)));
  return index >= 0 ? index : null;
}

function activeElement(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current) {
    if (current.hidden) return false;
    current = current.parentElement;
  }
  return true;
}

function controlsForPath(root: ParentNode, path: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[name]'))
    .filter((element) => element.getAttribute('name') === path && activeElement(element));
}

function fieldErrorForPath(step: HTMLElement, path: string): HTMLElement | null {
  for (const error of step.querySelectorAll<HTMLElement>('[data-field-error]')) {
    if (error.dataset.fieldPath === path || error.closest<HTMLElement>('[data-field-path]')?.dataset.fieldPath === path) return error;
  }
  return null;
}

function fieldContainerForPath(step: HTMLElement, path: string): HTMLElement | null {
  return Array.from(step.querySelectorAll<HTMLElement>('[data-field-path]'))
    .find((element) => element.dataset.fieldPath === path) ?? null;
}

function focusAndReveal(element: HTMLElement | null): void {
  if (!element) return;
  element.focus?.({ preventScroll: true });
  element.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
}

export function showServerValidationIssues(document: Document, issues: ValidationIssue[]): boolean {
  const root = document.querySelector<HTMLElement>('[data-intake-wizard]');
  if (!root) return false;

  const normalized = issues.map((issue) => ({
    path: canonicalServerIssuePath(issue.path),
    message: issue.message
  }));
  const earliestStep = normalized
    .map((issue) => stepIndexForServerIssue(issue.path))
    .filter((index): index is number => index !== null)
    .sort((a, b) => a - b)[0];
  if (earliestStep === undefined) return false;

  const progressButton = root.querySelector<HTMLButtonElement>(`[data-progress-step="${earliestStep}"]`);
  progressButton?.click();
  const step = root.querySelector<HTMLElement>(`[data-step-index="${earliestStep}"]`);
  if (!step) return false;

  const stepIssues = normalized.filter((issue) => stepIndexForServerIssue(issue.path) === earliestStep);
  const summary = step.querySelector<HTMLElement>('[data-error-summary]');
  const list = step.querySelector<HTMLElement>('[data-error-list]');
  list?.replaceChildren();

  for (const oldError of step.querySelectorAll<HTMLElement>('[data-field-error]')) {
    oldError.hidden = true;
    oldError.textContent = '';
  }
  for (const control of step.querySelectorAll<HTMLElement>('[aria-invalid="true"]')) control.removeAttribute('aria-invalid');

  for (const issue of stepIssues) {
    const controls = controlsForPath(step, issue.path);
    controls.forEach((control) => control.setAttribute('aria-invalid', 'true'));
    const container = fieldContainerForPath(step, issue.path);
    const error = fieldErrorForPath(step, issue.path);
    if (error) {
      error.textContent = issue.message;
      error.hidden = false;
    }
    if (list) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = controls[0]?.id ? `#${controls[0].id}` : '#';
      link.textContent = issue.message;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        focusAndReveal(controls[0] ?? container);
      });
      item.append(link);
      list.append(item);
    }
  }

  if (summary) summary.hidden = false;
  const submissionError = root.querySelector<HTMLElement>('[data-submission-error]');
  if (submissionError) submissionError.hidden = true;
  focusAndReveal(summary ?? controlsForPath(step, stepIssues[0]?.path ?? '')[0] ?? null);
  return true;
}

function isIntakeRequest(input: RequestInfo | URL, baseUrl: string): boolean {
  try {
    const raw = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    return new URL(raw, baseUrl).pathname === '/api/intake';
  } catch {
    return false;
  }
}

export function installServerValidationFeedback(view: FeedbackWindow): void {
  if (view.__calypsoValidationFeedbackInstalled) return;
  view.__calypsoValidationFeedbackInstalled = true;
  const originalFetch = view.fetch.bind(view);

  view.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init);
    if (!isIntakeRequest(input, view.location.href)) return response;

    void response.clone().json().then((payload: unknown) => {
      if (!isRecord(payload) || payload.code !== 'validation_failed') return;
      const issues = validIssues(payload.issues);
      if (issues.length === 0) return;
      view.setTimeout(() => showServerValidationIssues(view.document, issues), 0);
    }).catch(() => undefined);

    return response;
  }) as typeof fetch;
}

if (typeof window !== 'undefined') installServerValidationFeedback(window as FeedbackWindow);
