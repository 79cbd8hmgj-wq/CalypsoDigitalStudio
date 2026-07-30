# Remove Budget Intake Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the guided intake into a five-step flow and remove all budget, timing, readiness, launch-date, and approval questions from the form, review, validation, and emails without invalidating version-one saved drafts.

**Architecture:** Keep `budgetAndTiming` as a recognized compatibility object in version-one drafts and API payloads, but remove every visible control, required-path rule, business-value validation, and summary output that uses it. Make `wizardSteps` the source of truth for the active five-step sequence, clamp legacy stored step `5` to the new final step `4`, and update all browser and server error-routing maps to the same order.

**Tech Stack:** Astro 7, TypeScript 5.9, Cloudflare Pages Functions, Vitest 4, happy-dom, Playwright 1.62, Node.js 22.

## Global Constraints

- The final flow is exactly: Business, Project, Needs, Materials, Review and contact.
- `Review and contact` is Step 5 of 5 and uses index `4`.
- Do not increase the intake schema version from `1`.
- Do not delete or invalidate otherwise valid saved drafts.
- Keep `budgetAndTiming` in `IntakeAnswers` and the API envelope as a compatibility object.
- New drafts keep an empty `budgetAndTiming` object.
- Legacy recognized budget/timing values may remain internally, but are never displayed, required, business-validated, reviewed, or emailed.
- Preserve strict unknown-field rejection for unrelated fields.
- Do not change Turnstile behavior, Resend behavior, submission references, deployment variables, or confirmation copy outside removed budget/timing content.
- Add or update a focused failing test before each production change.
- Run commands under Node `>=22.12.0 <23`.

## File Structure

### Flow and compatibility

- `src/lib/intake/types.ts` — active step-index type; retains `BudgetAndTimingAnswers`.
- `src/data/intake.ts` — authoritative five-entry `wizardSteps` metadata.
- `src/lib/intake/storage.ts` — new-draft defaults, legacy draft acceptance, and step clamping.
- `src/lib/intake/conditions.ts` — conditional required paths without budget/timing rules.
- `src/lib/intake/schema.ts` — structural compatibility without budget/timing business validation.

### UI and output

- `src/components/intake/IntakeWizard.astro` — five-step composition and layout.
- `src/components/intake/WizardProgress.astro` — accessible progress copy.
- `src/components/intake/steps/ReviewStep.astro` — final step at index `4`.
- `src/components/intake/steps/BudgetStep.astro` — deleted.
- `src/scripts/intake-wizard.ts` — navigation, validation loop, review rendering, and Turnstile loading.
- `src/components/intake/ReviewSummary.astro` — five review cards.
- `src/lib/intake/email.ts` — five shared summary sections for browser review and both emails.

### Validation feedback

- `src/scripts/intake-server-validation-feedback.ts` — client precheck and issue-to-step routing.
- `src/scripts/intake-response-feedback.ts` — API validation response routing.

### Tests and build verification

- `tests/intake/fixtures.ts`
- `tests/intake/storage.test.ts`
- `tests/intake/conditions.test.ts`
- `tests/intake/schema.test.ts`
- `tests/intake/markup.test.ts`
- `tests/intake/wizard.test.ts`
- `tests/intake/email.test.ts`
- `tests/intake/server-validation-feedback.test.ts`
- `tests/intake/direct-server-feedback.test.ts`
- `tests/e2e/intake.spec.ts`
- `scripts/verify-build-output.mjs`

---

### Task 1: Preserve Version-One Compatibility and Remove Budget Requirements

**Files:**
- Modify: `src/lib/intake/types.ts:26-28`
- Modify: `src/data/intake.ts:11-18`
- Modify: `src/lib/intake/storage.ts:1-123`
- Modify: `src/lib/intake/conditions.ts:5-121`
- Modify: `src/lib/intake/schema.ts:1-255`
- Modify: `tests/intake/fixtures.ts:57-67`
- Modify: `tests/intake/storage.test.ts`
- Modify: `tests/intake/conditions.test.ts`
- Modify: `tests/intake/schema.test.ts`

**Interfaces:**
- Consumes: `IntakeDraft`, `IntakeAnswers`, `validateAndNormalizeIntake`, and `requiredPathsFor`.
- Produces: active `WizardStepIndex` values `0 | 1 | 2 | 3 | 4`; five `wizardSteps`; `loadDraft()` that accepts stored step `5` but returns step `4`; schema acceptance of recognized historical `budgetAndTiming` values.

