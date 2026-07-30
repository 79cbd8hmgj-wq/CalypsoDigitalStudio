import { isIntakeAnswerFieldName } from '../lib/intake/form-fields';
import { validateAndNormalizeIntake } from '../lib/intake/schema';
import { loadDraft } from '../lib/intake/storage';
import type { IntakeAnswers, IntakeSubmissionRequest, ValidationIssue } from '../lib/intake/types';

type FeedbackWindow = Window & {
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

function setPath(value: unknown, path: string, replacement: unknown): void {
  const keys = path.split('.');
  let current: unknown = value;
  for (let index = 0; index < keys.length - 1; index += 1) {
    if (!isRecord(current)) return;
    current = current[keys[index] as string];
  }
  if (isRecord(current)) current[keys.at(-1) as string] = replacement;
}

function isNamedControl(element: unknown): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  if (typeof element !== 'object' || element === null) return false;
  const candidate = element as { name?: unknown; tagName?: unknown; value?: unknown };
  return typeof candidate.name === 'string' && typeof candidate.tagName === 'string' && 'value' in candidate;
}

function isInput(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): element is HTMLInputElement {
  return element.tagName.toLowerCase() === 'input';
}

function isIntakeFormTarget(target: EventTarget | null): target is HTMLFormElement {
  if (typeof target !== 'object' || target === null) return false;
  const candidate = target as unknown as { tagName?: unknown; matches?: unknown };
  if (typeof candidate.tagName !== 'string' || candidate.tagName.toLowerCase() !== 'form') return false;
  if (typeof candidate.matches !== 'function') return false;
  return (candidate.matches as (selector: string) => boolean)('[data-intake-form]');
}

function activeElement(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current) {
    if (current.hidden) return false;
    current = current.parentElement;
  }
  return true;
}

function fieldElements(form: HTMLFormElement, name: string): Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  return Array.from(form.elements)
    .filter(isNamedControl)
    .filter((element) => element.name === name);
}

function collectCurrentStepAnswers(form: HTMLFormElement, answers: IntakeAnswers): IntakeAnswers {
  const next = structuredClone(answers);
  const names = new Set(
    Array.from(form.elements)
      .filter(isNamedControl)
      .map((element) => element.name)
      .filter(isIntakeAnswerFieldName)
  );

  for (const name of names) {
    const elements = fieldElements(form, name).filter((element) => activeElement(element as HTMLElement));
    if (elements.length === 0) continue;
    const first = elements[0];
    if (!first) continue;

    if (isInput(first) && first.type === 'checkbox') {
      if (name.startsWith('consent.')) {
        setPath(next, name, elements.some((element) => isInput(element) && element.checked));
      } else {
        setPath(next, name, elements
          .filter((element): element is HTMLInputElement => isInput(element) && element.checked)
          .map((element) => element.value));
      }
      continue;
    }

    if (isInput(first) && first.type === 'radio') {
      const selected = elements.find((element) => isInput(element) && element.checked);
      setPath(next, name, selected?.value ?? '');
      continue;
    }

    if (elements.length > 1 || form.querySelector(`[data-repeatable="${name}"]`)) {
      setPath(next, name, elements.map((element) => element.value.trim()).filter(Boolean));
      continue;
    }

    setPath(next, name, first.value);
  }

  return next;
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

  if (step.hidden) {
    for (const candidate of root.querySelectorAll<HTMLElement>('[data-step-index]')) {
      candidate.hidden = Number(candidate.dataset.stepIndex) !== earliestStep;
    }
  }

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

export function validateCurrentIntakeForm(form: HTMLFormElement, storage: Storage | null): ValidationIssue[] {
  const draft = loadDraft(new Date(), storage);
  if (!draft) return [];

  const answers = collectCurrentStepAnswers(form, draft.answers);
  const request: IntakeSubmissionRequest = {
    version: 1,
    submissionId: draft.submissionId,
    startedAt: draft.startedAt,
    answers,
    turnstileToken: 'client-precheck',
    honeypot: form.querySelector<HTMLInputElement>('[name="honeypot"]')?.value ?? ''
  };
  const result = validateAndNormalizeIntake(request);
  if (result.ok) return [];

  return result.issues
    .map((issue) => ({ path: canonicalServerIssuePath(issue.path), message: issue.message }))
    .filter((issue) => stepIndexForServerIssue(issue.path) !== null);
}

export function installServerValidationFeedback(view: FeedbackWindow): void {
  if (view.__calypsoValidationFeedbackInstalled) return;
  view.__calypsoValidationFeedbackInstalled = true;

  view.document.addEventListener('submit', (event) => {
    const target = event.target;
    if (!isIntakeFormTarget(target)) return;

    const issues = validateCurrentIntakeForm(target, view.localStorage);
    if (issues.length === 0) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    showServerValidationIssues(view.document, issues);
  }, true);
}

if (typeof window !== 'undefined') installServerValidationFeedback(window as FeedbackWindow);
