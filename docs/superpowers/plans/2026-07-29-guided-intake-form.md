# Guided Client Intake Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Start Your Project placeholder with a production-ready six-step client intake wizard that adapts to the selected project, restores unfinished drafts, validates in the browser and on the server, and emails organized summaries to Evan and the client.

**Architecture:** Keep Astro output static. Render semantic Astro form components, then progressively enhance them with one vanilla TypeScript controller. Put types, option labels, conditional rules, normalization, validation, reference generation, draft storage, email formatting, Turnstile verification, and Resend delivery in focused framework-independent modules shared by the browser and a Cloudflare Pages Function.

**Tech Stack:** Astro 7.0.9, TypeScript 5.9.3, Node 22.22.2, Cloudflare Pages Functions, Cloudflare Turnstile, Resend HTTP API, Vitest, Happy DOM, Playwright.

## Global Constraints

- Preserve the existing Warm Creative Workshop design system.
- Keep Astro `output: 'static'`; do not add an Astro server adapter.
- Use one primary project type plus optional add-ons.
- Do not generate or imply a price or quote.
- Do not add accounts, uploads, payments, scheduling, a portal, a dashboard, a database, or marketing enrollment.
- Save drafts only in the current browser under `calypso:intake:v1`; expire them after 30 days.
- Never store Turnstile tokens, honeypot values, secrets, email status, or completed submissions in browser storage.
- Send owner notifications to `calydigital@outlook.com`.
- Send a client copy and promise personal review within 2–3 business days.
- Validate all conditional requirements inside the Pages Function.
- Limit request bodies to 100 KB and escape all user content in HTML email.
- Preserve answers after validation, network, Turnstile, or email failures.
- Use native form controls, visible labels, fieldsets, legends, linked error summaries, and predictable focus.
- Verify 390px, 430px, and 1440px layouts with no horizontal overflow.
- Respect `prefers-reduced-motion`.
- Keep production submission disabled until sender identity, secrets, Turnstile, and controlled email delivery are verified.
- Automated tests must mock Turnstile and Resend and must never send real email.

---

### Task 1: Add test and Cloudflare tooling

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Modify: `.gitignore`
- Modify: `.github/workflows/validate.yml`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `wrangler.toml`
- Create: `.env.example`

**Interfaces:**
- Produces: `npm run test:unit`, `npm run test:e2e`, `npm run dev:pages`.
- Consumes: existing Astro build and validation commands.

- [ ] **Step 1: Install exact development dependencies**

```bash
npm install --save-exact --save-dev vitest happy-dom @playwright/test wrangler @cloudflare/workers-types
```

- [ ] **Step 2: Add scripts**

Keep the current scripts and change/add:

```json
{
  "dev:pages": "npm run build && wrangler pages dev dist",
  "test": "npm run test:unit",
  "test:unit": "vitest run",
  "test:unit:watch": "vitest",
  "test:e2e": "PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build && playwright test"
}
```

- [ ] **Step 3: Create Vitest configuration**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/intake/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    passWithNoTests: true
  }
});
```

- [ ] **Step 4: Create Playwright configuration**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'mobile-390', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } } },
    { name: 'mobile-430', use: { ...devices['iPhone 14 Pro Max'], viewport: { width: 430, height: 932 } } },
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } }
  ]
});
```

- [ ] **Step 5: Add Cloudflare configuration and safe environment template**

```toml
# wrangler.toml
name = "calypso-digital-studio"
compatibility_date = "2026-07-29"
pages_build_output_dir = "./dist"
```

```dotenv
# .env.example
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
RESEND_API_KEY=
INTAKE_FROM_EMAIL=
INTAKE_TO_EMAIL=calydigital@outlook.com
INTAKE_ALLOWED_ORIGINS=http://localhost:8788
```

Add `@cloudflare/workers-types` to `compilerOptions.types`. Add `playwright-report/`, `test-results/`, `.wrangler/`, `.dev.vars`, and `coverage/` to `.gitignore`.

