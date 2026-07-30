import { wizardSteps } from '../data/intake';
import { clearIrrelevantNeeds, deriveConditions, requiredPathsFor } from '../lib/intake/conditions';
import { buildSummarySections } from '../lib/intake/email';
import { isIntakeAnswerFieldName } from '../lib/intake/form-fields';
import { createSubmissionReference } from '../lib/intake/reference';
import { clearDraft, createEmptyDraft, loadDraft, saveDraft } from '../lib/intake/storage';
import type { AddOn, IntakeAnswers, IntakeDraft, IntakeSubmissionRequest, ValidationIssue, WizardStepIndex } from '../lib/intake/types';

interface TurnstileApi {
  render(container: HTMLElement, options: {
    sitekey: string;
    action: string;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': (errorCode: string) => boolean | void;
  }): string;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
}

type TurnstileWindow = Window & { turnstile?: TurnstileApi };

const STEP_PREFIXES: ReadonlyArray<readonly string[]> = [
  ['business.'],
  ['project.'],
  ['needs.'],
  ['materials.'],
  ['contact.', 'consent.']
];

const LAST_STEP_INDEX = wizardSteps.at(-1)?.index ?? 0;

export type IntakeRequestResult =
  | { ok: true; reference: string; confirmationEmailSent: boolean }
  | { ok: false; code: string };

export function turnstileErrorMessage(errorCode: string): string {
  const code = errorCode.trim() || 'unknown';
  if (code === '110100' || code === '110110' || code === '400020') {
    return `The Turnstile site key is invalid or unavailable (error ${code}).`;
  }
  if (code === '110200') {
    return `This website hostname is not authorized for the security check (error ${code}).`;
  }
  if (code === '400070') {
    return `The Turnstile site key is disabled in Cloudflare (error ${code}).`;
  }
  if (code === '110600' || code === '110620') {
    return `The security check timed out. Try the check again (error ${code}).`;
  }
  if (code === '200100') {
    return `The device clock or a cached security response caused the check to fail. Reload the page and verify the device time (error ${code}).`;
  }
  if (code === '200500') {
    return `The security frame could not load. Check the connection, disable content blockers, and try again (error ${code}).`;
  }
  if (code.startsWith('300') || code.startsWith('600')) {
    return `Cloudflare rejected the security challenge. Reload the page or try a different browser or network (error ${code}).`;
  }
  return `The security check could not be confirmed (error ${code}). Try again or use a different browser or network.`;
}

export async function sendIntakeRequest(
  request: IntakeSubmissionRequest,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 20_000
): Promise<IntakeRequestResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal
    });
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, code: 'invalid_response' };
    }
    if (!isRecord(payload) || payload.ok !== true) {
      return { ok: false, code: isRecord(payload) && typeof payload.code === 'string' ? payload.code : 'delivery_unconfirmed' };
    }
    if (typeof payload.reference !== 'string' || typeof payload.confirmationEmailSent !== 'boolean') {
      return { ok: false, code: 'invalid_response' };
    }
    return { ok: true, reference: payload.reference, confirmationEmailSent: payload.confirmationEmailSent };
  } catch (error) {
    return { ok: false, code: error instanceof DOMException && error.name === 'AbortError' ? 'request_timeout' : 'network_error' };
  } finally {
    clearTimeout(timeout);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => isRecord(current) ? current[key] : undefined, value);
}

export function setPath(value: unknown, path: string, replacement: unknown): void {
  const keys = path.split('.');
  let current: unknown = value;
  for (let index = 0; index < keys.length - 1; index += 1) {
    if (!isRecord(current)) return;
    current = current[keys[index] as string];
  }
  if (isRecord(current)) current[keys.at(-1) as string] = replacement;
}

function isEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'boolean') return value === false;
  return value === null || value === undefined;
}

function fieldElements(form: HTMLFormElement, name: string): Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  return Array.from(form.elements).filter((element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
    (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) &&
    element.name === name
  );
}

