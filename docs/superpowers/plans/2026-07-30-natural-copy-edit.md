# Natural Copy Editing Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all customer-facing website, intake, confirmation, and email copy sound professional, natural, and direct without changing services, facts, layout, or behavior.

**Architecture:** Keep copy in its existing page, component, data, content, and email modules. Add a small reusable copy-quality checker that scans built HTML and JavaScript for prohibited punctuation and retired phrases, while focused Vitest and Playwright assertions protect the approved wording and studio voice.

**Tech Stack:** Astro 7, TypeScript 5.9, Vitest 4, Node.js test runner, Playwright 1.62, GitHub Actions.

## Global Constraints

- This is a light consistency edit, not a full rewrite.
- Public business copy must use “Calypso Digital Studio” or “the studio.” It must not use “we.”
- Evan’s personal biography on the About page must remain in first person.
- Use professional, natural, direct sentences with limited marketing language.
- Remove unnecessary em dashes and slash-heavy shorthand from customer-facing prose.
- Preserve grammatically necessary compounds such as `one-time`, `follow-up`, `small-business` when adjectival, and `purpose-built`.
- Preserve existing services, facts, calls to action, response expectations, reference behavior, and submission behavior.
- Do not change the intake data model, validation rules, Turnstile, Resend, API delivery, Cloudflare configuration, or deployment configuration.
- Do not change visual layout or styling unless revised copy causes a demonstrated spacing defect.
- Use Node.js `>=22.12.0 <23`, matching `package.json`.

---

## File Structure

### New files

- `scripts/copy-quality.mjs`: Pure copy-rule definitions and violation detection.
- `scripts/copy-quality.test.mjs`: Node test coverage for the copy-rule helper.
- `scripts/verify-copy-output.mjs`: Recursively scans built customer-facing HTML and JavaScript.
- `tests/copy/public-copy.test.ts`: Source-level regression tests for marketing and studio voice.

### Existing files to modify

- `package.json`: Add `verify:copy`.
- `.github/workflows/validate.yml`: Run the built-output copy check after `npm run build`.
- `src/pages/index.astro`: Light edit of home-page marketing copy.
- `src/pages/about.astro`: Light edit while preserving Evan’s biography in first person.
- `src/pages/services.astro`: Remove first-person recommendation wording.
- `src/pages/process.astro`: Simplify process-page language.
- `src/pages/work.astro`: Simplify portfolio introduction.
- `src/pages/start.astro`: Replace the em-dash heading and first-person framing.
- `src/data/services.ts`: Simplify service summaries without changing offerings.
- `src/data/process.ts`: Replace mixed `I` and `we` voice with studio-neutral descriptions.
- `src/content/projects/lrl-photography.md`: Light project-summary edit.
- `src/content/projects/rare-treats-518.md`: Light project-summary edit.
- `src/content/projects/good-intentions.md`: Light project-summary and focus-label edit.
- `src/components/intake/IntakeWizard.astro`: Edit welcome and fallback copy.
- `src/components/intake/steps/BusinessStep.astro`: Replace first-person heading and helper text.
- `src/components/intake/steps/ProjectStep.astro`: Simplify project-selection instructions.
- `src/components/intake/steps/NeedsStep.astro`: Replace formal introductory wording.
- `src/components/intake/steps/MaterialsStep.astro`: Replace first-person review wording.
- `src/components/intake/steps/ReviewStep.astro`: Replace first-person heading, response promise, and label.
- `src/components/intake/SubmissionConfirmation.astro`: Use studio voice and natural number wording.
- `src/scripts/intake-wizard.ts`: Update dynamic confirmation and delivery messages only.
- `src/lib/intake/email.ts`: Update owner and client subjects and client confirmation copy.
- `tests/intake/markup.test.ts`: Assert approved intake wording and retired phrases.
- `tests/intake/email.test.ts`: Assert updated subjects, studio voice, and response wording.
- `tests/e2e/intake.spec.ts`: Update visible-copy expectations.

---

### Task 1: Add an automated copy-quality gate