- [ ] **Step 6: Extend CI**

After `npm ci`, run unit tests before the existing checks. After build verification, run:

```yaml
      - run: npx playwright install chromium --with-deps
      - run: npx playwright test --project=mobile-390 --project=desktop-1440
```

- [ ] **Step 7: Verify and commit**

```bash
npm run test:unit
npm run check
npm run build
git add package.json package-lock.json tsconfig.json .gitignore .github/workflows/validate.yml vitest.config.ts playwright.config.ts wrangler.toml .env.example
git commit -m "test: add intake form tooling"
```

---

### Task 2: Define the intake model and option data

**Files:**
- Modify: `src/data/intake.ts`
- Create: `src/lib/intake/types.ts`
- Create: `src/lib/intake/reference.ts`
- Create: `tests/intake/fixtures.ts`
- Create: `tests/intake/reference.test.ts`

**Interfaces:**
- Produces: `IntakeAnswers`, `IntakeDraft`, `IntakeSubmissionRequest`, `NormalizedIntake`, `ValidationIssue`, `createSubmissionReference()`.
- Consumes: approved field and option matrix in `docs/superpowers/specs/2026-07-29-guided-intake-form-design.md`.

- [ ] **Step 1: Write reference tests**

```ts
// tests/intake/reference.test.ts
import { expect, test } from 'vitest';
import { createSubmissionReference } from '../../src/lib/intake/reference';

test('creates a stable public reference from a UUID', () => {
  expect(createSubmissionReference('11111111-2222-4333-8444-555555555555'))
    .toBe('CDS-1111111122');
});

test('rejects malformed UUIDs', () => {
  expect(() => createSubmissionReference('bad')).toThrow('Invalid submission UUID');
});
```

Run and confirm failure.

- [ ] **Step 2: Create exact shared types**

Create `src/lib/intake/types.ts` with:
- `PrimaryProjectType`: `new-website | website-redesign | online-store | custom-tool | ongoing-support | not-sure`;
- `AddOn`: `booking | online-payments | product-sales | custom-forms | gallery | testimonials | email-signup | blog | maintenance | seo-setup | analytics | business-email | other`;
- `ContactMethod`: `email | phone | text | instagram | facebook`;
- answer objects named `business`, `project`, `needs`, `materials`, `budgetAndTiming`, `contact`, and `consent`;
- every field and limit from design sections 6–11;
- `IntakeDraft` with version `1`, UUID, timestamps, current step, and answers;
- `IntakeSubmissionRequest` with draft fields plus `turnstileToken` and `honeypot`;
- `NormalizedIntake` without Turnstile/honeypot and with `reference`;
- discriminated `ValidationResult`.

The exact top-level shape must be:

```ts
export interface IntakeSubmissionRequest {
  version: 1;
  submissionId: string;
  startedAt: string;
  answers: IntakeAnswers;
  turnstileToken: string;
  honeypot: string;
}
```

- [ ] **Step 3: Replace placeholder data**

Rewrite `src/data/intake.ts` to export:
- six wizard steps;
- six primary types with labels/descriptions;
- 13 add-ons;
- all goals, pages, features, materials, visual words, budget sets, timing, readiness, decision-maker, store, support, booking, payment, and contact options from the approved spec;
- stable machine values separate from customer-facing labels.

Do not leave the old `projectTypes` tuple or “future form” language.

- [ ] **Step 4: Implement stable references**

```ts
// src/lib/intake/reference.ts
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createSubmissionReference(submissionId: string): string {
  if (!UUID_PATTERN.test(submissionId)) throw new Error('Invalid submission UUID');
  return `CDS-${submissionId.replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}
