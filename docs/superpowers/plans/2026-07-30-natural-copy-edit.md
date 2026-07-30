# Natural Copy Editing Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all customer-facing website, intake, confirmation, and email copy sound professional, natural, and direct without changing services, facts, layout, or behavior.

**Architecture:** Keep copy in its existing Astro pages, components, data modules, content entries, scripts, and email formatter. Add a small built-output checker for prohibited punctuation and retired phrases, plus focused source, email, and browser assertions for studio voice and approved wording.

**Tech Stack:** Astro 7, TypeScript 5.9, Vitest 4, Node.js test runner, Playwright 1.62, GitHub Actions.

## Global Constraints

- This is a light consistency edit, not a full rewrite.
- Public business copy must use “Calypso Digital Studio” or “the studio.” It must not use “we.”
- Evan’s personal biography on the About page must remain in first person.
- Use professional, natural, direct sentences with limited marketing language.
- Remove all em dashes and slash-heavy shorthand from customer-facing prose.
- Preserve necessary compounds such as `one-time`, `follow-up`, `purpose-built`, and `small-business` when adjectival.
- Preserve services, facts, calls to action, response expectations, project statuses, reference behavior, and submission behavior.
- Do not change the intake data model, field names, option values, validation rules, Turnstile, Resend, API delivery, Cloudflare configuration, or deployment configuration.
- Do not change visual layout or styling unless revised copy causes a demonstrated spacing defect.
- Use Node.js `>=22.12.0 <23`, matching `package.json`.

---

## File Map

### Create

- `scripts/copy-quality.mjs`: Pure prohibited-pattern detection.
- `scripts/copy-quality.test.mjs`: Node tests for the detector.
- `scripts/verify-copy-output.mjs`: Scans built `.html` and `.js` files.
- `tests/copy/public-copy.test.ts`: Audits public source copy and studio voice.

### Modify

- `package.json`
- `.github/workflows/validate.yml`
- `src/pages/index.astro`
- `src/pages/about.astro`
- `src/pages/services.astro`
- `src/pages/process.astro`
- `src/pages/work.astro`
- `src/pages/start.astro`
- `src/data/services.ts`
- `src/data/process.ts`
- `src/content/projects/lrl-photography.md`
- `src/content/projects/rare-treats-518.md`
- `src/content/projects/good-intentions.md`
- `src/components/intake/IntakeWizard.astro`
- `src/components/intake/steps/BusinessStep.astro`
- `src/components/intake/steps/ProjectStep.astro`
- `src/components/intake/steps/NeedsStep.astro`
- `src/components/intake/steps/MaterialsStep.astro`
- `src/components/intake/steps/ReviewStep.astro`
- `src/components/intake/SubmissionConfirmation.astro`
- `src/scripts/intake-wizard.ts`
- `src/lib/intake/email.ts`
- `tests/intake/markup.test.ts`
- `tests/intake/email.test.ts`
- `tests/e2e/intake.spec.ts`

### Audit without expected edits

These surfaces already appear direct, but they remain inside the source and built-output review:

- `src/components/SiteHeader.astro`
- `src/components/SiteFooter.astro`
- `src/components/ButtonLink.astro`
- `src/components/ProjectCard.astro`
- `src/components/intake/RestoreDraftNotice.astro`
- `src/components/intake/ErrorSummary.astro`
- `src/components/intake/WizardNavigation.astro`
- `src/components/intake/WizardProgress.astro`
- `src/data/navigation.ts`
- `src/lib/intake/schema.ts`
- `src/scripts/intake-server-validation-feedback.ts`
- `public/site.webmanifest`

---

### Task 1: Add the copy-quality gate

**Files:**
- Create: `scripts/copy-quality.mjs`
- Create: `scripts/copy-quality.test.mjs`
- Create: `scripts/verify-copy-output.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Produces `findCopyViolations(text: string, source?: string)` returning `{ source, rule, match, index }[]`.
- Produces `npm run verify:copy`, which scans built HTML and JavaScript and exits nonzero on a violation.

- [ ] **Step 1: Write the failing helper tests**

Create `scripts/copy-quality.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { findCopyViolations } from './copy-quality.mjs';