**Files:**
- Create: `scripts/copy-quality.mjs`
- Create: `scripts/copy-quality.test.mjs`
- Create: `scripts/verify-copy-output.mjs`
- Modify: `package.json:11-24`
- Modify: `.github/workflows/validate.yml:23-29`

**Interfaces:**
- Consumes: UTF-8 strings from built `.html` and `.js` files.
- Produces: `findCopyViolations(text: string, source?: string): CopyViolation[]`, where each violation has `source`, `rule`, `match`, and `index`.
- Produces: `npm run verify:copy`, which exits nonzero when built customer-facing output contains a prohibited pattern.

- [ ] **Step 1: Write the failing helper tests**

Create `scripts/copy-quality.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { findCopyViolations } from './copy-quality.mjs';

test('finds prohibited customer-facing copy patterns', () => {
  const text = [
    'Tell me about the business—then choose website/app support.',
    'We clarify the project and I’ll personally respond.'
  ].join(' ');
  const violations = findCopyViolations(text, 'fixture.html');
  assert.deepEqual(
    violations.map((item) => item.rule),
    [
      'unnecessary em dash',
      'slash-heavy shorthand',
      'retired first-person studio wording',
      'plural studio voice'
    ]
  );
});

test('allows necessary compounds, URLs, and Evan first-person biography', () => {
  const text = [
    'Purpose-built software can support one-time work and follow-up requests.',
    'A small-business website can link to https://example.com/start.',
    'I’m Evan Lebrecht, the designer and developer behind Calypso Digital Studio.'
  ].join(' ');
  assert.deepEqual(findCopyViolations(text, 'allowed.html'), []);
});
```

- [ ] **Step 2: Run the helper tests and confirm they fail**

Run:

```bash
node --test scripts/copy-quality.test.mjs
```

Expected: FAIL because `scripts/copy-quality.mjs` does not exist.

- [ ] **Step 3: Implement the pure copy-rule helper**

Create `scripts/copy-quality.mjs`:

```js
export const copyRules = [
  { name: 'unnecessary em dash', pattern: /—/g },
  { name: 'slash-heavy shorthand', pattern: /\b(?:website\/app|email\/text|booking\/payments)\b/gi },
  {
    name: 'retired first-person studio wording',
    pattern: /\b(?:I’ll personally|I'll personally|Tell me about the business|choose how I should respond)\b/gi
  },
  { name: 'plural studio voice', pattern: /\bwe\b/gi }
];

export function findCopyViolations(text, source = 'unknown') {
  return copyRules.flatMap(({ name, pattern }) => {
    const matcher = new RegExp(pattern.source, pattern.flags);
    return [...text.matchAll(matcher)].map((match) => ({
      source,
      rule: name,
      match: match[0],
      index: match.index ?? -1
    }));
  });
}
```

- [ ] **Step 4: Run the helper tests and confirm they pass**

Run:

```bash
node --test scripts/copy-quality.test.mjs
```

Expected: 2 tests PASS.

- [ ] **Step 5: Add the built-output scanner**

Create `scripts/verify-copy-output.mjs`:

```js
import { readdir, readFile } from 'node:fs/promises';
import { extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCopyViolations } from './copy-quality.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const distRoot = fileURLToPath(new URL('../dist/', import.meta.url));
const scannedExtensions = new Set(['.html', '.js']);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if (scannedExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const files = await collectFiles(distRoot);
const violations = [];
for (const file of files) {
  const source = relative(projectRoot, file);
  const text = await readFile(file, 'utf8');
  violations.push(...findCopyViolations(text, source));
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`${violation.source}: ${violation.rule}: ${JSON.stringify(violation.match)}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Copy verification passed for ${files.length} built files.`);
}
```

- [ ] **Step 6: Wire the scanner into package scripts and CI**

Add this entry to `package.json` immediately after `verify:build` or alongside the other verification scripts:

```json
"verify:copy": "node scripts/verify-copy-output.mjs"
```

Add this workflow step after `npm run build` and before `npm run verify:build`:

```yaml
      - run: npm run verify:copy
```