```

- [ ] **Step 5: Create a complete valid website fixture**

`tests/intake/fixtures.ts` must return one full `IntakeSubmissionRequest` with every property populated by a valid value or the correct empty value. Use UUID `11111111-2222-4333-8444-555555555555`, business `Example Studio`, email `jordan@example.com`, primary type `new-website`, add-ons `gallery` and `custom-forms`, budget `1000-2500`, and email contact.

- [ ] **Step 6: Verify and commit**

```bash
npm run test:unit -- tests/intake/reference.test.ts
npm run check
git add src/data/intake.ts src/lib/intake/types.ts src/lib/intake/reference.ts tests/intake/fixtures.ts tests/intake/reference.test.ts
git commit -m "feat: define intake submission model"
```

---

### Task 3: Implement conditions, validation, and normalization

**Files:**
- Create: `src/lib/intake/conditions.ts`
- Create: `src/lib/intake/schema.ts`
- Create: `tests/intake/conditions.test.ts`
- Create: `tests/intake/schema.test.ts`

**Interfaces:**
- Produces: `deriveConditions()`, `requiredPathsFor()`, `clearIrrelevantNeeds()`, `validateAndNormalizeIntake()`, `MAX_REQUEST_BYTES`.
- Consumes: shared types and option allowlists.

- [ ] **Step 1: Write condition tests**

Cover:
- store fields for Online Store or Product Sales;
- redesign only for Website Redesign;
- custom tool only for Custom Digital Tool;
- support only for Ongoing Support;
- booking/custom forms/maintenance add-on branches;
- phone required for phone/text;
- social account required for Instagram/Facebook when no earlier link exists;
- fixed launch date requirement;
- Other explanation requirement;
- clearing hidden branch values after a primary/add-on change.

- [ ] **Step 2: Implement one conditions source of truth**

```ts
export interface IntakeConditions {
  showStandardWebsite: boolean;
  showRedesign: boolean;
  showStore: boolean;
  showCustomTool: boolean;
  showSupport: boolean;
  showNotSure: boolean;
  showBooking: boolean;
  showStandalonePayments: boolean;
  showCustomForms: boolean;
  showMaintenance: boolean;
  requirePhone: boolean;
  requireSocialContact: boolean;
  requireLaunchDate: boolean;
  requireOtherAddOn: boolean;
}
```

`deriveConditions(answers)` must calculate all booleans. `requiredPathsFor(answers)` must return exact field paths. `clearIrrelevantNeeds(answers)` must clone `needs` and reset every inactive branch field to its empty value.

- [ ] **Step 3: Write schema tests**

Test:
- valid website, redesign, store, custom-tool, support, and not-sure submissions;
- required business/contact/consent fields;
- conditional required fields;
- malformed email, phone, URL, date, UUID;
- unknown object keys and allowlist values;
- duplicate array cleanup;
- URL normalization from `example.com` to `https://example.com`;
- removal of hidden branch data;
- every exact length limit;
- 100 KB constant;
- output reference.

- [ ] **Step 4: Implement schema**

```ts
export const MAX_REQUEST_BYTES = 100 * 1024;

export function validateAndNormalizeIntake(input: unknown): ValidationResult {
  // Reject non-object input and unknown keys.
  // Validate envelope and each answer section.
  // Apply requiredPathsFor() and active-branch validators.
  // Trim strings, deduplicate arrays, normalize HTTP(S) URLs.
  // Replace inactive needs with clearIrrelevantNeeds().
  // Return NormalizedIntake with createSubmissionReference().
}
```