function activeElement(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current) {
    if (current.hidden) return false;
    current = current.parentElement;
  }
  return true;
}

function collectFormAnswers(form: HTMLFormElement, answers: IntakeAnswers): IntakeAnswers {
  const next = structuredClone(answers);
  const names = new Set<string>();
  for (const element of Array.from(form.elements)) {
    if ((element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) &&
        element.name && isIntakeAnswerFieldName(element.name)) names.add(element.name);
  }

  for (const name of names) {
    const elements = fieldElements(form, name).filter(activeElement);
    if (elements.length === 0) continue;
    const first = elements[0];
    if (!first) continue;

    if (first instanceof HTMLInputElement && first.type === 'checkbox') {
      if (name.startsWith('consent.')) {
        setPath(next, name, elements.some((element) => element instanceof HTMLInputElement && element.checked));
      } else {
        setPath(next, name, elements
          .filter((element): element is HTMLInputElement => element instanceof HTMLInputElement && element.checked)
          .map((element) => element.value));
      }
      continue;
    }

    if (first instanceof HTMLInputElement && first.type === 'radio') {
      const checked = elements.find((element) => element instanceof HTMLInputElement && element.checked) as HTMLInputElement | undefined;
      setPath(next, name, checked?.value ?? '');
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

function rebuildRepeatable(group: HTMLElement, values: string[]): void {
  const items = group.querySelector<HTMLElement>('[data-repeatable-items]');
  const firstRow = items?.querySelector<HTMLElement>('.repeatable-row');
  if (!items || !firstRow) return;
  const template = firstRow.cloneNode(true) as HTMLElement;
  items.replaceChildren();
  const entries = values.length > 0 ? values : [''];
  for (let index = 0; index < entries.length; index += 1) {
    const row = template.cloneNode(true) as HTMLElement;
    const input = row.querySelector<HTMLInputElement>('input');
    const remove = row.querySelector<HTMLButtonElement>('[data-remove-repeatable]');
    if (input) {
      input.value = entries[index] ?? '';
      input.id = `${input.name.replaceAll('.', '-')}-${index}`;
    }
    if (remove) remove.hidden = entries.length === 1;
    items.append(row);
  }
}

function applyAnswersToForm(form: HTMLFormElement, answers: IntakeAnswers): void {
  for (const group of form.querySelectorAll<HTMLElement>('[data-repeatable]')) {
    const name = group.dataset.repeatable;
    if (!name) continue;
    const value = getPath(answers, name);
    rebuildRepeatable(group, Array.isArray(value) ? value.map(String) : []);
  }

  const names = new Set<string>();
  for (const element of Array.from(form.elements)) {
    if ((element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) &&
        element.name && isIntakeAnswerFieldName(element.name)) names.add(element.name);
  }
  for (const name of names) {
    const elements = fieldElements(form, name);
    const value = getPath(answers, name);
    for (const element of elements) {
      if (element instanceof HTMLInputElement && element.type === 'checkbox') {
        element.checked = name.startsWith('consent.') ? value === true : Array.isArray(value) && value.includes(element.value);
      } else if (element instanceof HTMLInputElement && element.type === 'radio') {
        element.checked = element.value === value;
      } else if (elements.length === 1 || !Array.isArray(value)) {
        element.value = typeof value === 'string' ? value : '';
      }
    }
  }
}

function issueForPath(answers: IntakeAnswers, path: string): ValidationIssue | null {
  const value = getPath(answers, path);
  if (isEmpty(value)) return { path, message: 'This field is required.' };
  if (path === 'business.email' && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { path, message: 'Enter a valid email address.' };
  }
  if (path === 'business.phone' && typeof value === 'string') {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return { path, message: 'Enter a usable phone number.' };
  }
  return null;
}

export function validateWizardStep(stepIndex: number, answers: IntakeAnswers): ValidationIssue[] {
  const prefixes = STEP_PREFIXES[stepIndex] ?? [];
  const issues = requiredPathsFor(answers)
    .filter((path) => prefixes.some((prefix) => path.startsWith(prefix)))
    .map((path) => issueForPath(answers, path))
    .filter((issue): issue is ValidationIssue => issue !== null);
  if (stepIndex === 3 && answers.materials.visualWords.length > 3) {
    issues.push({ path: 'materials.visualWords', message: 'Choose no more than three visual words.' });
  }
  if (stepIndex === 4 && answers.contact.preferredTime.trim() && !answers.contact.timeZone.trim()) {
    issues.push({ path: 'contact.timeZone', message: 'Add a time zone for your preferred response time.' });
  }
  return issues;
}

function conditionState(answers: IntakeAnswers, key: string): boolean {
  const conditions = deriveConditions(answers);
  const map: Record<string, boolean> = {
    'standard-website': conditions.showStandardWebsite,
    redesign: conditions.showRedesign,
    store: conditions.showStore,
    'custom-tool': conditions.showCustomTool,
    support: conditions.showSupport,
    'not-sure': conditions.showNotSure,
    booking: conditions.showBooking,
    'standalone-payments': conditions.showStandalonePayments,
    'custom-forms': conditions.showCustomForms,
    maintenance: conditions.showMaintenance,
    'other-add-on': conditions.requireOtherAddOn
  };
  return map[key] ?? false;
}

function hasBranchAnswers(answers: IntakeAnswers): boolean {
  const needs = answers.needs;
  return JSON.stringify(clearIrrelevantNeeds(answers)) !== JSON.stringify(needs);
}

function focusElement(element: HTMLElement | null): void {
  element?.focus({ preventScroll: true });
  element?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
}

export function initializeIntakeWizard(root: HTMLElement): void {
  if (root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const storage = view?.localStorage ?? null;
  const welcome = root.querySelector<HTMLElement>('[data-intake-welcome]');
  const restoreNotice = root.querySelector<HTMLElement>('[data-restore-notice]');
  const shell = root.querySelector<HTMLElement>('[data-wizard-shell]');
  const form = root.querySelector<HTMLFormElement>('[data-intake-form]');
  const success = root.querySelector<HTMLElement>('[data-submission-confirmation]');
  if (!form || !shell || !welcome || !restoreNotice || !success) return;
  const wizardForm = form;
  const welcomePanel = welcome;
  const restorePanel = restoreNotice;
  const wizardShell = shell;
  const successPanel = success;

  let draft: IntakeDraft | null = null;
  let maximumCompletedStep = 0;
  let saveTimer: number | undefined;
  let previousPrimary = '';
  let previousAddOns = new Set<AddOn>();

  const saveStatus = root.querySelector<HTMLElement>('[data-save-status]');
  const submitButton = root.querySelector<HTMLButtonElement>('[data-submit]');
  const turnstileStatus = root.querySelector<HTMLElement>('[data-turnstile-status]');
  const turnstileContainer = root.querySelector<HTMLElement>('[data-turnstile-widget]');
  const turnstileRetry = root.querySelector<HTMLButtonElement>('[data-turnstile-retry]');
  const submissionError = root.querySelector<HTMLElement>('[data-submission-error]');
  const siteKey = root.dataset.turnstileSiteKey?.trim() ?? '';
  const submissionEnabled = root.dataset.submissionEnabled === 'true' && siteKey.length > 0;
  let turnstileToken = '';
  let turnstileWidgetId: string | undefined;
  let turnstilePromise: Promise<TurnstileApi | null> | null = null;
  let isSubmitting = false;

  if (!submissionEnabled) {
    if (submitButton) submitButton.disabled = true;
    if (turnstileStatus) turnstileStatus.textContent = 'Online submission is temporarily unavailable. Email calydigital@outlook.com instead.';
  }

  function saveNow(): void {
    if (!draft) return;
    draft.answers = collectFormAnswers(wizardForm, draft.answers);
    draft.updatedAt = new Date().toISOString();
    if (saveDraft(draft, storage)) {
      if (saveStatus) saveStatus.textContent = 'Saved on this device';
    } else if (saveStatus) {
      saveStatus.textContent = '';
    }
  }

  function scheduleSave(): void {
    if (!draft || !view) return;
    if (saveTimer !== undefined) view.clearTimeout(saveTimer);
    saveTimer = view.setTimeout(saveNow, 500);
  }

  function turnstileWindow(): TurnstileWindow | null {
    return view as unknown as TurnstileWindow | null;
  }

  function loadTurnstile(): Promise<TurnstileApi | null> {
    if (!submissionEnabled || !view) return Promise.resolve(null);
    const browser = turnstileWindow();
    if (browser?.turnstile) return Promise.resolve(browser.turnstile);
    if (turnstilePromise) return turnstilePromise;
    turnstilePromise = new Promise((resolve) => {
      const existing = doc.querySelector<HTMLScriptElement>('script[data-calypso-turnstile]');
      const script = existing ?? doc.createElement('script');
      script.addEventListener('load', () => resolve(turnstileWindow()?.turnstile ?? null), { once: true });
      script.addEventListener('error', () => resolve(null), { once: true });
      if (!existing) {
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.calypsoTurnstile = 'true';
        doc.head.append(script);
      }
    });
    return turnstilePromise;
  }

  async function ensureTurnstile(): Promise<void> {
    if (!submissionEnabled || !turnstileContainer || turnstileWidgetId) return;
    if (turnstileStatus) turnstileStatus.textContent = 'Loading security verification…';
    if (turnstileRetry) turnstileRetry.hidden = true;
    const api = await loadTurnstile();
    if (!api) {
      if (turnstileStatus) turnstileStatus.textContent = 'The security check could not load. Check your connection and try again.';
      if (turnstileRetry) turnstileRetry.hidden = false;
      return;
    }
    turnstileWidgetId = api.render(turnstileContainer, {
      sitekey: siteKey,
      action: 'project-intake',
      callback: (token) => {
        turnstileToken = token;
        if (turnstileStatus) turnstileStatus.textContent = 'Security verification complete.';
        if (turnstileRetry) turnstileRetry.hidden = true;
        if (submissionError) submissionError.hidden = true;
      },
      'expired-callback': () => {
        turnstileToken = '';
        if (turnstileStatus) turnstileStatus.textContent = 'Security verification expired. Complete it again before submitting.';
        if (turnstileRetry) turnstileRetry.hidden = false;
      },
      'error-callback': (errorCode) => {
        turnstileToken = '';
        if (turnstileStatus) turnstileStatus.textContent = turnstileErrorMessage(errorCode);
        if (turnstileRetry) turnstileRetry.hidden = false;
        return true;
      }
    });
    if (turnstileStatus) turnstileStatus.textContent = 'Complete the security check before submitting.';
  }

  function resetTurnstile(): void {
    turnstileToken = '';
    const api = turnstileWindow()?.turnstile;
    if (api && turnstileWidgetId) api.reset(turnstileWidgetId);
    if (turnstileRetry) turnstileRetry.hidden = true;
  }

  function submissionMessage(code: string): string {
    const messages: Record<string, string> = {
      validation_failed: 'Some project details need attention. Review the highlighted fields and submit again.',
      verification_failed: 'The security check could not be confirmed. Complete the refreshed check and submit again. Your answers have not been lost.',
      verification_expired: 'The security check expired. Complete it again and resubmit.',
      verification_unavailable: 'The security service is temporarily unavailable. Your answers remain saved; try again shortly.',
      request_timeout: 'The request took too long. Your answers remain saved; check your connection and try again.',
      network_error: 'Your answers are still saved on this device, but the submission could not be sent. Check your connection and try again.',
      delivery_unconfirmed: 'Your answers are still saved, but I could not confirm delivery. Try again in a moment or email calydigital@outlook.com.',
      invalid_response: 'Your answers are still saved, but the response could not be confirmed. Try again in a moment.'
    };
    return messages[code] ?? messages.delivery_unconfirmed!;
  }

  function updateConditions(): void {
    if (!draft) return;
    for (const element of root.querySelectorAll<HTMLElement>('[data-condition]')) {
      element.hidden = !conditionState(draft.answers, element.dataset.condition ?? '');
    }
    for (const element of root.querySelectorAll<HTMLElement>('[data-value-condition]')) {
      const [path, expected] = (element.dataset.valueCondition ?? '').split(':');
      const value = path ? getPath(draft.answers, path) : undefined;
      element.hidden = !(Array.isArray(value) ? value.includes(expected) : value === expected);
    }
  }

  function renderReview(): void {
    if (!draft) return;
    const reference = createSubmissionReference(draft.submissionId);
    const sections = buildSummarySections({
      version: 1,
      submissionId: draft.submissionId,
      startedAt: draft.startedAt,
      reference,
      answers: draft.answers
    });
    const containers = root.querySelectorAll<HTMLElement>('[data-review-section]');
    sections.forEach((section, index) => {
      const rows = containers[index]?.querySelector<HTMLElement>('[data-review-rows]');
      if (!rows) return;
      rows.replaceChildren();
      if (section.rows.length === 0) {
        const empty = doc.createElement('p');
        empty.textContent = 'No information added yet.';
        rows.append(empty);
        return;
      }
      for (const row of section.rows) {
        const wrapper = doc.createElement('div');
        const term = doc.createElement('dt');
        const description = doc.createElement('dd');
        term.textContent = row.label;
        description.textContent = row.value;
        wrapper.append(term, description);
        rows.append(wrapper);
      }
    });
  }

  function clearErrors(stepIndex: number): void {
    const step = root.querySelector<HTMLElement>(`[data-step-index="${stepIndex}"]`);
    if (!step) return;
    const summary = step.querySelector<HTMLElement>('[data-error-summary]');
    if (summary) summary.hidden = true;
    step.querySelector<HTMLElement>('[data-error-list]')?.replaceChildren();
    for (const field of step.querySelectorAll<HTMLElement>('[data-field-error]')) {
      field.hidden = true;
      field.textContent = '';
    }
    for (const control of step.querySelectorAll<HTMLElement>('[aria-invalid="true"]')) control.removeAttribute('aria-invalid');
  }

  function fieldContainer(path: string): HTMLElement | null {
    return Array.from(root.querySelectorAll<HTMLElement>('[data-field-path]'))
      .find((element) => element.dataset.fieldPath === path) ?? null;
  }

  function showErrors(stepIndex: number, issues: ValidationIssue[]): void {
    clearErrors(stepIndex);
    const step = root.querySelector<HTMLElement>(`[data-step-index="${stepIndex}"]`);
    const summary = step?.querySelector<HTMLElement>('[data-error-summary]');
    const list = summary?.querySelector<HTMLElement>('[data-error-list]');
    if (!step || !summary || !list) return;
    for (const issue of issues) {
      const container = fieldContainer(issue.path);
      const control = fieldElements(wizardForm, issue.path).find(activeElement);
      control?.setAttribute('aria-invalid', 'true');
      const error = container?.querySelector<HTMLElement>('[data-field-error]') ??
        Array.from(step.querySelectorAll<HTMLElement>('[data-field-error][data-field-path]')).find((item) => item.dataset.fieldPath === issue.path);
      if (error) {
        error.textContent = issue.message;
        error.hidden = false;
      }
      const item = doc.createElement('li');
      const link = doc.createElement('a');
      link.href = control?.id ? `#${control.id}` : '#';
      link.textContent = issue.message;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        focusElement(control ?? container);
      });
      item.append(link);
      list.append(item);
    }
    summary.hidden = false;
    focusElement(summary);
  }

  function showStep(index: number, options: { updateHash?: boolean; focus?: boolean } = {}): void {
    if (!draft) return;
    const safeIndex = Math.max(0, Math.min(LAST_STEP_INDEX, index)) as WizardStepIndex;
    draft.currentStep = safeIndex;
    for (const step of root.querySelectorAll<HTMLElement>('[data-step-index]')) {
      step.hidden = Number(step.dataset.stepIndex) !== safeIndex;
    }
    const back = root.querySelector<HTMLButtonElement>('[data-back]');
    const next = root.querySelector<HTMLButtonElement>('[data-continue]');
    const submit = root.querySelector<HTMLButtonElement>('[data-submit]');
    if (back) back.hidden = safeIndex === 0;
    if (next) next.hidden = safeIndex === LAST_STEP_INDEX;
    if (submit) submit.hidden = safeIndex !== LAST_STEP_INDEX;
    const progress = root.querySelector<HTMLElement>('[data-progress-current]');
    if (progress) progress.textContent = `Step ${safeIndex + 1} of ${wizardSteps.length}: ${wizardSteps[safeIndex]?.label ?? ''}`;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-progress-step]')) {
      const buttonIndex = Number(button.dataset.progressStep);
      button.disabled = buttonIndex > maximumCompletedStep;
      button.dataset.complete = String(buttonIndex < safeIndex || buttonIndex <= maximumCompletedStep);
      if (buttonIndex === safeIndex) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    }
    if (safeIndex === LAST_STEP_INDEX) {
      renderReview();
      void ensureTurnstile();
    }
    if (options.updateHash !== false && view) view.history.replaceState(null, '', `#${wizardSteps[safeIndex]?.id ?? 'business'}`);
    if (options.focus !== false) focusElement(root.querySelector<HTMLElement>(`[data-step-index="${safeIndex}"] .step-heading`));
  }

  function openDraft(nextDraft: IntakeDraft): void {
    draft = nextDraft;
    maximumCompletedStep = nextDraft.currentStep;
    previousPrimary = nextDraft.answers.project.primaryType;
    previousAddOns = new Set(nextDraft.answers.project.addOns);
    applyAnswersToForm(wizardForm, nextDraft.answers);
    welcomePanel.hidden = true;
    restorePanel.hidden = true;
    wizardShell.hidden = false;
    successPanel.hidden = true;
    updateConditions();
    showStep(nextDraft.currentStep, { focus: false });
    saveNow();
  }

  function newRequest(): void {
    clearDraft(storage);
    openDraft(createEmptyDraft());
  }

  root.querySelector<HTMLButtonElement>('[data-start-intake]')?.addEventListener('click', newRequest);
  root.querySelector<HTMLButtonElement>('[data-restore-draft]')?.addEventListener('click', () => {
    const stored = loadDraft(new Date(), storage);
    if (stored) openDraft(stored);
    else newRequest();
  });
  root.querySelector<HTMLButtonElement>('[data-start-over]')?.addEventListener('click', () => {
    if (view?.confirm('Start over and delete the saved project details?') !== false) newRequest();
  });
  turnstileRetry?.addEventListener('click', () => {
    if (turnstileStatus) turnstileStatus.textContent = 'Retrying security verification…';
    resetTurnstile();
    if (!turnstileWidgetId) void ensureTurnstile();
  });

  for (const group of root.querySelectorAll<HTMLElement>('[data-repeatable]')) {
    group.querySelector<HTMLButtonElement>('[data-add-repeatable]')?.addEventListener('click', () => {
      const items = group.querySelector<HTMLElement>('[data-repeatable-items]');
      const rows = items?.querySelectorAll<HTMLElement>('.repeatable-row') ?? [];
      const maximum = Number(group.dataset.maxItems ?? '1');
      if (!items || rows.length >= maximum || rows.length === 0) return;
      const row = rows[0]?.cloneNode(true) as HTMLElement;
      const input = row.querySelector<HTMLInputElement>('input');
      const remove = row.querySelector<HTMLButtonElement>('[data-remove-repeatable]');
      if (input) {
        input.value = '';
        input.id = `${input.name.replaceAll('.', '-')}-${rows.length}`;
      }
      if (remove) remove.hidden = false;
      items.append(row);
      for (const button of items.querySelectorAll<HTMLButtonElement>('[data-remove-repeatable]')) button.hidden = false;
      focusElement(input);
    });
    group.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-remove-repeatable]');
      if (!button) return;
      const row = button.closest<HTMLElement>('.repeatable-row');
      const items = group.querySelector<HTMLElement>('[data-repeatable-items]');
      if (!row || !items || items.children.length <= 1) return;
      row.remove();
      if (items.children.length === 1) items.querySelector<HTMLButtonElement>('[data-remove-repeatable]')!.hidden = true;
      if (draft) draft.answers = collectFormAnswers(wizardForm, draft.answers);
      scheduleSave();
    });
  }

  wizardForm.addEventListener('input', () => {
    if (!draft) return;
    draft.answers = collectFormAnswers(wizardForm, draft.answers);
    updateConditions();
    scheduleSave();
  });

  wizardForm.addEventListener('change', (event) => {
    if (!draft) return;
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const before = structuredClone(draft.answers);
    draft.answers = collectFormAnswers(wizardForm, draft.answers);

    if (target.name === 'project.primaryType') {
      const nextPrimary = draft.answers.project.primaryType;
      if (previousPrimary && nextPrimary !== previousPrimary && hasBranchAnswers(before) && view?.confirm('Changing the main project type will remove answers that no longer apply. Continue?') === false) {
        draft.answers = before;
        applyAnswersToForm(wizardForm, draft.answers);
      } else {
        draft.answers.needs = clearIrrelevantNeeds(draft.answers);
        previousPrimary = draft.answers.project.primaryType;
      }
    }

    if (target.name === 'project.addOns') {
      const next = new Set(draft.answers.project.addOns);
      const removed = [...previousAddOns].some((value) => !next.has(value));
      if (removed) draft.answers.needs = clearIrrelevantNeeds(draft.answers);
      previousAddOns = next;
    }

    if (target.name === 'materials.available' && target instanceof HTMLInputElement && target.checked) {
      const controls = fieldElements(wizardForm, target.name).filter((item): item is HTMLInputElement => item instanceof HTMLInputElement);
      if (target.value === 'none') controls.forEach((control) => { if (control !== target) control.checked = false; });
      else controls.forEach((control) => { if (control.value === 'none') control.checked = false; });
      draft.answers = collectFormAnswers(wizardForm, draft.answers);
    }

    if (target.name === 'materials.visualWords' && target instanceof HTMLInputElement && target.checked && draft.answers.materials.visualWords.length > 3) {
      target.checked = false;
      draft.answers = collectFormAnswers(wizardForm, draft.answers);
      const container = fieldContainer('materials.visualWords');
      const error = container?.querySelector<HTMLElement>('[data-field-error]');
      if (error) {
        error.textContent = 'Choose no more than three visual words.';
        error.hidden = false;
      }
    }

    updateConditions();
    scheduleSave();
  });

  root.querySelector<HTMLButtonElement>('[data-continue]')?.addEventListener('click', () => {
    if (!draft) return;
    draft.answers = collectFormAnswers(wizardForm, draft.answers);
    const issues = validateWizardStep(draft.currentStep, draft.answers);
    if (issues.length > 0) {
      showErrors(draft.currentStep, issues);
      return;
    }
    clearErrors(draft.currentStep);
    maximumCompletedStep = Math.max(maximumCompletedStep, Math.min(LAST_STEP_INDEX, draft.currentStep + 1));
    showStep(draft.currentStep + 1);
    saveNow();
  });

  root.querySelector<HTMLButtonElement>('[data-back]')?.addEventListener('click', () => {
    if (!draft) return;
    showStep(draft.currentStep - 1);
    saveNow();
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-progress-step]')) {
    button.addEventListener('click', () => {
      if (!draft) return;
      const target = Number(button.dataset.progressStep);
      if (target <= maximumCompletedStep) {
        showStep(target);
        saveNow();
      }
    });
  }

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-edit-step]')) {
    button.addEventListener('click', () => {
      if (!draft) return;
      showStep(Number(button.dataset.editStep));
      saveNow();
    });
  }

  view?.addEventListener('hashchange', () => {
    if (!draft) return;
    const id = view.location.hash.replace('#', '');
    const requested = wizardSteps.find((step) => step.id === id)?.index;
    if (requested === undefined) return;
    showStep(requested <= maximumCompletedStep ? requested : maximumCompletedStep, { updateHash: requested > maximumCompletedStep });
  });

  wizardForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!draft || isSubmitting || !submissionEnabled) return;
    draft.answers = collectFormAnswers(wizardForm, draft.answers);
    for (const step of wizardSteps) {
      const index = step.index;
      const issues = validateWizardStep(index, draft.answers);
      if (issues.length > 0) {
        maximumCompletedStep = Math.max(maximumCompletedStep, index);
        showStep(index);
        showErrors(index, issues);
        return;
      }
    }
    if (!turnstileToken) {
      if (submissionError) {
        submissionError.textContent = 'Complete the security verification before submitting.';
        submissionError.hidden = false;
        focusElement(submissionError);
      }
      return;
    }

    isSubmitting = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Sending…';
    }
    if (submissionError) submissionError.hidden = true;
    const honeypot = wizardForm.querySelector<HTMLInputElement>('[name="honeypot"]')?.value ?? '';
    const request: IntakeSubmissionRequest = {
      version: 1,
      submissionId: draft.submissionId,
      startedAt: draft.startedAt,
      answers: draft.answers,
      turnstileToken,
      honeypot
    };
    const result = await sendIntakeRequest(request);
    isSubmitting = false;
    if (submitButton) {
      submitButton.removeAttribute('aria-busy');
      submitButton.textContent = 'Submit Project Details';
      submitButton.disabled = false;
    }
    if (!result.ok) {
      if (result.code.startsWith('verification_')) resetTurnstile();
      if (submissionError) {
        submissionError.textContent = submissionMessage(result.code);
        submissionError.hidden = false;
        focusElement(submissionError);
      }
      saveNow();
      return;
    }

    clearDraft(storage);
    turnstileWindow()?.turnstile?.remove(turnstileWidgetId);
    turnstileWidgetId = undefined;
    turnstileToken = '';
    wizardShell.hidden = true;
    successPanel.hidden = false;
    const reference = successPanel.querySelector<HTMLElement>('[data-confirmation-reference]');
    const email = successPanel.querySelector<HTMLElement>('[data-confirmation-email]');
    const message = successPanel.querySelector<HTMLElement>('[data-confirmation-message]');
    if (reference) reference.textContent = result.reference;
    if (email) email.textContent = request.answers.business.email;
    if (message && !result.confirmationEmailSent) {
      message.textContent = 'Your project was received, but the email copy could not be confirmed. Keep this reference number and contact me at calydigital@outlook.com if you need a copy.';
    }
    focusElement(successPanel);
  });

  root.querySelector<HTMLButtonElement>('[data-new-request]')?.addEventListener('click', () => {
    successPanel.hidden = true;
    newRequest();
  });

  const stored = loadDraft(new Date(), storage);
  if (stored) {
    restorePanel.hidden = false;
    welcomePanel.hidden = true;
  }
}

function autoInitialize(): void {
  for (const root of document.querySelectorAll<HTMLElement>('[data-intake-wizard]')) initializeIntakeWizard(root);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInitialize, { once: true });
  else autoInitialize();
}