- [ ] **Step 1: Add failing five-step and legacy-draft tests**

Add this import to `tests/intake/storage.test.ts`:

```ts
import { wizardSteps } from '../../src/data/intake';
```

Add these tests:

```ts
test('defines exactly five active wizard steps ending with review', () => {
  expect(wizardSteps.map((step) => [step.index, step.id])).toEqual([
    [0, 'business'],
    [1, 'project'],
    [2, 'needs'],
    [3, 'materials'],
    [4, 'review']
  ]);
});

test('clamps a legacy final-step draft to the new review step', () => {
  const draft = createEmptyDraft(new Date('2026-07-29T12:00:00.000Z'));
  const legacy = draft as unknown as { currentStep: number; answers: typeof draft.answers };
  legacy.currentStep = 5;
  legacy.answers.budgetAndTiming.budgetRange = '1000-2500';
  expect(saveDraft(draft)).toBe(true);

  const restored = loadDraft(new Date('2026-07-30T12:00:00.000Z'));

  expect(restored?.currentStep).toBe(4);
  expect(restored?.answers.budgetAndTiming.budgetRange).toBe('1000-2500');
});
```

- [ ] **Step 2: Add failing required-path and schema tests**

Replace the deadline-focused test in `tests/intake/conditions.test.ts` with:

```ts
test('derives contact and other-add-on requirements without budget paths', () => {
  const request = createValidWebsiteSubmission();
  request.answers.contact.preferredMethod = 'text';
  request.answers.project.addOns = ['other'];
  const conditions = deriveConditions(request.answers);
  const required = requiredPathsFor(request.answers);

  expect(conditions.requirePhone).toBe(true);
  expect(conditions.requireOtherAddOn).toBe(true);
  expect(required).toContain('business.phone');
  expect(required).toContain('project.otherAddOn');
  expect(required.some((path) => path.startsWith('budgetAndTiming.'))).toBe(false);
});
```

Replace the fixed-date test in `tests/intake/schema.test.ts` with:

```ts
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
```

Add this test:

```ts
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
```

Remove these lines from the `ongoing-support` branch fixture inside `tests/intake/schema.test.ts`:

```ts
request.answers.budgetAndTiming.supportType = 'one-time';
request.answers.budgetAndTiming.budgetRange = '500-1000';
```

- [ ] **Step 3: Run focused tests and confirm the red state**

```bash
npx vitest run tests/intake/storage.test.ts tests/intake/conditions.test.ts tests/intake/schema.test.ts
```

Expected: failures for six step metadata, unclamped stored step `5`, remaining budget required paths, and rejected historical compatibility values.

- [ ] **Step 4: Reduce active step metadata to five steps**

In `src/lib/intake/types.ts`, replace:

```ts
export type WizardStepIndex = 0 | 1 | 2 | 3 | 4 | 5;
```

with:

```ts
export type WizardStepIndex = 0 | 1 | 2 | 3 | 4;
```

In `src/data/intake.ts`, replace `wizardSteps` with:

```ts
export const wizardSteps: ReadonlyArray<{ index: WizardStepIndex; id: string; label: string }> = [
  { index: 0, id: 'business', label: 'Your Business' },
  { index: 1, id: 'project', label: 'Project Type' },
  { index: 2, id: 'needs', label: 'Project Needs' },
  { index: 3, id: 'materials', label: 'Branding & Materials' },
  { index: 4, id: 'review', label: 'Review & Contact' }
];
```

Keep `BudgetAndTimingAnswers` and `IntakeAnswers.budgetAndTiming` in `src/lib/intake/types.ts`.

- [ ] **Step 5: Accept legacy stored step 5 and clamp it to active step 4**

Add this type after the imports in `src/lib/intake/storage.ts`:

```ts
type StoredIntakeDraft = Omit<IntakeDraft, 'currentStep'> & { currentStep: number };
```

Change the guard signature to:

```ts
function isDraft(value: unknown): value is StoredIntakeDraft {
```

Keep the stored range check compatible with old version-one drafts:

```ts
if (!Number.isInteger(value.currentStep) || Number(value.currentStep) < 0 || Number(value.currentStep) > 5) return false;
```

Replace the end of `loadDraft()` with:

```ts
parsed.currentStep = Math.min(parsed.currentStep, 4);
parsed.answers = sanitizeStoredIntakeAnswers(parsed.answers);
return parsed as IntakeDraft;
```