Implement these exact limits:
- name/business/location/platform: 120;
- email: 254;
- phone input: 32 and 7–15 digits after punctuation removal;
- URL: 500, HTTP/HTTPS only;
- social links: 5;
- liked/disliked sites: 3 each;
- custom visual word: 80;
- short Other values: 500;
- standard text areas: 2,000;
- detailed custom-tool fields: 3,000.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:unit -- tests/intake/conditions.test.ts tests/intake/schema.test.ts
npm run check
git add src/lib/intake/conditions.ts src/lib/intake/schema.ts tests/intake/conditions.test.ts tests/intake/schema.test.ts
git commit -m "feat: validate conditional intake data"
```

---

### Task 4: Implement 30-day local draft recovery

**Files:**
- Create: `src/lib/intake/storage.ts`
- Create: `tests/intake/storage.test.ts`

**Interfaces:**
- Produces: `createEmptyAnswers()`, `createEmptyDraft()`, `saveDraft()`, `loadDraft()`, `clearDraft()`, `DRAFT_KEY`, `DRAFT_TTL_MS`.
- Consumes: `IntakeAnswers`, `IntakeDraft`.

- [ ] **Step 1: Write Happy DOM tests**

Test:
- empty draft has version 1, UUID, timestamps, step 0, and every answer key;
- successful round trip;
- 500 ms saving is controller behavior, not storage behavior;
- expiration after 30 days from `updatedAt`;
- malformed JSON and wrong versions are deleted;
- blocked storage returns false and never throws;
- clear removes the key.

- [ ] **Step 2: Implement storage**

```ts
export const DRAFT_KEY = 'calypso:intake:v1';
export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function createEmptyDraft(now = new Date()): IntakeDraft {
  const timestamp = now.toISOString();
  return {
    version: 1,
    submissionId: crypto.randomUUID(),
    startedAt: timestamp,
    updatedAt: timestamp,
    currentStep: 0,
    answers: createEmptyAnswers()
  };
}
```

`loadDraft()` must parse safely, validate a lightweight draft shape, delete wrong/expired data, and never return arbitrary JSON cast as `IntakeDraft`. `saveDraft()` returns a boolean so the UI only claims “Saved on this device” after a successful write.

- [ ] **Step 3: Verify and commit**

```bash
npm run test:unit -- tests/intake/storage.test.ts
npm run check
git add src/lib/intake/storage.ts tests/intake/storage.test.ts
git commit -m "feat: add intake draft recovery"
```

---

### Task 5: Format emails and implement external-service adapters

**Files:**
- Create: `src/lib/intake/email.ts`
- Create: `src/lib/intake/resend.ts`
- Create: `src/lib/intake/turnstile.ts`
- Create: `tests/intake/email.test.ts`
- Create: `tests/intake/resend.test.ts`
- Create: `tests/intake/turnstile.test.ts`

**Interfaces:**
- Produces: `formatOwnerEmail()`, `formatClientEmail()`, `sendResendEmail()`, `verifyTurnstile()`.
- Consumes: normalized intake and shared labels.

- [ ] **Step 1: Write email tests**

Assert:
- owner subject: `New project inquiry — Example Studio — New business website — CDS-1111111122`;
- owner Reply-To is client email;
- both HTML and text include all six review sections;
- hidden branches are absent;
- HTML escapes `& < > " '`;
- client subject includes reference;
- client copy says 2–3 business days, no quote generated, and no purchase commitment.

- [ ] **Step 2: Implement email formatting**

```ts
export interface EmailContent {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
}
```

Use one `buildSummarySections()` function for owner email, client email, and browser review labels. Render user values through `textContent` in the browser and `escapeHtml()` in email. Do not use a client-controlled subject, recipient, or sender.

- [ ] **Step 3: Write and implement Resend tests**

Use injected `fetch`. Require:
- `POST https://api.resend.com/emails`;
- bearer authorization;
- JSON body with `from`, `to`, `subject`, `html`, `text`, `reply_to`;
- `Idempotency-Key`;
- safe result union that never returns provider body text.

```ts
export type ResendResult =
  | { ok: true; emailId: string }
  | { ok: false; code: 'email_provider_rejected' | 'email_provider_unavailable' };
```

- [ ] **Step 4: Write and implement Turnstile tests**