test('finds prohibited customer-facing copy patterns', () => {
  const text = 'Tell me about the business—then choose website/app support.';
  const violations = findCopyViolations(text, 'fixture.html');
  assert.deepEqual(
    violations.map((item) => item.rule),
    ['em dash', 'slash-heavy shorthand', 'retired studio wording']
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

- [ ] **Step 2: Run the test and verify the expected failure**

```bash
node --test scripts/copy-quality.test.mjs
```

Expected: FAIL because `scripts/copy-quality.mjs` does not exist.

- [ ] **Step 3: Implement the detector**

Create `scripts/copy-quality.mjs`:

```js
export const copyRules = [
  { name: 'em dash', pattern: /—/g },
  { name: 'slash-heavy shorthand', pattern: /\b(?:website\/app|email\/text|booking\/payments)\b/gi },
  {
    name: 'retired studio wording',
    pattern: /\b(?:I’ll personally|I'll personally|Tell me about the business|choose how I should respond|We clarify goals)\b/gi
  }
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

Do not scan minified JavaScript for the standalone word `we`; minifiers may generate that identifier. Source-level tests in Task 2 enforce the studio-voice rule instead.

- [ ] **Step 4: Run the helper test**

```bash
node --test scripts/copy-quality.test.mjs
```

Expected: 2 tests PASS.

- [ ] **Step 5: Implement the built-output scanner**

Create `scripts/verify-copy-output.mjs`:

```js
import { readdir, readFile } from 'node:fs/promises';
import { extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCopyViolations } from './copy-quality.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const distRoot = fileURLToPath(new URL('../dist/', import.meta.url));
const extensions = new Set(['.html', '.js']);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if (extensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const files = await collectFiles(distRoot);
const violations = [];
for (const file of files) {
  const source = relative(projectRoot, file);
  violations.push(...findCopyViolations(await readFile(file, 'utf8'), source));
}

if (violations.length > 0) {
  for (const item of violations) {
    console.error(`${item.source}: ${item.rule}: ${JSON.stringify(item.match)}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Copy verification passed for ${files.length} built files.`);
}
```

- [ ] **Step 6: Wire the checker into scripts and CI**

Add to `package.json`:

```json
"verify:copy": "node scripts/verify-copy-output.mjs"
```

Add after `npm run build` in `.github/workflows/validate.yml`:

```yaml
      - run: npm run verify:copy
```

- [ ] **Step 7: Verify and commit**

```bash
npm run test:foundation
git add scripts/copy-quality.mjs scripts/copy-quality.test.mjs scripts/verify-copy-output.mjs package.json .github/workflows/validate.yml
git commit -m "test: add customer copy quality gate"
```

Expected: foundation tests PASS. Do not run `verify:copy` until the old copy is replaced.

---

### Task 2: Edit the marketing and shared public copy

**Files:**
- Create: `tests/copy/public-copy.test.ts`
- Modify: the marketing, data, and project files listed in the File Map.
- Audit: the shared public files listed under “Audit without expected edits.”

**Interfaces:**
- Preserves all routes, collection schemas, array values, links, images, statuses, classes, and component structure.

- [ ] **Step 1: Write the failing source-copy tests**

Create `tests/copy/public-copy.test.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFile(new URL(path, root), 'utf8');

const studioCopyPaths = [
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
  'src/content/projects/good-intentions.md',
  'src/components/SiteHeader.astro',
  'src/components/SiteFooter.astro',
  'src/components/ButtonLink.astro',
  'src/components/ProjectCard.astro',
  'src/data/navigation.ts',
  'public/site.webmanifest'
] as const;

test('studio marketing copy avoids em dashes, slash shorthand, and plural voice', async () => {
  const combined = (await Promise.all(studioCopyPaths.map(read))).join('\n');
  expect(combined).not.toContain('—');
  expect(combined).not.toMatch(/\bwe\b/i);
  expect(combined).not.toMatch(/\b(?:website\/app|email\/text|booking\/payments)\b/i);
  expect(combined).not.toContain('I also build');
  expect(combined).not.toContain('I will recommend');
  expect(combined).not.toContain('Tell me what the business needs');
});

test('approved copy and Evan biography remain present', async () => {
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

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
npm run test:unit -- tests/copy/public-copy.test.ts
```

Expected: FAIL on current em dashes, mixed studio voice, and missing approved sentences.

- [ ] **Step 3: Apply the approved Home copy**

In `src/pages/index.astro`, use:

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

- [ ] **Step 4: Apply the approved About copy**

In `src/pages/about.astro`, use:

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

Business-first recommendations:
Recommendations come from the business goals, customer journey, and actual workflow. They are not based on trends, templates, or a platform the studio is trying to sell.

Clear accountability:
Scope, limitations, progress, and recommendations should remain clear throughout the project. That includes explaining when a feature is unnecessary.

Contact paragraph:
Email is the most direct way to begin. Current work is also shared through the studio’s social profiles.
```

Keep Evan’s biography in first person, including the sentence `I’m Evan Lebrecht, the designer and developer behind Calypso Digital Studio.`

- [ ] **Step 5: Apply the approved Services, Process, Work, and Start copy**

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

- [ ] **Step 6: Normalize the process descriptions**

Replace only the descriptions in `src/data/process.ts`:

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

- [ ] **Step 7: Simplify the service summaries**

Keep titles and example arrays unchanged. Use these summaries in `src/data/services.ts`:

```text
A custom website built around what customers need to understand and what the business needs to accomplish.
A clearer, faster, more professional replacement for a website that no longer represents the business.
Planning and development for businesses that need to sell products, accept payments, arrange shipping, or prepare a controlled launch.
Purpose-built digital tools for repetitive processes, customer workflows, data organization, or internal operations.
Continued help after launch for updates, new pages, added features, and technical maintenance.
```

Apply them in the existing service order.

- [ ] **Step 8: Edit the three project entries**

`src/content/projects/lrl-photography.md`

```yaml
summary: A complete photography website where visitors can learn about the photographer, compare services, and book a session.
```

`src/content/projects/rare-treats-518.md`

```yaml
summary: A colorful small-business website for rotating treats, custom orders, and local market information, without forcing the business into a fixed catalog.
```

`src/content/projects/good-intentions.md`

```yaml
summary: An editorial storefront and service experience for a secondhand clothing business, with collection stories and clear customer steps.
```

Change only these two focus labels:

```yaml
  - Style bundle process
  - Clothing donation workflow
```

Replace its body with:

```text
This project is still in progress. Draft inventory and inactive checkout are clearly identified rather than presented as live commerce.
```

Keep every title, slug, status, project type, image, featured flag, and live URL unchanged.

- [ ] **Step 9: Audit shared copy that does not need rewriting**

Read every file listed under “Audit without expected edits.” Confirm that it contains no unnecessary em dash, slash-heavy shorthand, mixed studio voice, or awkward sentence. Do not change wording merely to increase the diff.

- [ ] **Step 10: Verify and commit**

```bash
npm run test:unit -- tests/copy/public-copy.test.ts
npm run verify:content
npm run check
git add tests/copy/public-copy.test.ts src/pages/index.astro src/pages/about.astro src/pages/services.astro src/pages/process.astro src/pages/work.astro src/pages/start.astro src/data/services.ts src/data/process.ts src/content/projects/lrl-photography.md src/content/projects/rare-treats-518.md src/content/projects/good-intentions.md
git commit -m "copy: make studio marketing language more natural"
```

Expected: all commands PASS.

---

### Task 3: Edit intake, dynamic feedback, confirmation, and email copy

**Files:**
- Modify all intake, script, email, and test files listed in the File Map.

**Interfaces:**
- Preserves all form names, IDs, values, conditions, step indexes, request types, response codes, summary sections, HTML escaping, and email addresses.

- [ ] **Step 1: Add failing static intake-copy assertions**

Add to `tests/intake/markup.test.ts`:

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

- [ ] **Step 2: Update failing email expectations**

In `tests/intake/email.test.ts`:

```ts
expect(email.subject).toBe('New project inquiry | Example Studio | New business website | CDS-1111111122');
```

For the client email, assert:

```ts
expect(email.subject).toBe('Calypso Digital Studio received your project details | CDS-1111111122');
expect(email.text).toContain('Calypso Digital Studio received your project details');
expect(email.text).toContain('two to three business days');
expect(email.text).not.toContain('I received');
expect(email.text).not.toContain('We received');
expect(email.text).not.toContain('—');
```

- [ ] **Step 3: Update failing browser expectations**

In `tests/e2e/intake.spec.ts`, use:

```ts
await expect(page.locator('[data-confirmation-message]')).toContainText('two to three business days');
```

For the restored final-step draft, use:

```ts
await expect(page.getByRole('heading', { name: 'Review the request and choose a contact method.' })).toBeVisible();
```

- [ ] **Step 4: Run the focused tests and verify they fail**

```bash
npm run test:unit -- tests/intake/markup.test.ts tests/intake/email.test.ts
```

Expected: FAIL on current first-person copy, subjects, and response-time wording.

- [ ] **Step 5: Edit the wizard welcome and no-script fallback**

In `src/components/intake/IntakeWizard.astro`, use:

```text
The form usually takes 5 to 10 minutes. Technical knowledge is not required. It does not generate a price or commit you to purchasing services.

Your unfinished progress is saved on this device for 30 days.
No logo, photos, or documents need to be uploaded now.
Calypso Digital Studio will review each request within two to three business days.

Email calydigital@outlook.com. Include the business name, what you need, important features, available branding, and preferred contact method.
```

Keep the existing heading, button, data attributes, form structure, Turnstile key, imports, and styles.

- [ ] **Step 6: Edit the five step introductions**

`BusinessStep.astro`

```text
Share the basics about the business.
Business details provide context for later recommendations about pages and features.
```

`ProjectStep.astro`

```text
Choose one main direction. Add any optional features that may also be needed.
Select anything that may be useful. The final scope will be recommended after review.
```

`NeedsStep.astro`

```text
Focus on what customers or staff should be able to do. The technical solution can be worked out later.
```

`MaterialsStep.astro`

```text
No files are needed yet. The studio will request relevant materials after reviewing the project.
```

`ReviewStep.astro`

```text
Review the request and choose a contact method.
No price is generated here. Calypso Digital Studio will review the information and respond within two to three business days.
Anything else Calypso Digital Studio should know about the project?
```

Change only the corresponding heading, description, helper text, and additional-information label. Keep consent language in the client’s first person.

- [ ] **Step 7: Edit the confirmation component**

In `src/components/intake/SubmissionConfirmation.astro`, use:

```text
Calypso Digital Studio will review the information and respond within two to three business days. No price has been generated, and submitting this request does not commit you to purchasing services. A copy of the submission has been sent to your email.
```

Set the expected-response value to:

```text
Within two to three business days
```

- [ ] **Step 8: Edit dynamic feedback without changing behavior**

In `src/scripts/intake-wizard.ts`, change only:

```text
delivery_unconfirmed:
Your answers are still saved, but delivery could not be confirmed. Try again in a moment or email calydigital@outlook.com.

Delayed email-copy message:
Your project was received, but the email copy could not be confirmed. Keep this reference number and email Calypso Digital Studio at calydigital@outlook.com if you need a copy.
```

Keep all error-code keys, Turnstile diagnostics, save behavior, request payloads, and state transitions unchanged.

- [ ] **Step 9: Edit the email formatter**

In `src/lib/intake/email.ts`, use:

```ts
subject: `New project inquiry | ${intake.answers.business.businessName} | ${projectLabel} | ${intake.reference}`
```

Set the client intro to:

```ts
const intro = 'Calypso Digital Studio received your project details and will review them within two to three business days. No quote has been generated. Submitting this request does not commit you to purchasing services.';
```

Set the client subject to:

```ts
subject: `Calypso Digital Studio received your project details | ${intake.reference}`
```

Keep summary generation, escaping, reply-to addresses, labels, and section order unchanged.

- [ ] **Step 10: Verify and commit**

```bash
npm run test:unit -- tests/intake/markup.test.ts tests/intake/email.test.ts tests/intake/wizard.test.ts
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npx playwright test tests/e2e/intake.spec.ts --project=chromium
git add src/components/intake/IntakeWizard.astro src/components/intake/steps/BusinessStep.astro src/components/intake/steps/ProjectStep.astro src/components/intake/steps/NeedsStep.astro src/components/intake/steps/MaterialsStep.astro src/components/intake/steps/ReviewStep.astro src/components/intake/SubmissionConfirmation.astro src/scripts/intake-wizard.ts src/lib/intake/email.ts tests/intake/markup.test.ts tests/intake/email.test.ts tests/e2e/intake.spec.ts
git commit -m "copy: simplify intake and email language"
```

Expected: focused unit and Chromium intake tests PASS.

---

### Task 4: Complete verification and final review

**Files:**
- Review every file changed in Tasks 1 through 3.
- Do not introduce new production behavior in this task.

- [ ] **Step 1: Install exact dependencies**

```bash
npm ci
```

Expected: installation succeeds without a lockfile change.

- [ ] **Step 2: Run the complete test and validation sequence**

```bash
npm test
npm run verify:assets
npm run verify:content
npm run check
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build
npm run verify:copy
npm run verify:build
npm run test:e2e
```

Expected: every command PASS, including Chromium and WebKit.

- [ ] **Step 3: Run the final source audit**

```bash
git grep -n '—' -- src/pages src/components src/data src/content src/lib/intake/email.ts src/scripts/intake-wizard.ts public/site.webmanifest || true
git grep -niE '\b(we|I’ll personally|Tell me about the business|choose how I should respond)\b' -- src/pages src/components src/data src/content src/lib/intake/email.ts src/scripts/intake-wizard.ts public/site.webmanifest || true
git diff --check
git status --short
```

Expected:

- No unwanted customer-facing matches.
- Evan’s first-person biography and client-perspective consent statements remain allowed.
- `git diff --check` prints nothing.
- Status contains only intentional changes, or is clean after commits.

- [ ] **Step 4: Review factual and behavioral boundaries**

Confirm from the final diff:

```text
Services and project statuses did not change.
The response expectation remains two to three business days.
No price, promise, urgency, or authority claim was added.
Form field names, values, conditions, required rules, and step indexes did not change.
Turnstile, Resend, API, Cloudflare, and deployment settings did not change.
The GitHub workflow changed only to run the new validation command.
No CSS or layout changed without a reproduced spacing problem.
Evan’s About biography remains in first person.
```

- [ ] **Step 5: Commit a test-only correction only when verification required one**

When an assertion alone needed correction to match the approved copy:

```bash
git add tests scripts package.json .github/workflows/validate.yml
git commit -m "test: finalize natural copy verification"
```

Skip this step when no correction was needed. Never create an empty commit.