Keep the empty `budgetAndTiming` object in `createEmptyAnswers()`.

- [ ] **Step 6: Remove budget and launch-date requirements**

In `src/lib/intake/conditions.ts`:

Delete this interface property:

```ts
requireLaunchDate: boolean;
```

Delete this derived property:

```ts
requireLaunchDate: answers.budgetAndTiming.dateFlexibility === 'fixed',
```

Delete these common required paths:

```ts
'budgetAndTiming.budgetRange',
'budgetAndTiming.preferredTiming',
'budgetAndTiming.readiness',
'budgetAndTiming.decisionMaker',
```

Delete this conditional requirement:

```ts
if (conditions.requireLaunchDate) paths.push('budgetAndTiming.launchDate');
```

Leave every needs-branch rule unchanged.

- [ ] **Step 7: Remove budget/timing business validation while retaining structural keys**

In `src/lib/intake/schema.ts`, remove these imports from `../../data/intake`:

```ts
customToolBudgetOptions,
supportMonthlyBudgetOptions,
supportOneTimeBudgetOptions,
timingOptions,
websiteBudgetOptions
```

Keep this structural allowlist entry unchanged:

```ts
budgetAndTiming: ['budgetRange', 'supportType', 'preferredTiming', 'launchDate', 'dateFlexibility', 'deadlineContext', 'readiness', 'decisionMaker', 'otherApprovers'],
```

Remove these entries from `stringLimits`:

```ts
['budgetAndTiming.deadlineContext', 1000],
['budgetAndTiming.otherApprovers', 500],
```

Delete this value-validation block:

```ts
const budgetAllowed = answers.project.primaryType === 'custom-tool'
  ? new Set(customToolBudgetOptions)
  : answers.project.primaryType === 'ongoing-support'
    ? new Set(answers.budgetAndTiming.supportType === 'recurring' ? supportMonthlyBudgetOptions : supportOneTimeBudgetOptions)
    : new Set(websiteBudgetOptions);
if (!budgetAllowed.has(answers.budgetAndTiming.budgetRange as never)) issues.push({ path: 'budgetAndTiming.budgetRange', message: 'Choose a budget range.' });
if (!new Set(timingOptions).has(answers.budgetAndTiming.preferredTiming as never)) issues.push({ path: 'budgetAndTiming.preferredTiming', message: 'Choose a preferred timeframe.' });
```

Delete this date-validation block:

```ts
if (answers.budgetAndTiming.launchDate && Number.isNaN(Date.parse(answers.budgetAndTiming.launchDate))) {
  issues.push({ path: 'budgetAndTiming.launchDate', message: 'Enter a valid date.' });
}
```

Keep `budgetAndTiming` in the required answer structure and strict known-key checks.

- [ ] **Step 8: Make the standard fixture represent a new submission**

Replace `tests/intake/fixtures.ts` budget data with:

```ts
budgetAndTiming: {
  budgetRange: '',
  supportType: '',
  preferredTiming: '',
  launchDate: '',
  dateFlexibility: '',
  deadlineContext: '',
  readiness: '',
  decisionMaker: '',
  otherApprovers: ''
},
```

- [ ] **Step 9: Run focused compatibility and schema tests**

```bash
npx vitest run tests/intake/storage.test.ts tests/intake/conditions.test.ts tests/intake/schema.test.ts
```

Expected: all tests pass.

- [ ] **Step 10: Commit Task 1**

```bash
git add src/lib/intake/types.ts src/data/intake.ts src/lib/intake/storage.ts src/lib/intake/conditions.ts src/lib/intake/schema.ts tests/intake/fixtures.ts tests/intake/storage.test.ts tests/intake/conditions.test.ts tests/intake/schema.test.ts
git commit -m "refactor: remove budget requirements from intake schema"
```

---

### Task 2: Render and Navigate a Five-Step Wizard

**Files:**
- Modify: `src/components/intake/IntakeWizard.astro`
- Modify: `src/components/intake/WizardProgress.astro`
- Modify: `src/components/intake/steps/ReviewStep.astro`
- Delete: `src/components/intake/steps/BudgetStep.astro`
- Modify: `src/scripts/intake-wizard.ts`
- Modify: `tests/intake/markup.test.ts`
- Modify: `tests/intake/wizard.test.ts`

**Interfaces:**
- Consumes: the five-item `wizardSteps` and reduced `WizardStepIndex` from Task 1.
- Produces: rendered indexes `0` through `4`, progress text based on `wizardSteps.length`, and final-step behavior based on `LAST_STEP_INDEX`.