Use injected `fetch`. Require:
- token length 1–2048;
- POST to Siteverify;
- secret/token/remote IP;
- `success === true`;
- exact allowed hostname;
- exact action `project-intake`;
- safe `verification_failed` or `verification_unavailable` result.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:unit -- tests/intake/email.test.ts tests/intake/resend.test.ts tests/intake/turnstile.test.ts
npm run check
git add src/lib/intake/email.ts src/lib/intake/resend.ts src/lib/intake/turnstile.ts tests/intake/email.test.ts tests/intake/resend.test.ts tests/intake/turnstile.test.ts
git commit -m "feat: add intake email and verification services"
```

---

### Task 6: Implement the Cloudflare Pages Function

**Files:**
- Create: `functions/api/intake.ts`
- Create: `tests/intake/function.test.ts`

**Interfaces:**
- Produces: `POST /api/intake`.
- Consumes: schema, Turnstile, email formatting, Resend.

- [ ] **Step 1: Write endpoint tests**

Mock global fetch and cover:
- accepted owner and client delivery;
- wrong content type 415;
- content-length/body over 100 KB 413;
- disallowed origin 403;
- invalid JSON 400;
- filled honeypot returns generic success and sends no email;
- invalid schema 400 with field issues;
- Turnstile failed 400;
- Turnstile unavailable 503;
- owner email failed 503 and client email not attempted;
- owner accepted/client failed returns 200 with `confirmationEmailSent: false`;
- retries use `intake-owner/{uuid}` and `intake-client/{uuid}`.

- [ ] **Step 2: Implement environment and response contracts**

```ts
interface Env {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  INTAKE_FROM_EMAIL: string;
  INTAKE_TO_EMAIL: string;
  INTAKE_ALLOWED_ORIGINS: string;
}
```

Success:

```json
{ "ok": true, "reference": "CDS-1111111122", "confirmationEmailSent": true }
```

Failure:

```json
{ "ok": false, "code": "validation_failed", "issues": [] }
```

Always send `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-store`.

- [ ] **Step 3: Implement request order**

1. content type;
2. content-length and actual byte limit;
3. exact origin allowlist;
4. JSON parse;
5. honeypot;
6. schema/conditional validation;
7. server-side Turnstile;
8. owner email with `intake-owner/{uuid}`;
9. client email with `intake-client/{uuid}`;
10. safe response.

Use `CF-Connecting-IP`. Derive allowed hostnames from allowed origins. Never log request bodies, secrets, complete email payloads, or provider bodies.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:unit -- tests/intake/function.test.ts
npm run check
git add functions/api/intake.ts tests/intake/function.test.ts
git commit -m "feat: add secure intake endpoint"
```

---

### Task 7: Replace the placeholder with semantic six-step markup

**Files:**
- Modify: `src/pages/start.astro`
- Create: `src/components/intake/IntakeWizard.astro`
- Create: `src/components/intake/WizardProgress.astro`
- Create: `src/components/intake/WizardNavigation.astro`
- Create: `src/components/intake/RestoreDraftNotice.astro`
- Create: `src/components/intake/ErrorSummary.astro`
- Create: `src/components/intake/ReviewSummary.astro`
- Create: `src/components/intake/SubmissionConfirmation.astro`
- Create: `src/components/intake/steps/BusinessStep.astro`
- Create: `src/components/intake/steps/ProjectStep.astro`
- Create: `src/components/intake/steps/NeedsStep.astro`
- Create: `src/components/intake/steps/MaterialsStep.astro`
- Create: `src/components/intake/steps/BudgetStep.astro`
- Create: `src/components/intake/steps/ReviewStep.astro`

**Interfaces:**
- Produces: complete accessible HTML and stable `data-*` hooks.
- Consumes: option data and public Turnstile site key.

- [ ] **Step 1: Rewrite Start page**

Remove the six cards and all “will cover”/“until activated” language. State:
- 5–10 minutes;
- no technical knowledge;
- no generated price;
- no purchase commitment;
- no files yet;
- 30-day same-device save;
- 2–3 business-day personal review.