- [ ] **Step 7: Run the full foundation test command**

Run:

```bash
npm run test:foundation
```

Expected: all Node foundation tests PASS.

- [ ] **Step 8: Commit the copy gate**

```bash
git add scripts/copy-quality.mjs scripts/copy-quality.test.mjs scripts/verify-copy-output.mjs package.json .github/workflows/validate.yml
git commit -m "test: add customer copy quality gate"
```

---

### Task 2: Edit marketing pages, service data, process data, and project summaries

**Files:**
- Create: `tests/copy/public-copy.test.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/services.astro`
- Modify: `src/pages/process.astro`
- Modify: `src/pages/work.astro`
- Modify: `src/pages/start.astro`
- Modify: `src/data/services.ts`
- Modify: `src/data/process.ts`
- Modify: `src/content/projects/lrl-photography.md`
- Modify: `src/content/projects/rare-treats-518.md`
- Modify: `src/content/projects/good-intentions.md`

**Interfaces:**
- Consumes: Existing Astro pages, service/process arrays, and project content collection fields.
- Produces: The same routes, content schemas, service entries, process steps, and project entries with revised prose only.

- [ ] **Step 1: Write the failing marketing-copy regression tests**

Create `tests/copy/public-copy.test.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

const root = new URL('../../', import.meta.url);

async function read(path: string): Promise<string> {
  return readFile(new URL(path, root), 'utf8');
}

const auditedPaths = [
  'src/pages/index.astro',
  'src/pages/about.astro',
  'src/pages/services.astro',
  'src/pages/process.astro',
  'src/pages/work.astro',
  'src/pages/start.astro',
  'src/data/services.ts',
  'src/data/process.ts',
  'src/content/projects/lrl-photography.md',
  'src/content/projects/rare-treats-518.md',
  'src/content/projects/good-intentions.md'
] as const;

test('public marketing copy avoids retired punctuation and studio voice', async () => {
  const combined = (await Promise.all(auditedPaths.map(read))).join('\n');
  expect(combined).not.toContain('—');
  expect(combined).not.toMatch(/\bWe\b/);
  expect(combined).not.toContain('I also build');
  expect(combined).not.toContain('I will recommend');
  expect(combined).not.toContain('Tell me what the business needs');
});

test('approved natural copy and Evan biography remain present', async () => {
  const home = await read('src/pages/index.astro');
  const about = await read('src/pages/about.astro');
  const process = await read('src/data/process.ts');
  const start = await read('src/pages/start.astro');

  expect(home).toContain('You can begin without planning every part of the website.');
  expect(about).toContain('I’m Evan Lebrecht, the designer and developer behind Calypso Digital Studio.');
  expect(process).toContain('A discovery conversation confirms the goals');
  expect(start).toContain('Describe what the business needs in your own words. Technical language is not required.');
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm run test:unit -- tests/copy/public-copy.test.ts
```

Expected: FAIL on the current em dashes, `I` or `we` studio wording, and missing replacement text.

- [ ] **Step 3: Apply the approved home-page copy**

In `src/pages/index.astro`, use these final customer-facing strings:

```text
Hero description:
Calypso Digital Studio designs custom websites and practical software for small businesses, independent professionals, and growing brands.

Beyond the website paragraph:
The studio also builds practical digital tools for booking, client intake, customer workflows, calculations, dashboards, and internal processes.

Process heading:
A clear process from the first inquiry through launch.

Intake heading:
You can begin without planning every part of the website.

Intake paragraph:
The guided project form organizes the business, goals, features, and available materials into clear steps.
```

Do not change component structure, links, image data, project ordering, classes, or styles.

- [ ] **Step 4: Apply the approved About-page copy**

In `src/pages/about.astro`, use these final strings:

```text
Page title:
The business comes first. The solution follows.

Page description:
Calypso Digital Studio combines thoughtful design, practical development, and direct communication throughout each project.

Story heading:
Practical problem-solving backed by hands-on experience.

Mindset heading:
The work should fit the business, not add features it will never use.

Mindset introduction:
Each project is considered in real use: what customers need to understand, what the owner needs to manage, where the current process causes problems, and what will remain practical after launch.

Business-first recommendations paragraph:
Recommendations come from the business goals, customer journey, and actual workflow. They are not based on trends, templates, or a platform the studio is trying to sell.

Clear accountability paragraph:
Scope, limitations, progress, and recommendations should remain clear throughout the project. That includes explaining when a feature is unnecessary.

Contact paragraph:
Email is the most direct way to begin. Current work is also shared through the studio’s social profiles.
```

Keep the personal biography paragraphs in first person, including:

```text
I’m Evan Lebrecht, the designer and developer behind Calypso Digital Studio.
```

- [ ] **Step 5: Apply the approved Services, Process, Work, and Start-page copy**

Use these exact strings:

`src/pages/services.astro`

```text
Page description:
Start with the customer experience, the current problem, and the result you need. The studio will help identify the right technical approach.

CTA paragraph:
Describe the business and the goal. Calypso Digital Studio will recommend the most practical option.
```

`src/pages/process.astro`

```text
Page title:
A clear process, especially for first-time web design clients.

Page description:
Each stage explains what happens next, what information is needed, and what is being reviewed.

CTA paragraph:
Project details give the studio enough context to prepare a recommendation before either side agrees to the work.
```

`src/pages/work.astro`

```text
Page title:
Three businesses with distinct needs, systems, and visual directions.

Page description:
Each project includes its current status and real interface captures.
```

`src/pages/start.astro`

```text
Page title:
Describe what the business needs in your own words. Technical language is not required.

Page description:
The guided form organizes the details needed to review the project and prepare a custom recommendation and quote.

Direct-contact heading:
The guided form provides the clearest information for an accurate review.

Direct-contact paragraph:
Email is available for accessibility issues, corrections, or projects that cannot be described through the form.
```

- [ ] **Step 6: Normalize process data to studio-neutral language**

Replace `src/data/process.ts` with the same eight entries and these descriptions:

```ts
export const processSteps = [
  ['Project inquiry', 'Share the business, the current problem, and the result you need.'],
  ['Discovery conversation', 'A discovery conversation confirms the goals, priorities, available content, project limits, and intended users.'],
  ['Proposal and scope', 'The proposal explains what will be built, what is included, each side’s responsibilities, and the project sequence.'],
  ['Design direction', 'The visual system and page structure are established before the full build expands.'],
  ['Development', 'The approved direction becomes a responsive and tested website or digital tool.'],
  ['Review and revisions', 'You review working previews and provide specific feedback before launch.'],
  ['Launch', 'The finished project is checked, published, and connected to its final services.'],
  ['Continued support', 'Updates and future improvements can continue after the initial launch.']
] as const;
```

- [ ] **Step 7: Lightly simplify service summaries**

Keep all five service titles and example arrays unchanged. Use these summaries in `src/data/services.ts`:

```text
Website design and development:
A custom website built around what customers need to understand and what the business needs to accomplish.

Website redesigns:
A clearer, faster, more professional replacement for a website that no longer represents the business.

E-commerce and online selling:
Planning and development for businesses that need to sell products, accept payments, arrange shipping, or prepare a controlled launch.

Custom business tools:
Purpose-built digital tools for repetitive processes, customer workflows, data organization, or internal operations.

Ongoing support:
Continued help after launch for updates, new pages, added features, and technical maintenance.
```

- [ ] **Step 8: Lightly edit project descriptions without changing status or claims**

Use these exact content changes:

`src/content/projects/lrl-photography.md`

```yaml
summary: A complete photography website where visitors can learn about the photographer, compare services, and book a session.
```

Keep the body sentence unchanged.

`src/content/projects/rare-treats-518.md`

```yaml
summary: A colorful small-business website for rotating treats, custom orders, and local market information, without forcing the business into a fixed catalog.
```

Keep `small-business` hyphenated because it modifies `website`. Keep the body sentence unchanged.

`src/content/projects/good-intentions.md`

```yaml
summary: An editorial storefront and service experience for a secondhand clothing business, with collection stories and clear customer steps.
```