- [ ] **Step 1: Update markup tests for five steps and no removed controls**

Replace the six-step test in `tests/intake/markup.test.ts` with:

```ts
test('wizard markup contains five active steps and no budget controls', async () => {
  const wizard = await read('src/components/intake/IntakeWizard.astro');
  const progress = await read('src/components/intake/WizardProgress.astro');
  const stepFiles = await Promise.all([
    'BusinessStep.astro',
    'ProjectStep.astro',
    'NeedsStep.astro',
    'MaterialsStep.astro',
    'ReviewStep.astro'
  ].map((name) => read(`src/components/intake/steps/${name}`)));
  const markup = [wizard, progress, ...stepFiles].join('\n');

  expect(markup.match(/data-step-index=/g)).toHaveLength(5);
  for (const name of [
    'business.fullName',
    'project.primaryType',
    'needs.customTool.processToImprove',
    'materials.available',
    'contact.preferredMethod',
    'consent.accurate'
  ]) {
    expect(markup).toContain(`name="${name}"`);
  }
  for (const removed of [
    'budgetAndTiming.budgetRange',
    'budgetAndTiming.preferredTiming',
    'budgetAndTiming.readiness',
    'budgetAndTiming.decisionMaker',
    'Budget, timing, and readiness'
  ]) {
    expect(markup).not.toContain(removed);
  }
  expect(markup).toContain('Step 5 of 5');
  expect(markup).toContain('data-condition="store"');
  expect(markup).toContain('data-intake-form');
  expect(markup).toContain('<noscript>');
});
```

- [ ] **Step 2: Change the happy-dom fixture and add a final-step test**

In `tests/intake/wizard.test.ts`, replace the progress-button array with:

```ts
${[0,1,2,3,4].map((index) => `<button data-progress-step="${index}" ${index ? 'disabled' : ''}></button>`).join('')}
```

Replace the step array with:

```ts
${[0,1,2,3,4].map((index) => `<section data-step-index="${index}" data-step-id="${['business','project','needs','materials','review'][index]}" ${index ? 'hidden' : ''}><header class="step-heading" tabindex="-1"></header><section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section>${index === 0 ? '<div data-field-path="business.fullName"><input name="business.fullName"><p data-field-error hidden></p></div><div data-field-path="business.businessName"><input name="business.businessName"><p data-field-error hidden></p></div><div data-field-path="business.email"><input name="business.email"><p data-field-error hidden></p></div><div data-field-path="business.location"><input name="business.location"><p data-field-error hidden></p></div><div data-field-path="business.serviceAreas"><input type="checkbox" name="business.serviceAreas" value="local"><p data-field-error hidden></p></div><div data-field-path="business.offer"><textarea name="business.offer"></textarea><p data-field-error hidden></p></div><div data-field-path="business.customers"><textarea name="business.customers"></textarea><p data-field-error hidden></p></div>' : ''}${index === 1 ? '<input type="radio" name="project.primaryType" value="new-website"><input type="radio" name="project.primaryType" value="custom-tool"><input type="checkbox" name="project.addOns" value="booking">' : ''}${index === 2 ? '<div data-condition="standard-website" hidden></div><div data-condition="custom-tool" hidden></div>' : ''}${index === 4 ? '<div data-review-summary></div><div data-turnstile-widget></div><p data-turnstile-status></p><button type="button" data-turnstile-retry hidden>Try security check again</button><div data-submission-error hidden></div>' : ''}</section>`).join('')}
```

Add this test:

```ts
test('restores review as the fifth and final active step', () => {
  const request = createValidWebsiteSubmission();
  const timestamp = new Date().toISOString();
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify({
    version: 1,
    submissionId: request.submissionId,
    startedAt: request.startedAt,
    updatedAt: timestamp,
    currentStep: 4,
    answers: request.answers
  }));

  initializeIntakeWizard(root);
  (root.querySelector('[data-restore-draft]') as HTMLButtonElement).click();

  expect(root.querySelector('[data-step-index="4"]')?.hasAttribute('hidden')).toBe(false);
  expect(root.querySelector('[data-step-index="5"]')).toBeNull();
  expect(root.querySelector('[data-progress-current]')?.textContent).toContain('Step 5 of 5');
  expect((root.querySelector('[data-submit]') as HTMLButtonElement).hidden).toBe(false);
  expect((root.querySelector('[data-continue]') as HTMLButtonElement).hidden).toBe(true);
});
```