Keep email, Instagram, and Facebook as a compact fallback.

- [ ] **Step 2: Build wizard shell**

`IntakeWizard.astro` must contain:
- Start Your Project button;
- restore notice with Continue Saved Project and confirmed Start Over;
- six-step progress;
- `<form novalidate data-intake-form>`;
- build-time `data-turnstile-site-key`;
- `data-submission-enabled="false"` when the public key is missing;
- all six step components;
- navigation;
- success component;
- no-JavaScript fallback listing what to email.

- [ ] **Step 3: Build exact field markup**

Use the approved spec as the authoritative field matrix. Field `name` values must match `IntakeAnswers` paths exactly. Required examples:
- `business.fullName`, `business.businessName`, `business.email`, `business.phone`;
- `project.primaryType`, `project.addOns`, `project.otherAddOn`;
- every `needs.*` shared, primary-path, and add-on field;
- every `materials.*`;
- every `budgetAndTiming.*`;
- every `contact.*`;
- `consent.accurate`, `consent.contactPermission`;
- off-screen `honeypot`.

Every field has a visible label, help/error IDs, `aria-describedby`, maxlength, and stable ID. Groups use fieldset/legend. Conditional wrappers use:
`standard-website`, `redesign`, `store`, `custom-tool`, `support`, `not-sure`, `booking`, `standalone-payments`, `custom-forms`, `maintenance`, `other-add-on`.

- [ ] **Step 4: Build progress, review, and success markup**

Progress:
- screen-reader `Step X of 6: Name`;
- desktop six-step list;
- future step buttons disabled.

Review:
- Business, Project, Needs, Materials, Budget, Contact;
- Edit buttons with step index;
- no user content pre-rendered as HTML.

Success:
- reference;
- client email;
- 2–3 business days;
- no price/commitment;
- alternate email-copy failure text;
- new-request action.

- [ ] **Step 5: Verify and commit**

```bash
npm run check
npm run build
grep -R "Until the guided form is activated\|What the full guided form will cover" dist/start && exit 1 || true
git add src/pages/start.astro src/components/intake
git commit -m "feat: build complete intake form markup"
```

---

### Task 8: Implement wizard state, conditions, navigation, and draft restoration

**Files:**
- Create: `src/scripts/intake-wizard.ts`
- Create: `tests/intake/wizard.test.ts`
- Modify: `src/components/intake/IntakeWizard.astro`

**Interfaces:**
- Produces: `initializeIntakeWizard(root)`.
- Consumes: storage, conditions, schema, option labels.

- [ ] **Step 1: Write Happy DOM controller tests**

Cover:
- Start button creates a draft;
- restore notice appears only for valid draft;
- Start Over confirmation;
- 500 ms debounced save and immediate navigation save;
- “Saved on this device” only after successful write;
- required step errors and focus;
- Back/Continue;
- completed-step progress;
- URL hashes `#business`, `#project`, `#needs`, `#materials`, `#budget`, `#review`;
- Back/Forward only to current/completed steps;
- future hash redirects to first incomplete step;
- conditional sections and required rules;
- primary-type destructive-change confirmation;
- add-on removal clears only exclusive values;
- Materials `none` exclusivity;
- three-word visual limit;
- review Edit actions;
- review rendering uses text nodes, not `innerHTML`.

- [ ] **Step 2: Implement controller state**

Export and auto-initialize:

```ts
export function initializeIntakeWizard(root: HTMLElement): void {
  // Bind start/restore/navigation/form events.
  // Maintain one IntakeDraft in memory.
  // Collect and apply answers by exact field paths.
  // Save after 500 ms and immediately on navigation.
  // Never persist Turnstile/honeypot.
}
```

- [ ] **Step 3: Implement validation and focus**

