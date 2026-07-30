import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

const root = new URL('../../', import.meta.url);

async function read(path: string): Promise<string> {
  return readFile(new URL(path, root), 'utf8');
}

test('wrangler config provides the production intake plaintext variables', async () => {
  const config = await read('wrangler.toml');

  expect(config).toContain('[vars]');
  expect(config).toContain('INTAKE_ALLOWED_ORIGINS = "https://calypsodigitalstudio.pages.dev"');
  expect(config).toContain('INTAKE_FROM_EMAIL = "onboarding@resend.dev"');
  expect(config).toContain('PUBLIC_TURNSTILE_SITE_KEY = "0x4AAAAAAEBqlDclbS1Wmdm0"');
});

test('the static production fallback uses the exact copied Turnstile site key', async () => {
  const wizard = await read('src/components/intake/IntakeWizard.astro');

  expect(wizard).toContain("const productionTurnstileSiteKey = '0x4AAAAAAEBqlDclbS1Wmdm0';");
});