- [ ] **Step 3: Run UI tests and confirm the red state**

```bash
npx vitest run tests/intake/markup.test.ts tests/intake/wizard.test.ts
```

Expected: failures for six rendered steps, visible budget markup, and review at index `5`.

- [ ] **Step 4: Remove the budget component and renumber review**

In `src/components/intake/IntakeWizard.astro`, delete:

```ts
import BudgetStep from './steps/BudgetStep.astro';
```

Delete:

```astro
<BudgetStep />
```

Replace the hidden-selector rule with:

```css
.wizard-step[hidden], [data-condition][hidden], [data-value-condition][hidden] { display: none !important; }
```

Replace the desktop progress grid rule with:

```css
.wizard-progress ol { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
```

Delete `src/components/intake/steps/BudgetStep.astro`.

In `src/components/intake/steps/ReviewStep.astro`, replace the opening markup with:

```astro
<section class="wizard-step" data-step-index="4" data-step-id="review" aria-labelledby="review-step-title" hidden>
  <header class="step-heading" tabindex="-1">
    <p class="eyebrow">Step 5 of 5</p>
    <h2 id="review-step-title">Review the request and choose how I should respond.</h2>
    <p>No price is generated here. I’ll personally review the information and follow up within 2–3 business days.</p>
  </header>
```

Keep the existing `ErrorSummary`, `ReviewSummary`, contact preferences, consent, Turnstile region, and submission error after the header.

- [ ] **Step 5: Derive progress copy from wizard metadata**

In `src/components/intake/WizardProgress.astro`, replace the initial progress paragraph with:

```astro
<p class="wizard-progress__current" aria-live="polite" data-progress-current>
  {`Step 1 of ${wizardSteps.length}: ${wizardSteps[0]?.label ?? 'Your Business'}`}
</p>
```

- [ ] **Step 6: Replace hard-coded six-step browser routing**

In `src/scripts/intake-wizard.ts`, replace `STEP_PREFIXES` and add the final-step constant:

```ts
const STEP_PREFIXES: ReadonlyArray<readonly string[]> = [
  ['business.'],
  ['project.'],
  ['needs.'],
  ['materials.'],
  ['contact.', 'consent.']
];

const LAST_STEP_INDEX = wizardSteps.at(-1)?.index ?? 0;
```

Replace `updateConditions()` with:

```ts
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
```

At the start of `showStep()`, use:

```ts
const safeIndex = Math.max(0, Math.min(LAST_STEP_INDEX, index)) as WizardStepIndex;
```

Use these navigation rules:

```ts
if (back) back.hidden = safeIndex === 0;
if (next) next.hidden = safeIndex === LAST_STEP_INDEX;
if (submit) submit.hidden = safeIndex !== LAST_STEP_INDEX;
```

Use dynamic progress copy:

```ts
if (progress) progress.textContent = `Step ${safeIndex + 1} of ${wizardSteps.length}: ${wizardSteps[safeIndex]?.label ?? ''}`;
```

Use the final-step constant for review and Turnstile:

```ts
if (safeIndex === LAST_STEP_INDEX) {
  renderReview();
  void ensureTurnstile();
}
```

Use the final-step constant when advancing:

```ts
maximumCompletedStep = Math.max(maximumCompletedStep, Math.min(LAST_STEP_INDEX, draft.currentStep + 1));
```

Replace the submit validation loop header with:

```ts
for (const step of wizardSteps) {
  const index = step.index;
  const issues = validateWizardStep(index, draft.answers);
```

Keep the existing loop body that shows errors and returns when `issues.length > 0`.

- [ ] **Step 7: Run focused UI verification**

```bash
npx vitest run tests/intake/markup.test.ts tests/intake/wizard.test.ts
npm run check
```

Expected: both commands pass.

- [ ] **Step 8: Commit Task 2**

```bash
git add src/components/intake/IntakeWizard.astro src/components/intake/WizardProgress.astro src/components/intake/steps/ReviewStep.astro src/components/intake/steps/BudgetStep.astro src/scripts/intake-wizard.ts tests/intake/markup.test.ts tests/intake/wizard.test.ts
git commit -m "feat: convert intake wizard to five steps"
```

---

### Task 3: Remove Budget Data From Review and Emails

**Files:**
- Modify: `src/lib/intake/email.ts:125-162`
- Modify: `src/components/intake/ReviewSummary.astro`
- Modify: `tests/intake/email.test.ts`
- Modify: `tests/intake/markup.test.ts`

