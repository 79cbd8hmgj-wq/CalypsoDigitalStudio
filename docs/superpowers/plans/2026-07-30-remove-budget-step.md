# Remove Budget Intake Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the guided intake into a five-step flow and remove all budget, timing, readiness, launch-date, and approval questions from the form, review, validation, and emails without invalidating version-one saved drafts.

**Architecture:** Keep `budgetAndTiming` as a recognized compatibility object in version-one drafts and API payloads, but remove every visible control, required-path rule, business-value validation, and summary output that uses it. Centralize the active step count in `wizardSteps`, clamp legacy saved step `5` to the new final step `4`, and update all client/server error-routing maps to the five-step order.

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
- Do not change Turnstile behavior, Resend behavior, submission references, or confirmation copy outside removed budget/timing content.
- Use TDD: add or update a focused failing test before each production change.
- Node commands must run under Node `>=22.12.0 <23`.

---

## File Structure Map

### Active flow and compatibility

- `src/lib/intake/types.ts` — active step-index type and retained compatibility interfaces.
- `src/data/intake.ts` — authoritative ordered `wizardSteps` list.
- `src/lib/intake/storage.ts` — empty draft creation, legacy draft acceptance, and step clamping.
- `src/lib/intake/conditions.ts` — conditional required paths; budget/timing requirements are removed here.
- `src/lib/intake/schema.ts` — structural payload validation; compatibility keys remain accepted while their business rules are removed.

### UI and navigation

- `src/components/intake/IntakeWizard.astro` — step composition and five-column desktop progress styling.
- `src/components/intake/WizardProgress.astro` — initial accessible progress text and progress buttons.
- `src/components/intake/steps/ReviewStep.astro` — new final step index and copy.
- `src/components/intake/steps/BudgetStep.astro` — delete after its import and render call are removed.
- `src/scripts/intake-wizard.ts` — browser step routing, validation loops, progress text, draft opening, and review rendering.

### Review and email output

- `src/components/intake/ReviewSummary.astro` — five visible review cards and edit-step indexes.
- `src/lib/intake/email.ts` — shared summary sections used by browser review and both emails.

### Server-validation feedback routing

- `src/scripts/intake-server-validation-feedback.ts` — client precheck and server issue-to-step routing.
- `src/scripts/intake-response-feedback.ts` — API validation response-to-step routing.

### Tests and verification

- `tests/intake/storage.test.ts`
- `tests/intake/conditions.test.ts`
- `tests/intake/schema.test.ts`
- `tests/intake/fixtures.ts`
- `tests/intake/markup.test.ts`
- `tests/intake/wizard.test.ts`
- `tests/intake/email.test.ts`
- `tests/intake/server-validation-feedback.test.ts`
- `tests/intake/direct-server-feedback.test.ts`
- `tests/e2e/intake.spec.ts`
- `scripts/verify-build-output.mjs`

---

### Task 1: Preserve Version-One Draft Compatibility While Removing Budget Requirements

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
- Consumes: existing `IntakeDraft`, `IntakeAnswers`, `validateAndNormalizeIntake`, and `requiredPathsFor` APIs.
- Produces: `WizardStepIndex = 0 | 1 | 2 | 3 | 4`; a five-item `wizardSteps`; `loadDraft()` that accepts legacy stored step `5` but returns active step `4`; schema validation that accepts recognized historical `budgetAndTiming` values without requiring or validating them.

- [ ] **Step 1: Add failing storage and step-metadata tests**

Add these imports and tests to `tests/intake/storage.test.ts`:

```ts
import { wizardSteps } from '../../src/data/intake';

// Existing imports remain.

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

- [ ] **Step 2: Add failing required-path and schema compatibility tests**

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

Replace the fixed-date schema test in `tests/intake/schema.test.ts` and add a legacy-data test:

```ts
test('enforces the phone requirement without requiring budget or timing fields', () => {
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

test('accepts recognized historical budget and timing values as ignored compatibility data', () => {
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

In the `ongoing-support` branch case, remove these lines:

```ts
request.answers.budgetAndTiming.supportType = 'one-time';
request.answers.budgetAndTiming.budgetRange = '500-1000';
```

- [ ] **Step 3: Run the focused tests to verify they fail**

Run:

```bash
npx vitest run tests/intake/storage.test.ts tests/intake/conditions.test.ts tests/intake/schema.test.ts
```

Expected: failures showing six wizard steps, legacy step `5` not clamped, budget/timing required paths still present, and legacy values rejected.

- [ ] **Step 4: Reduce the active step type and metadata to five steps**

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

Do not remove `BudgetAndTimingAnswers` or `IntakeAnswers.budgetAndTiming`.

- [ ] **Step 5: Make stored-draft validation explicitly accept legacy step 5 and clamp it**

In `src/lib/intake/storage.ts`, add this type near the imports:

```ts
type StoredIntakeDraft = Omit<IntakeDraft, 'currentStep'> & { currentStep: number };
```

Change the draft guard signature:

```ts
function isDraft(value: unknown): value is StoredIntakeDraft {
```

Keep the stored range check at `0` through `5` so version-one legacy drafts remain accepted:

```ts
if (!Number.isInteger(value.currentStep) || Number(value.currentStep) < 0 || Number(value.currentStep) > 5) return false;
```

Replace the final normalization in `loadDraft()` with:

```ts
parsed.currentStep = Math.min(parsed.currentStep, 4);
parsed.answers = sanitizeStoredIntakeAnswers(parsed.answers);
return parsed as IntakeDraft;
```

Keep `createEmptyAnswers()` and its empty `budgetAndTiming` object unchanged.

- [ ] **Step 6: Remove budget/timing conditions and required paths**

In `src/lib/intake/conditions.ts`:

1. Remove `requireLaunchDate` from `IntakeConditions`.
2. Remove this property from `deriveConditions()`:

```ts
requireLaunchDate: answers.budgetAndTiming.dateFlexibility === 'fixed',
```

3. Remove these four common required paths:

```ts
'budgetAndTiming.budgetRange',
'budgetAndTiming.preferredTiming',
'budgetAndTiming.readiness',
'budgetAndTiming.decisionMaker',
```

4. Remove this conditional requirement:

```ts
if (conditions.requireLaunchDate) paths.push('budgetAndTiming.launchDate');
```

Do not change needs-branch clearing logic.

- [ ] **Step 7: Remove budget/timing business validation but retain structural keys**

In `src/lib/intake/schema.ts`:

1. Remove these imports from `../../data/intake`:

```ts
customToolBudgetOptions,
supportMonthlyBudgetOptions,
supportOneTimeBudgetOptions,
timingOptions,
websiteBudgetOptions
```

2. Keep this structural key list unchanged so recognized legacy fields remain allowed:

```ts
budgetAndTiming: ['budgetRange', 'supportType', 'preferredTiming', 'launchDate', 'dateFlexibility', 'deadlineContext', 'readiness', 'decisionMaker', 'otherApprovers'],
```

3. Remove these entries from `stringLimits`:

```ts
['budgetAndTiming.deadlineContext', 1000],
['budgetAndTiming.otherApprovers', 500],
```

4. Delete the complete budget/timing value-validation block:

```ts
const budgetAllowed = answers.project.primaryType === 'custom-tool'
  ? new Set(customToolBudgetOptions)
  : answers.project.primaryType === 'ongoing-support'
    ? new Set(answers.budgetAndTiming.supportType === 'recurring' ? supportMonthlyBudgetOptions : supportOneTimeBudgetOptions)
    : new Set(websiteBudgetOptions);
if (!budgetAllowed.has(answers.budgetAndTiming.budgetRange as never)) issues.push({ path: 'budgetAndTiming.budgetRange', message: 'Choose a budget range.' });
if (!new Set(timingOptions).has(answers.budgetAndTiming.preferredTiming as never)) issues.push({ path: 'budgetAndTiming.preferredTiming', message: 'Choose a preferred timeframe.' });
```

5. Delete the launch-date parsing rule:

```ts
if (answers.budgetAndTiming.launchDate && Number.isNaN(Date.parse(answers.budgetAndTiming.launchDate))) {
  issues.push({ path: 'budgetAndTiming.launchDate', message: 'Enter a valid date.' });
}
```

Keep `budgetAndTiming` in the required answer structure at the beginning of validation.

- [ ] **Step 8: Make the standard test fixture represent a new five-step submission**

In `tests/intake/fixtures.ts`, replace the populated compatibility object with:

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

- [ ] **Step 9: Run focused validation tests**

Run:

```bash
npx vitest run tests/intake/storage.test.ts tests/intake/conditions.test.ts tests/intake/schema.test.ts
```

Expected: all tests pass.

- [ ] **Step 10: Commit the compatibility and validation changes**

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
- Consumes: the five-item `wizardSteps` and `WizardStepIndex` from Task 1.
- Produces: a DOM containing indexes `0` through `4`; dynamic progress copy based on `wizardSteps.length`; final-step behavior driven by the last `wizardSteps` entry.

- [ ] **Step 1: Update markup tests to require five steps and prohibit removed controls**

Replace the six-step test in `tests/intake/markup.test.ts` with:

```ts
test('wizard markup contains five steps, exact active answer paths, and no budget controls', async () => {
  const wizard = await read('src/components/intake/IntakeWizard.astro');
  const stepFiles = await Promise.all([
    'BusinessStep.astro',
    'ProjectStep.astro',
    'NeedsStep.astro',
    'MaterialsStep.astro',
    'ReviewStep.astro'
  ].map((name) => read(`src/components/intake/steps/${name}`)));
  const progress = await read('src/components/intake/WizardProgress.astro');
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

- [ ] **Step 2: Change the happy-dom wizard fixture to five steps and add a final-step assertion**

In `tests/intake/wizard.test.ts`, replace the two six-item generated arrays in `html()` with:

```ts
${[0,1,2,3,4].map((index) => `<button data-progress-step="${index}" ${index ? 'disabled' : ''}></button>`).join('')}
```

and:

```ts
${[0,1,2,3,4].map((index) => `<section data-step-index="${index}" data-step-id="${['business','project','needs','materials','review'][index]}" ${index ? 'hidden' : ''}><header class="step-heading" tabindex="-1"></header><section data-error-summary hidden tabindex="-1"><ul data-error-list></ul></section>${index === 0 ? '<div data-field-path="business.fullName"><input name="business.fullName"><p data-field-error hidden></p></div><div data-field-path="business.businessName"><input name="business.businessName"><p data-field-error hidden></p></div><div data-field-path="business.email"><input name="business.email"><p data-field-error hidden></p></div><div data-field-path="business.location"><input name="business.location"><p data-field-error hidden></p></div><div data-field-path="business.serviceAreas"><input type="checkbox" name="business.serviceAreas" value="local"><p data-field-error hidden></p></div><div data-field-path="business.offer"><textarea name="business.offer"></textarea><p data-field-error hidden></p></div><div data-field-path="business.customers"><textarea name="business.customers"></textarea><p data-field-error hidden></p></div>' : ''}${index === 1 ? '<input type="radio" name="project.primaryType" value="new-website"><input type="radio" name="project.primaryType" value="custom-tool"><input type="checkbox" name="project.addOns" value="booking">' : ''}${index === 2 ? '<div data-condition="standard-website" hidden></div><div data-condition="custom-tool" hidden></div>' : ''}${index === 4 ? '<div data-review-summary></div><div data-turnstile-widget></div><p data-turnstile-status></p><button type="button" data-turnstile-retry hidden>Try security check again</button><div data-submission-error hidden></div>' : ''}</section>`).join('')}
```

Add this test:

```ts
test('review is the fifth and final active step', () => {
  initializeIntakeWizard(root);
  (root.querySelector('[data-start-intake]') as HTMLButtonElement).click();

  for (const index of [1, 2, 3, 4]) {
    (root.querySelector(`[data-progress-step="${index}"]`) as HTMLButtonElement).disabled = false;
  }
  (root.querySelector('[data-progress-step="4"]') as HTMLButtonElement).click();

  expect(root.querySelector('[data-step-index="4"]')?.hasAttribute('hidden')).toBe(false);
  expect(root.querySelector('[data-step-index="5"]')).toBeNull();
  expect(root.querySelector('[data-progress-current]')?.textContent).toContain('Step 5 of 5');
  expect((root.querySelector('[data-submit]') as HTMLButtonElement).hidden).toBe(false);
  expect((root.querySelector('[data-continue]') as HTMLButtonElement).hidden).toBe(true);
});
```

- [ ] **Step 3: Run the focused markup and wizard tests to verify they fail**

Run:

```bash
npx vitest run tests/intake/markup.test.ts tests/intake/wizard.test.ts
```

Expected: failures showing six rendered steps, the budget component and controls still present, and review still at index `5`.

- [ ] **Step 4: Remove the budget component and renumber review**

In `src/components/intake/IntakeWizard.astro`:

1. Delete:

```ts
import BudgetStep from './steps/BudgetStep.astro';
```

2. Delete:

```astro
<BudgetStep />
```

3. Change the hidden-selector rule from:

```css
.wizard-step[hidden], [data-condition][hidden], [data-value-condition][hidden], [data-budget-set][hidden], [data-support-budget][hidden] { display: none !important; }
```

To:

```css
.wizard-step[hidden], [data-condition][hidden], [data-value-condition][hidden] { display: none !important; }
```

4. Change the desktop progress grid to:

```css
.wizard-progress ol { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
```

Delete `src/components/intake/steps/BudgetStep.astro`.

In `src/components/intake/steps/ReviewStep.astro`, replace the opening section and eyebrow with:

```astro
<section class="wizard-step" data-step-index="4" data-step-id="review" aria-labelledby="review-step-title" hidden>
  <header class="step-heading" tabindex="-1">
    <p class="eyebrow">Step 5 of 5</p>
```

Keep the review heading, contact fields, consent, Turnstile, and submission error unchanged.

- [ ] **Step 5: Make initial progress copy derive from metadata**

In `src/components/intake/WizardProgress.astro`, replace the initial paragraph with:

```astro
<p class="wizard-progress__current" aria-live="polite" data-progress-current>
  {`Step 1 of ${wizardSteps.length}: ${wizardSteps[0]?.label ?? 'Your Business'}`}
</p>
```

- [ ] **Step 6: Replace hard-coded six-step routing in the browser controller**

In `src/scripts/intake-wizard.ts`, replace `STEP_PREFIXES` with:

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

Remove all `data-budget-set` and `data-support-budget` loops from `updateConditions()`:

```ts
for (const element of root.querySelectorAll<HTMLElement>('[data-budget-set]')) { /* remove entire loop */ }
for (const element of root.querySelectorAll<HTMLElement>('[data-support-budget]')) { /* remove entire loop */ }
```

Replace the beginning of `showStep()` with:

```ts
const safeIndex = Math.max(0, Math.min(LAST_STEP_INDEX, index)) as WizardStepIndex;
```

Replace the navigation visibility rules with:

```ts
if (back) back.hidden = safeIndex === 0;
if (next) next.hidden = safeIndex === LAST_STEP_INDEX;
if (submit) submit.hidden = safeIndex !== LAST_STEP_INDEX;
```

Replace progress copy with:

```ts
if (progress) progress.textContent = `Step ${safeIndex + 1} of ${wizardSteps.length}: ${wizardSteps[safeIndex]?.label ?? ''}`;
```

Replace the review trigger with:

```ts
if (safeIndex === LAST_STEP_INDEX) {
  renderReview();
  void ensureTurnstile();
}
```

Replace the continue-button maximum calculation with:

```ts
maximumCompletedStep = Math.max(maximumCompletedStep, Math.min(LAST_STEP_INDEX, draft.currentStep + 1));
```

Replace the submit validation loop:

```ts
for (let index = 0; index < 6; index += 1) {
  const issues = validateWizardStep(index, draft.answers);
```

with:

```ts
for (const step of wizardSteps) {
  const index = step.index;
  const issues = validateWizardStep(index, draft.answers);
```

Keep submission, Turnstile, saving, and confirmation behavior unchanged.

- [ ] **Step 7: Run focused UI tests**

Run:

```bash
npx vitest run tests/intake/markup.test.ts tests/intake/wizard.test.ts
npm run check
```

Expected: all commands pass.

- [ ] **Step 8: Commit the five-step UI**

```bash
git add src/components/intake/IntakeWizard.astro src/components/intake/WizardProgress.astro src/components/intake/steps/ReviewStep.astro src/components/intake/steps/BudgetStep.astro src/scripts/intake-wizard.ts tests/intake/markup.test.ts tests/intake/wizard.test.ts
git commit -m "feat: convert intake wizard to five steps"
```

---

### Task 3: Remove Budget and Timing From Review and Emails

**Files:**
- Modify: `src/lib/intake/email.ts:125-162`
- Modify: `src/components/intake/ReviewSummary.astro`
- Modify: `tests/intake/email.test.ts`
- Modify: `tests/intake/markup.test.ts`

**Interfaces:**
- Consumes: `buildSummarySections(intake: NormalizedIntake): SummarySection[]`.
- Produces: exactly five summary sections in this order: Business, Project, Needs, Materials, Contact. Browser review and both email formatters consume the same list.

- [ ] **Step 1: Add failing summary and email assertions**

In `tests/intake/email.test.ts`, import `buildSummarySections`:

```ts
import { buildSummarySections, formatClientEmail, formatOwnerEmail } from '../../src/lib/intake/email';
```

Add:

```ts
test('excludes budget, timing, readiness, launch, and approval data from every summary', () => {
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

Update the owner-email section loop to:

```ts
for (const section of ['Business', 'Project', 'Needs', 'Materials', 'Contact']) {
  expect(email.text).toContain(section);
  expect(email.html).toContain(section.replace('&', '&amp;'));
}
expect(email.text).not.toContain('Budget & timing');
```

In `tests/intake/markup.test.ts`, add this test:

```ts
test('review summary exposes five editable sections without budget and timing', async () => {
  const review = await read('src/components/intake/ReviewSummary.astro');
  for (const title of ['Business', 'Project', 'Needs', 'Materials', 'Contact']) {
    expect(review).toContain(`'${title}'`);
  }
  expect(review).not.toContain('Budget & timing');
});
```

- [ ] **Step 2: Run focused output tests to verify they fail**

Run:

```bash
npx vitest run tests/intake/email.test.ts tests/intake/markup.test.ts
```

Expected: failures because the sixth summary section and budget/timing values still exist.

- [ ] **Step 3: Remove the budget summary section from the shared builder**

In `src/lib/intake/email.ts`, delete the entire budget block:

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

- [ ] **Step 4: Remove the review card and remap contact edit to step 4**

In `src/components/intake/ReviewSummary.astro`, replace the title array with:

```astro
{['Business', 'Project', 'Needs', 'Materials', 'Contact'].map((title, index) => (
```

The existing `data-edit-step={index}` then maps Contact to active step `4`.

- [ ] **Step 5: Run output tests**

Run:

```bash
npx vitest run tests/intake/email.test.ts tests/intake/markup.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit the output removal**

```bash
git add src/lib/intake/email.ts src/components/intake/ReviewSummary.astro tests/intake/email.test.ts tests/intake/markup.test.ts
git commit -m "feat: remove budget details from intake summaries"
```

---

### Task 4: Remap Client and Server Validation Feedback to Five Steps

**Files:**
- Modify: `src/scripts/intake-server-validation-feedback.ts:12-19`
- Modify: `src/scripts/intake-response-feedback.ts:10-17`
- Modify: `tests/intake/server-validation-feedback.test.ts`
- Modify: `tests/intake/direct-server-feedback.test.ts`

**Interfaces:**
- Consumes: normalized validation issue paths.
- Produces: issue routing where `business=0`, `project=1`, `needs=2`, `materials=3`, `contact/consent=4`, and `budgetAndTiming` has no active step.

- [ ] **Step 1: Update feedback tests to require five-step routing**

In `tests/intake/server-validation-feedback.test.ts`:

1. Replace progress generation with:

```ts
${[0, 1, 2, 3, 4].map((index) => `<button data-progress-step="${index}"></button>`).join('')}
```

2. Replace the intermediate and final sections with:

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

3. Store drafts at `currentStep: 4`.

4. Replace the mapping expectations with:

```ts
expect(canonicalServerIssuePath('answers.business.socialLinks.0')).toBe('business.socialLinks');
expect(stepIndexForServerIssue('answers.business.email')).toBe(0);
expect(stepIndexForServerIssue('answers.contact.preferredMethod')).toBe(4);
expect(stepIndexForServerIssue('answers.budgetAndTiming.budgetRange')).toBeNull();
expect(stepIndexForServerIssue('submissionId')).toBeNull();
```

In `tests/intake/direct-server-feedback.test.ts`, replace both generated arrays with `[0, 1, 2, 3, 4]` and change the initially visible step condition from `index === 5` to `index === 4`.

Add this direct-feedback assertion:

```ts
test('legacy budget issues have no active field step and use the generic fallback', () => {
  const window = buildWindow();
  const shown = showIntakeValidationIssues(window.document as unknown as Document, [
    { path: 'budgetAndTiming.budgetRange', message: 'Legacy budget issue.' }
  ]);

  expect(shown).toBe(false);
  expect(window.document.querySelector('[data-submission-error]')?.textContent).toContain('Legacy budget issue');
});
```

- [ ] **Step 2: Run feedback tests to verify they fail**

Run:

```bash
npx vitest run tests/intake/server-validation-feedback.test.ts tests/intake/direct-server-feedback.test.ts
```

Expected: failures because contact still maps to step `5` and budget still maps to step `4`.

- [ ] **Step 3: Replace both feedback prefix maps**

In both `src/scripts/intake-server-validation-feedback.ts` and `src/scripts/intake-response-feedback.ts`, replace `STEP_PREFIXES` with:

```ts
const STEP_PREFIXES: ReadonlyArray<readonly string[]> = [
  ['business.'],
  ['project.'],
  ['needs.'],
  ['materials.'],
  ['contact.', 'consent.']
];
```

Do not alter path normalization, field highlighting, generic fallback copy, or fetch interception.

- [ ] **Step 4: Run feedback tests**

Run:

```bash
npx vitest run tests/intake/server-validation-feedback.test.ts tests/intake/direct-server-feedback.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit feedback routing changes**

```bash
git add src/scripts/intake-server-validation-feedback.ts src/scripts/intake-response-feedback.ts tests/intake/server-validation-feedback.test.ts tests/intake/direct-server-feedback.test.ts
git commit -m "fix: route intake validation across five steps"
```

---

### Task 5: Update Browser Journeys and Production Build Verification

**Files:**
- Modify: `tests/e2e/intake.spec.ts`
- Modify: `scripts/verify-build-output.mjs`

**Interfaces:**
- Consumes: the complete five-step browser flow from Tasks 1–4.
- Produces: Chromium and WebKit coverage proving submission, delayed confirmation handling, legacy draft restoration, and absence of removed budget UI.

- [ ] **Step 1: Remove the budget helper and update E2E expectations**

Delete `completeBudget()` from `tests/e2e/intake.spec.ts`:

```ts
async function completeBudget(page: Page): Promise<void> {
  await page.locator('#budget-website').selectOption('1000-2500');
  await page.getByLabel('Preferred timing').selectOption('1-3-months');
  await page.getByLabel('How ready are you to begin?').selectOption('ready');
  await page.getByLabel('Who makes the final project decision?').selectOption('client');
  await page.getByRole('button', { name: 'Continue' }).click();
}
```

Rename the main test and remove its `completeBudget(page)` call:

```ts
test('completes the five-step website flow and confirms receipt', async ({ page }) => {
```

After `continueMaterials(page)`, assert:

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

Remove `completeBudget(page)` from the delayed-client-copy test.

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

Extend the forbidden list to prove the removed UI is absent:

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

- [ ] **Step 4: Run the complete verification sequence**

Run in this order:

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
- Build-output verification confirms five-step intake markup and rejects removed budget copy.
- Playwright passes in Chromium and WebKit.

- [ ] **Step 5: Inspect the final diff for forbidden scope changes**

Run:

```bash
git diff --stat main...HEAD
git diff main...HEAD -- src/lib/intake/resend.ts src/lib/intake/turnstile.ts functions/api/intake.ts wrangler.toml
```

Expected:

- The first command lists only the files named in this plan plus the approved spec and plan documents.
- The second command has no output, proving email provider, Turnstile verification, API delivery flow, and deployment configuration were not changed.

- [ ] **Step 6: Commit browser and build verification updates**

```bash
git add tests/e2e/intake.spec.ts scripts/verify-build-output.mjs
git commit -m "test: verify five-step intake flow"
```

- [ ] **Step 7: Re-run the complete verification after the final commit**

Run:

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
- [ ] No budget/timing/readiness/launch/approval control exists in rendered markup.
- [ ] Review contains Business, Project, Needs, Materials, and Contact only.
- [ ] Owner and client emails contain no removed data.
- [ ] Client and server validation feedback route Contact and Consent to step `4`.
- [ ] Turnstile, Resend, API delivery, environment variables, and schema version remain unchanged.
- [ ] Full verification passes after the final commit.
