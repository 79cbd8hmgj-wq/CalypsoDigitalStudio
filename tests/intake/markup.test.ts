import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

const root = new URL('../../', import.meta.url);

async function read(path: string): Promise<string> {
  return readFile(new URL(path, root), 'utf8');
}

test('start page mounts the complete intake wizard without placeholder language', async () => {
  const page = await read('src/pages/start.astro');
  expect(page).toContain('IntakeWizard');
  expect(page).not.toContain('Until the guided form is activated');
  expect(page).not.toContain('What the full guided form will cover');
});

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

test('wizard has the exact production Turnstile site-key fallback', async () => {
  const wizard = await read('src/components/intake/IntakeWizard.astro');

  expect(wizard).toContain("const productionTurnstileSiteKey = '0x4AAAAAAEBqlDclbS1Wmdm0';");
  expect(wizard).toContain('configuredTurnstileSiteKey || productionTurnstileSiteKey');
});