Change the focus labels to:

```yaml
  - Style bundle process
  - Clothing donation workflow
```

Replace the body with:

```text
This project is still in progress. Draft inventory and inactive checkout are clearly identified rather than presented as live commerce.
```

- [ ] **Step 9: Run the focused copy test**

Run:

```bash
npm run test:unit -- tests/copy/public-copy.test.ts
```

Expected: PASS.

- [ ] **Step 10: Run content and type checks**

Run:

```bash
npm run verify:content
npm run check
```

Expected: both commands PASS with unchanged content schemas and Astro structure.

- [ ] **Step 11: Commit the marketing copy edit**

```bash
git add tests/copy/public-copy.test.ts src/pages/index.astro src/pages/about.astro src/pages/services.astro src/pages/process.astro src/pages/work.astro src/pages/start.astro src/data/services.ts src/data/process.ts src/content/projects/lrl-photography.md src/content/projects/rare-treats-518.md src/content/projects/good-intentions.md
git commit -m "copy: make studio marketing language more natural"
```

---

### Task 3: Edit intake, dynamic feedback, confirmation, and email copy

**Files:**
- Modify: `src/components/intake/IntakeWizard.astro`
- Modify: `src/components/intake/steps/BusinessStep.astro`
- Modify: `src/components/intake/steps/ProjectStep.astro`
- Modify: `src/components/intake/steps/NeedsStep.astro`
- Modify: `src/components/intake/steps/MaterialsStep.astro`
- Modify: `src/components/intake/steps/ReviewStep.astro`
- Modify: `src/components/intake/SubmissionConfirmation.astro`
- Modify: `src/scripts/intake-wizard.ts`
- Modify: `src/lib/intake/email.ts`
- Modify: `tests/intake/markup.test.ts`
- Modify: `tests/intake/email.test.ts`
- Modify: `tests/e2e/intake.spec.ts`

**Interfaces:**
- Consumes: Existing form field names, step indexes, conditions, submission request data, Turnstile state, and normalized intake summaries.
- Produces: Identical form behavior and email structure with revised visible strings only.
- Preserves: `IntakeSubmissionRequest`, `NormalizedIntake`, response codes, reference generation, validation paths, and all API behavior.

- [ ] **Step 1: Add failing static intake-copy assertions**

Add this test to `tests/intake/markup.test.ts`:

```ts
test('intake markup uses studio voice and natural punctuation', async () => {
  const paths = [
    'src/components/intake/IntakeWizard.astro',
    'src/components/intake/steps/BusinessStep.astro',
    'src/components/intake/steps/ProjectStep.astro',
    'src/components/intake/steps/NeedsStep.astro',
    'src/components/intake/steps/MaterialsStep.astro',
    'src/components/intake/steps/ReviewStep.astro',
    'src/components/intake/SubmissionConfirmation.astro'
  ];
  const markup = (await Promise.all(paths.map(read))).join('\n');

  expect(markup).not.toContain('—');
  expect(markup).not.toContain('I’ll personally');
  expect(markup).not.toContain('Tell me about the business');
  expect(markup).not.toContain('choose how I should respond');
  expect(markup).toContain('Calypso Digital Studio will review each request within two to three business days.');
  expect(markup).toContain('Review the request and choose a contact method.');
});
```

- [ ] **Step 2: Update email expectations before implementation**

In `tests/intake/email.test.ts`, replace the owner subject expectation with:

```ts
expect(email.subject).toBe('New project inquiry | Example Studio | New business website | CDS-1111111122');
```

Replace the client response-time assertion with:

```ts
expect(email.text).toContain('two to three business days');
```

Add these assertions to the client confirmation test:

```ts
expect(email.subject).toBe('Calypso Digital Studio received your project details | CDS-1111111122');
expect(email.text).toContain('Calypso Digital Studio received your project details');
expect(email.text).not.toContain('I received');
expect(email.text).not.toContain('We received');
expect(email.text).not.toContain('—');
```

- [ ] **Step 3: Update browser expectations before implementation**

In `tests/e2e/intake.spec.ts`:

```ts
await expect(page.locator('[data-confirmation-message]')).toContainText('two to three business days');
```

Replace the legacy-draft review heading expectation with:

```ts
await expect(page.getByRole('heading', { name: 'Review the request and choose a contact method.' })).toBeVisible();
```

Keep all field labels, route behavior, step counts, Turnstile behavior, and submission mocks unchanged.

- [ ] **Step 4: Run the focused tests and confirm they fail**

Run:

```bash
npm run test:unit -- tests/intake/markup.test.ts tests/intake/email.test.ts
```

Expected: FAIL on current first-person copy, em dashes, subjects, and response-time wording.

- [ ] **Step 5: Edit the intake welcome and JavaScript fallback**

In `src/components/intake/IntakeWizard.astro`, use:

```text
Welcome paragraph:
The form usually takes 5 to 10 minutes. Technical knowledge is not required. It does not generate a price or commit you to purchasing services.

Saved-progress item:
Your unfinished progress is saved on this device for 30 days.

Materials item:
No logo, photos, or documents need to be uploaded now.

Review item:
Calypso Digital Studio will review each request within two to three business days.

No-script paragraph:
Email calydigital@outlook.com. Include the business name, what you need, important features, available branding, and preferred contact method.
```

Keep the Turnstile key, form structure, imports, data attributes, and styles unchanged.

- [ ] **Step 6: Edit the five step introductions and contact label**

Use these exact strings:

`src/components/intake/steps/BusinessStep.astro`

```text
Heading:
Share the basics about the business.

Description:
Business details provide context for later recommendations about pages and features.
```

`src/components/intake/steps/ProjectStep.astro`

```text
Description:
Choose one main direction. Add any optional features that may also be needed.

Optional additions help:
Select anything that may be useful. The final scope will be recommended after review.
```

`src/components/intake/steps/NeedsStep.astro`

```text
Description:
Focus on what customers or staff should be able to do. The technical solution can be worked out later.
```

`src/components/intake/steps/MaterialsStep.astro`

```text
Description:
No files are needed yet. The studio will request relevant materials after reviewing the project.
```

`src/components/intake/steps/ReviewStep.astro`

```text
Heading:
Review the request and choose a contact method.

Description:
No price is generated here. Calypso Digital Studio will review the information and respond within two to three business days.

Additional-information label:
Anything else Calypso Digital Studio should know about the project?
```

Do not change field names, IDs, option values, required flags, consent text, conditions, or data attributes.

- [ ] **Step 7: Edit the submission confirmation**

In `src/components/intake/SubmissionConfirmation.astro`, use:

```text
Confirmation paragraph:
Calypso Digital Studio will review the information and respond within two to three business days. No price has been generated, and submitting this request does not commit you to purchasing services. A copy of the submission has been sent to your email.

Expected response:
Within two to three business days
```

Keep the heading, reference field, email field, correction email, and buttons unchanged.

- [ ] **Step 8: Edit dynamic client feedback without changing error codes**

In `src/scripts/intake-wizard.ts`, change only these customer-facing strings:

```text
delivery_unconfirmed:
Your answers are still saved, but delivery could not be confirmed. Try again in a moment or email calydigital@outlook.com.

Delayed confirmation-email message:
Your project was received, but the email copy could not be confirmed. Keep this reference number and email Calypso Digital Studio at calydigital@outlook.com if you need a copy.
```

Leave every error-code key, Turnstile diagnostic, timeout, save behavior, request payload, and state transition unchanged.

- [ ] **Step 9: Edit owner and client email wording**

In `src/lib/intake/email.ts`, use:

```ts
subject: `New project inquiry | ${intake.answers.business.businessName} | ${projectLabel} | ${intake.reference}`
```

For the client email, set:

```ts
const intro = 'Calypso Digital Studio received your project details and will review them within two to three business days. No quote has been generated. Submitting this request does not commit you to purchasing services.';
```

Use this client subject:

```ts
subject: `Calypso Digital Studio received your project details | ${intake.reference}`
```