**Interfaces:**
- Consumes: `buildSummarySections(intake: NormalizedIntake): SummarySection[]`.
- Produces: exactly five summary sections in this order: Business, Project, Needs, Materials, Contact.

- [ ] **Step 1: Add failing summary and email tests**

Change the import in `tests/intake/email.test.ts` to:

```ts
import { buildSummarySections, formatClientEmail, formatOwnerEmail } from '../../src/lib/intake/email';
```

Add:

```ts
test('excludes budget, timing, readiness, launch, and approval data from summaries', () => {
  const value = normalized();
  Object.assign(value.answers.budgetAndTiming, {
    budgetRange: '1000-2500',
    preferredTiming: '1-3-months',
    launchDate: '2026-10-01',
    deadlineContext: 'Seasonal launch',
    readiness: 'ready',
    decisionMaker: 'client',
    otherApprovers: 'Business partner'
  });

  const sections = buildSummarySections(value);
  const combined = JSON.stringify(sections);

  expect(sections.map((section) => section.title)).toEqual([
    'Business', 'Project', 'Needs', 'Materials', 'Contact'
  ]);
  for (const removed of [
    'Budget & timing', 'Budget range', 'Preferred timing', 'Desired launch date',
    'Deadline context', 'Readiness', 'Decision maker', 'Other approvers',
    'Seasonal launch', 'Business partner'
  ]) {
    expect(combined).not.toContain(removed);
  }
});
```

Change the owner-email section assertion to:

```ts
for (const section of ['Business', 'Project', 'Needs', 'Materials', 'Contact']) {
  expect(email.text).toContain(section);
  expect(email.html).toContain(section.replace('&', '&amp;'));
}
expect(email.text).not.toContain('Budget & timing');
```

Add this test to `tests/intake/markup.test.ts`:

```ts
test('review summary exposes five editable sections without budget and timing', async () => {
  const review = await read('src/components/intake/ReviewSummary.astro');
  expect(review).toContain("['Business', 'Project', 'Needs', 'Materials', 'Contact']");
  expect(review).not.toContain('Budget & timing');
});
```

- [ ] **Step 2: Run output tests and confirm the red state**

```bash
npx vitest run tests/intake/email.test.ts tests/intake/markup.test.ts
```

Expected: failures for the sixth summary section and budget/timing labels.

- [ ] **Step 3: Remove the budget summary block**

Delete this block from `src/lib/intake/email.ts`:

```ts
const budget: SummaryRow[] = [];
addRow(budget, 'Budget range', humanize(answers.budgetAndTiming.budgetRange));
addRow(budget, 'Support type', answers.budgetAndTiming.supportType);
addRow(budget, 'Preferred timing', answers.budgetAndTiming.preferredTiming);
addRow(budget, 'Desired launch date', answers.budgetAndTiming.launchDate);
addRow(budget, 'Date flexibility', answers.budgetAndTiming.dateFlexibility);
addRow(budget, 'Deadline context', answers.budgetAndTiming.deadlineContext);
addRow(budget, 'Readiness', answers.budgetAndTiming.readiness);
addRow(budget, 'Decision maker', answers.budgetAndTiming.decisionMaker);
addRow(budget, 'Other approvers', answers.budgetAndTiming.otherApprovers);
```

Replace the returned section list with:

```ts
return [
  { title: 'Business', rows: business },
  { title: 'Project', rows: project },
  { title: 'Needs', rows: needs },
  { title: 'Materials', rows: materials },
  { title: 'Contact', rows: contact }
];
```

- [ ] **Step 4: Remove the budget review card**

In `src/components/intake/ReviewSummary.astro`, replace the title array with:

```astro
{['Business', 'Project', 'Needs', 'Materials', 'Contact'].map((title, index) => (
```

The existing `data-edit-step={index}` maps Contact to step `4`.

- [ ] **Step 5: Run output tests**

```bash
npx vitest run tests/intake/email.test.ts tests/intake/markup.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/lib/intake/email.ts src/components/intake/ReviewSummary.astro tests/intake/email.test.ts tests/intake/markup.test.ts
git commit -m "feat: remove budget details from intake summaries"
```

---

### Task 4: Remap Validation Feedback to Five Steps