`validateStep(stepIndex, draft)` uses the same required paths/limits as schema but reports only current-step issues. On failure:
- set `aria-invalid`;
- render linked summary;
- preserve values;
- focus summary.

On navigation:
- focus step heading;
- update progress, hash, hidden state;
- prevent future incomplete navigation.

- [ ] **Step 4: Implement conditions and review**

All visibility comes from `deriveConditions()`. On accepted project changes, call `clearIrrelevantNeeds()`. Review values must be inserted with DOM `textContent`; omit empty and inactive values; map machine values through shared labels.

- [ ] **Step 5: Bundle and verify**

Add to `IntakeWizard.astro`:

```astro
<script>
  import '../../scripts/intake-wizard';
</script>
```

Run:

```bash
npm run test:unit -- tests/intake/wizard.test.ts
npm run check
git add src/scripts/intake-wizard.ts src/components/intake/IntakeWizard.astro tests/intake/wizard.test.ts
git commit -m "feat: add guided intake behavior"
```

---

### Task 9: Add Turnstile rendering, submission, retry, and success

**Files:**
- Modify: `src/scripts/intake-wizard.ts`
- Modify: `tests/intake/wizard.test.ts`

**Interfaces:**
- Produces: lazy Turnstile, `POST /api/intake`, safe error mapping, confirmation.
- Consumes: current draft and public site key.

- [ ] **Step 1: Add browser submission tests**

Cover:
- disabled submission without site key;
- script loads only on Review;
- action `project-intake`;
- expired/error callback clears token;
- all-step validation before POST;
- one active request despite double click;
- 20-second AbortController timeout;
- network/verification/owner failures retain draft and answers;
- verification failure resets widget;
- success clears draft and shows reference;
- client-copy partial failure still confirms receipt;
- New Request creates new UUID and empty state.

- [ ] **Step 2: Implement typed lazy Turnstile**

Load:
`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`

Use explicit rendering with site key, action, success, expired, and error callbacks. Do not store the token. Remove the widget after success.

- [ ] **Step 3: Implement submission**