Keep summary generation, HTML escaping, reply-to addresses, section order, and field labels unchanged.

- [ ] **Step 10: Run focused unit tests**

Run:

```bash
npm run test:unit -- tests/intake/markup.test.ts tests/intake/email.test.ts tests/intake/wizard.test.ts
```

Expected: all focused tests PASS.

- [ ] **Step 11: Run the focused browser suite**

Run:

```bash
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npx playwright test tests/e2e/intake.spec.ts --project=chromium
```

Expected: all intake browser tests PASS in Chromium.

- [ ] **Step 12: Commit the intake and email copy edit**

```bash
git add src/components/intake/IntakeWizard.astro src/components/intake/steps/BusinessStep.astro src/components/intake/steps/ProjectStep.astro src/components/intake/steps/NeedsStep.astro src/components/intake/steps/MaterialsStep.astro src/components/intake/steps/ReviewStep.astro src/components/intake/SubmissionConfirmation.astro src/scripts/intake-wizard.ts src/lib/intake/email.ts tests/intake/markup.test.ts tests/intake/email.test.ts tests/e2e/intake.spec.ts
git commit -m "copy: simplify intake and email language"
```

---

### Task 4: Run the complete verification and review the final copy diff

**Files:**
- Review: all files changed in Tasks 1 through 3
- No new production behavior is introduced in this task.

**Interfaces:**
- Consumes: The completed copy edit and copy-quality gate.
- Produces: Verification evidence that copy, rendering, submission behavior, and browser flows remain valid.

- [ ] **Step 1: Install exact dependencies**

Run:

```bash
npm ci
```

Expected: clean installation with Node 22 and no lockfile change.

- [ ] **Step 2: Run all unit and foundation tests**

Run:

```bash
npm test
```

Expected: all Node and Vitest tests PASS.

- [ ] **Step 3: Run asset, content, and type validation**

Run:

```bash
npm run verify:assets
npm run verify:content
npm run check
```

Expected: all three commands PASS.

- [ ] **Step 4: Build the production site**

Run:

```bash
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build
```

Expected: Astro production build completes successfully.

- [ ] **Step 5: Run built-output verification**

Run:

```bash
npm run verify:copy
npm run verify:build
```

Expected: both commands PASS. The copy check reports no em dashes, slash-heavy shorthand, retired first-person studio wording, or `we` voice in built HTML or JavaScript.

- [ ] **Step 6: Run the complete Chromium and WebKit browser suite**

Run:

```bash
npm run test:e2e
```

Expected: all Playwright tests PASS in Chromium and WebKit.

- [ ] **Step 7: Perform the final source audit**

Run:

```bash
git grep -n '—' -- src/pages src/components src/data src/content src/lib/intake/email.ts src/scripts/intake-wizard.ts || true
git grep -nE '\b(We|I’ll personally|Tell me about the business|choose how I should respond)\b' -- src/pages src/components src/data src/content src/lib/intake/email.ts src/scripts/intake-wizard.ts || true
git diff --check
git status --short
```

Expected:

- The em-dash search returns no customer-facing source matches.
- The retired studio-voice search returns no matches. User-perspective consent wording and Evan’s first-person About biography remain allowed.
- `git diff --check` prints nothing.
- `git status --short` shows only intentional changes, or is clean after commits.

- [ ] **Step 8: Review factual and behavioral boundaries**

Inspect the final diff and confirm:

```text
Services and project statuses are unchanged.
The response promise remains two to three business days.
No prices or new claims were introduced.
Every intake field name, option value, required flag, condition, and step index is unchanged.
Turnstile, Resend, API, Cloudflare, and deployment configuration are unchanged except for adding the validation workflow command.
No CSS or layout change was made without a demonstrated text-overflow reason.
Evan’s About biography remains in first person.
```

- [ ] **Step 9: Commit any verification-only assertion correction**

Only when a test expectation needed correction to match the already approved copy, commit it separately:

```bash
git add tests scripts package.json .github/workflows/validate.yml
git commit -m "test: finalize natural copy verification"
```

Do not create an empty commit when no correction was needed.