**Files:**
- Modify: `src/scripts/intake-server-validation-feedback.ts:12-19`
- Modify: `src/scripts/intake-response-feedback.ts:10-17`
- Modify: `tests/intake/server-validation-feedback.test.ts`
- Modify: `tests/intake/direct-server-feedback.test.ts`

**Interfaces:**
- Consumes: normalized validation issue paths.
- Produces: `business=0`, `project=1`, `needs=2`, `materials=3`, `contact/consent=4`; `budgetAndTiming` has no active step.

- [ ] **Step 1: Update server-feedback test fixtures and assertions**

In `tests/intake/server-validation-feedback.test.ts`, replace progress generation with:

```ts
${[0, 1, 2, 3, 4].map((index) => `<button data-progress-step="${index}"></button>`).join('')}
```

Replace the intermediate and final section markup with:

```ts
${[1, 2, 3].map((index) => `<section data-step-index="${index}" hidden><section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section></section>`).join('')}
<section data-step-index="4">
  <section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section>
  <input name="contact.preferredMethod" value="email" />
  <input name="honeypot" value="" />
  <div data-submission-error>Generic error</div>
  <button type="submit">Submit</button>
</section>
```

Change stored drafts to:

```ts
currentStep: 4,
```

Replace the mapping assertions with:

```ts
expect(canonicalServerIssuePath('answers.business.socialLinks.0')).toBe('business.socialLinks');
expect(stepIndexForServerIssue('answers.business.email')).toBe(0);
expect(stepIndexForServerIssue('answers.contact.preferredMethod')).toBe(4);
expect(stepIndexForServerIssue('answers.budgetAndTiming.budgetRange')).toBeNull();
expect(stepIndexForServerIssue('submissionId')).toBeNull();
```

- [ ] **Step 2: Update direct-response feedback tests**

In `tests/intake/direct-server-feedback.test.ts`, replace both `[0, 1, 2, 3, 4, 5]` arrays with:

```ts
[0, 1, 2, 3, 4]
```

Change the initially visible step condition to:

```ts
index === 4
```

Add:

```ts
test('legacy budget issues use the generic fallback instead of a removed step', () => {
  const window = buildWindow();
  const shown = showIntakeValidationIssues(window.document as unknown as Document, [
    { path: 'budgetAndTiming.budgetRange', message: 'Legacy budget issue.' }
  ]);

  expect(shown).toBe(false);
  expect(window.document.querySelector('[data-submission-error]')?.textContent).toContain('Legacy budget issue');
});
```

- [ ] **Step 3: Run feedback tests and confirm the red state**

```bash
npx vitest run tests/intake/server-validation-feedback.test.ts tests/intake/direct-server-feedback.test.ts
```

Expected: failures because contact still maps to step `5` and budget still maps to step `4`.

- [ ] **Step 4: Replace both production prefix maps**

In `src/scripts/intake-server-validation-feedback.ts` and `src/scripts/intake-response-feedback.ts`, replace `STEP_PREFIXES` with:

```ts
const STEP_PREFIXES: ReadonlyArray<readonly string[]> = [
  ['business.'],
  ['project.'],
  ['needs.'],
  ['materials.'],
  ['contact.', 'consent.']
];
```

Do not change path normalization, field highlighting, generic fallback copy, or fetch interception.

- [ ] **Step 5: Run feedback tests**

```bash
npx vitest run tests/intake/server-validation-feedback.test.ts tests/intake/direct-server-feedback.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/scripts/intake-server-validation-feedback.ts src/scripts/intake-response-feedback.ts tests/intake/server-validation-feedback.test.ts tests/intake/direct-server-feedback.test.ts
git commit -m "fix: route intake validation across five steps"
```

---

### Task 5: Update Browser Journeys and Build Verification

**Files:**
- Modify: `tests/e2e/intake.spec.ts`
- Modify: `scripts/verify-build-output.mjs`

**Interfaces:**
- Consumes: the complete five-step flow from Tasks 1–4.
- Produces: Chromium and WebKit coverage for submission, delayed confirmation handling, legacy-step restoration, and absence of removed budget UI.

- [ ] **Step 1: Remove the budget E2E helper and update flow assertions**

Delete this helper from `tests/e2e/intake.spec.ts`:

```ts
async function completeBudget(page: Page): Promise<void> {
  await page.locator('#budget-website').selectOption('1000-2500');
  await page.getByLabel('Preferred timing').selectOption('1-3-months');
  await page.getByLabel('How ready are you to begin?').selectOption('ready');
  await page.getByLabel('Who makes the final project decision?').selectOption('client');
  await page.getByRole('button', { name: 'Continue' }).click();
}
```