1. validate all steps;
2. require fresh token;
3. disable Submit and set busy state;
4. build `IntakeSubmissionRequest`;
5. POST JSON to `/api/intake`;
6. map safe codes to approved messages;
7. preserve state on failure;
8. clear draft only after `{ ok: true }`;
9. show success and focus heading.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:unit -- tests/intake/wizard.test.ts
npm run check
git add src/scripts/intake-wizard.ts tests/intake/wizard.test.ts
git commit -m "feat: submit guided project requests"
```

---

### Task 10: Apply responsive and accessible styling

**Files:**
- Modify: `src/pages/start.astro`
- Modify: all `src/components/intake/*.astro`
- Modify: all `src/components/intake/steps/*.astro`

**Interfaces:**
- Produces: Warm Creative Workshop form at 390px, 430px, 1440px.
- Consumes: existing CSS tokens and focus rules.

- [ ] **Step 1: Style mobile-first layout**

- readable centered form, maximum about 52rem;
- one field group per row;
- full-width inputs/actions;
- compact progress;
- stacked review cards;
- safe wrapping for long URLs/email;
- no horizontal scrolling.

- [ ] **Step 2: Style desktop layout**

- all six step names visible;
- related short fields may share a row;
- review may use two columns without changing reading order;
- fields never span the full viewport.

- [ ] **Step 3: Style controls and errors**

Use native inputs. Selected cards must differ by border/surface/text, not color alone. Keep visible focus, comfortable touch targets, linked error summary, direct field errors, readable disabled/loading states, and sticky mobile navigation only when it cannot cover content.

- [ ] **Step 4: Add reduced motion**

```css
@media (prefers-reduced-motion: reduce) {
  .intake-wizard * {
    scroll-behavior: auto;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Manual check and commit**

Inspect 390px, 430px, 1440px; keyboard focus; long content; Turnstile fit; sticky controls.

```bash
git add src/pages/start.astro src/components/intake
git commit -m "style: polish guided intake form"
```

---

### Task 11: Add end-to-end coverage and build regression checks

**Files:**
- Create: `tests/e2e/intake.spec.ts`
- Modify: `scripts/verify-build-output.mjs`

**Interfaces:**
- Produces: browser flow coverage and placeholder regression guard.
- Consumes: built static site and mocked `/api/intake`.

- [ ] **Step 1: Add Playwright helpers**

Use visible roles/labels. Add helpers to complete each step, mock `window.turnstile`, and intercept `/api/intake`.

- [ ] **Step 2: Test core flow at all three viewport projects**

Cover:
- introduction and Start;
- six steps;
- required errors;
- Back/Continue;
- review Edit;
- success;
- 2–3 business days;
- no horizontal overflow.

- [ ] **Step 3: Test every primary path and add-on branch**

Table-test six primary types. Separately test Product Sales, Online Payments, Booking, Custom Forms, and Maintenance combinations and clearing behavior.

- [ ] **Step 4: Test persistence and failure recovery**

Cover refresh/return restoration, Start Over, network failure, Turnstile failure, owner failure, client-copy partial failure, and new request.

- [ ] **Step 5: Strengthen build verification**

Require `data-intake-form`, six step names, and business email in `dist/start/index.html`. Reject both old placeholder phrases.

- [ ] **Step 6: Verify and commit**

```bash
npm run test:e2e
npm run verify:build
git add tests/e2e/intake.spec.ts scripts/verify-build-output.mjs
git commit -m "test: cover guided intake flows"
```

---

### Task 12: Document production activation and perform final acceptance

**Files:**
- Create: `docs/deployment/intake-form.md`
- Review: all changed files

**Interfaces:**
- Produces: deployment checklist and verified implementation.
- Consumes: all prior tasks.

- [ ] **Step 1: Write deployment guide**

Document:
1. verify a Calypso-controlled sending domain in Resend;
2. use that domain for `INTAKE_FROM_EMAIL`;
3. keep `calydigital@outlook.com` as recipient/reply contact;
4. create a restricted sending key;
5. create Turnstile widget for exact production hostname;
6. add all six environment bindings;
7. use Cloudflare test keys only in development/tests;
8. submit one controlled production test;
9. verify owner email, Reply-To, client copy, reference, failure recovery, and idempotent retry;
10. keep submission disabled until all checks pass;
11. rotate keys by deploying replacement before revoking old key.

- [ ] **Step 2: Run complete suite**

```bash
npm ci
npm run test:unit
npm run verify:assets
npm run verify:content
npm run check
npm run build
npm run verify:build
npx playwright install chromium --with-deps
npx playwright test
```

Expected: every command exits 0.

- [ ] **Step 3: Scan for old copy and secrets**

```bash
grep -RInE 'Until the guided form is activated|What the full guided form will cover|re_[A-Za-z0-9]{20,}|TURNSTILE_SECRET_KEY=[^[:space:]]' src functions public docs .github package.json
```

Expected: no old placeholder copy, API key, or populated secret.

- [ ] **Step 4: Perform acceptance checks**

Confirm:
- keyboard-only completion;
- linked error summaries;
- hidden fields not focusable;
- reduced motion;
- 390px, 430px, 1440px screenshots;
- no horizontal overflow;
- all six primary paths;
- all active add-on paths;
- no data loss on failures;
- no pricing, uploads, accounts, payments, scheduling, database, marketing enrollment, political material, invented results, or guarantees.

- [ ] **Step 5: Commit documentation and any verified corrections**

```bash
git add docs/deployment/intake-form.md
git add -- $(git diff --name-only)
git commit -m "docs: complete intake deployment plan"
```

Skip the second `git add` when verification made no corrections. The pull request must state that production submission remains disabled until the controlled Turnstile and email test succeeds.
