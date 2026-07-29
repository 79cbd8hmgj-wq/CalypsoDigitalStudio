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

test('wizard markup contains six steps, exact answer paths, and fallback content', async () => {
  const wizard = await read('src/components/intake/IntakeWizard.astro');
  const stepFiles = await Promise.all([
    'BusinessStep.astro',
    'ProjectStep.astro',
    'NeedsStep.astro',
    'MaterialsStep.astro',
    'BudgetStep.astro',
    'ReviewStep.astro'
  ].map((name) => read(`src/components/intake/steps/${name}`)));
  const markup = [wizard, ...stepFiles].join('\n');

  expect(markup.match(/data-step-index=/g)).toHaveLength(6);
  for (const name of [
    'business.fullName',
    'project.primaryType',
    'needs.customTool.processToImprove',
    'materials.available',
    'budgetAndTiming.budgetRange',
    'contact.preferredMethod',
    'consent.accurate'
  ]) {
    expect(markup).toContain(`name="${name}"`);
  }
  expect(markup).toContain('data-condition="store"');
  expect(markup).toContain('data-condition="custom-tool"');
  expect(markup).toContain('data-intake-form');
  expect(markup).toContain('<noscript>');
});