Rename the main flow test to:

```ts
test('completes the five-step website flow and confirms receipt', async ({ page }) => {
```

Remove both `completeBudget(page)` calls.

After `continueMaterials(page)` in the main flow, add:

```ts
await expect(page.getByText('Step 5 of 5', { exact: true })).toBeVisible();
await expect(page.getByText('Approximate budget range')).toHaveCount(0);
await expect(page.getByText('Preferred timing')).toHaveCount(0);
await expect(page.getByText('How ready are you to begin?')).toHaveCount(0);
```

Change the required-error expectation to:

```ts
await expect(page.getByText('Step 1 of 5', { exact: true })).toBeVisible();
```

- [ ] **Step 2: Add a legacy-step restoration browser test**

Add:

```ts
test('restores a legacy step-six draft at the new review step', async ({ page }) => {
  await begin(page);
  await page.evaluate(() => {
    const key = 'calypso:intake:v1';
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error('Expected an intake draft');
    const draft = JSON.parse(raw) as { currentStep: number };
    draft.currentStep = 5;
    window.localStorage.setItem(key, JSON.stringify(draft));
  });

  await page.reload();
  await page.getByRole('button', { name: 'Continue Saved Project' }).click();

  await expect(page.getByText('Step 5 of 5', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review the request and choose how I should respond.' })).toBeVisible();
});
```

- [ ] **Step 3: Update production build-output checks**

In `scripts/verify-build-output.mjs`, replace the required intake labels with:

```js
for (const required of ['data-intake-form', 'Your Business', 'Project Type', 'Project Needs', 'Branding &amp; Materials', 'Review &amp; Contact', 'calydigital@outlook.com']) {
  if (!startHtml.includes(required)) errors.push(`/start: missing ${required}`);
}
```

Replace the forbidden-copy loop with:

```js
for (const forbidden of [
  'Until the guided form is activated',
  'What the full guided form will cover',
  'Budget &amp; Timing',
  'Approximate budget range',
  'Preferred timing',
  'How ready are you to begin?',
  'Who makes the final project decision?'
]) {
  if (startHtml.includes(forbidden)) errors.push(`/start: removed or placeholder copy remains: ${forbidden}`);
}
```

- [ ] **Step 4: Run the full verification sequence**

```bash
npm test
npm run verify:assets
npm run verify:content
npm run check
npm run build
npm run verify:build
npm run test:e2e
```

Expected:

- Foundation and Vitest suites report zero failures.
- Asset and content verification exit successfully.
- Astro and TypeScript checks report zero errors.
- Production build succeeds.
- Build-output verification confirms five-step markup and rejects removed budget copy.
- Playwright passes in Chromium and WebKit.

- [ ] **Step 5: Inspect scope before the final commit**

```bash
git diff --stat main...HEAD
git diff main...HEAD -- src/lib/intake/resend.ts src/lib/intake/turnstile.ts functions/api/intake.ts wrangler.toml
```

Expected:

- The first command lists only files named in this plan plus the approved spec and plan documents.
- The second command has no output.

- [ ] **Step 6: Commit Task 5**

```bash
git add tests/e2e/intake.spec.ts scripts/verify-build-output.mjs
git commit -m "test: verify five-step intake flow"
```

- [ ] **Step 7: Re-run full verification after the final commit**

```bash
npm test && npm run verify:assets && npm run verify:content && npm run check && npm run build && npm run verify:build && npm run test:e2e
```

Expected: exit code `0` with no failed tests or verification steps.

---

## Final Review Checklist

- [ ] `wizardSteps` has five entries and no `budget` entry.
- [ ] Active browser indexes are only `0` through `4`.
- [ ] Legacy stored `currentStep: 5` restores as `4`.
- [ ] `BudgetAndTimingAnswers` and `IntakeAnswers.budgetAndTiming` still exist.
- [ ] No `budgetAndTiming.*` path is required.
- [ ] Recognized legacy budget values do not cause validation failure.
- [ ] No budget, timing, readiness, launch-date, or approval control exists in rendered markup.
- [ ] Review contains Business, Project, Needs, Materials, and Contact only.
- [ ] Owner and client emails contain no removed data.
- [ ] Client and server validation feedback route Contact and Consent to step `4`.
- [ ] Turnstile, Resend, API delivery, environment variables, and schema version remain unchanged.
- [ ] Full verification passes after the final commit.
