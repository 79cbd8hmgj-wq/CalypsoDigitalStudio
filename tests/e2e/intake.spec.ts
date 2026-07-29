import { expect, test, type Page } from '@playwright/test';

async function prepare(page: Page, response: { confirmationEmailSent?: boolean } = {}): Promise<void> {
  await page.addInitScript(() => {
    (window as typeof window & { turnstile: unknown }).turnstile = {
      render: (_container: HTMLElement, options: { callback: (token: string) => void }) => {
        setTimeout(() => options.callback('test-turnstile-token'), 0);
        return 'test-widget';
      },
      reset: () => undefined,
      remove: () => undefined
    };
  });
  await page.route('**/api/intake', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        reference: 'CDS-1111111122',
        confirmationEmailSent: response.confirmationEmailSent ?? true
      })
    });
  });
}

async function begin(page: Page): Promise<void> {
  await page.goto('/start');
  await page.getByRole('button', { name: 'Start Your Project' }).click();
}

async function completeBusiness(page: Page): Promise<void> {
  await page.getByLabel('Your full name').fill('Jordan Example');
  await page.getByLabel('Business or project name').fill('Example Studio');
  await page.getByRole('textbox', { name: 'Business email (required)' }).fill('jordan@example.com');
  await page.getByLabel('Where is the business based?').fill('Albany, New York');
  await page.getByLabel('Local only').check();
  await page.getByLabel('What does the business offer?').fill('Portrait and event photography.');
  await page.getByLabel('Who are the main customers?').fill('Families and small businesses.');
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function chooseProject(page: Page, label: string, additions: string[] = []): Promise<void> {
  await page.getByRole('radio', { name: label }).check();
  for (const addition of additions) await page.getByRole('checkbox', { name: addition }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completeWebsiteNeeds(page: Page): Promise<void> {
  await page.locator('#needs-goals-professional').check();
  await page.locator('#needs-pages-home').check();
  await page.locator('#needs-pages-contact').check();
  await page.locator('#needs-features-contact-form').check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function continueMaterials(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completeBudget(page: Page): Promise<void> {
  await page.locator('#budget-website').selectOption('1000-2500');
  await page.getByLabel('Preferred timing').selectOption('1-3-months');
  await page.getByLabel('How ready are you to begin?').selectOption('ready');
  await page.getByLabel('Who makes the final project decision?').selectOption('client');
  await page.getByRole('button', { name: 'Continue' }).click();
}

test('completes the six-step website flow and confirms receipt', async ({ page }) => {
  await prepare(page);
  await begin(page);
  await completeBusiness(page);
  await chooseProject(page, 'New business website');
  await completeWebsiteNeeds(page);
  await continueMaterials(page);
  await completeBudget(page);

  await expect(page.getByText('Step 6 of 6', { exact: true })).toBeVisible();
  await page.getByLabel('Email', { exact: true }).check();
  await page.getByLabel('The information is accurate to the best of my knowledge.').check();
  await page.getByLabel(/I understand that submitting/).check();
  await expect(page.getByText('Security verification complete.')).toBeVisible();
  await page.getByRole('button', { name: 'Submit Project Details' }).click();

  await expect(page.getByRole('heading', { name: 'Your project details have been received.' })).toBeVisible();
  await expect(page.getByText('CDS-1111111122')).toBeVisible();
  await expect(page.locator('[data-confirmation-message]')).toContainText('2–3 business days');
});

test('shows required errors without losing the current step', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Please review the highlighted information.' })).toBeVisible();
  await expect(page.getByText('Step 1 of 6', { exact: true })).toBeVisible();
});

for (const [project, heading] of [
  ['New business website', 'Website pages and features'],
  ['Website redesign', 'Current website'],
  ['Online store', 'Products and purchasing'],
  ['Custom digital tool', 'Business process'],
  ['Ongoing website support', 'Current website support'],
  ['Not sure yet', 'Describe the problem in everyday terms']
] as const) {
  test(`reveals the ${project} question path`, async ({ page }) => {
    await begin(page);
    await completeBusiness(page);
    await chooseProject(page, project);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  });
}

for (const [addition, heading] of [
  ['Booking or appointment requests', 'Booking or appointment requests'],
  ['Online payments', 'Online payments'],
  ['Product sales', 'Products and purchasing'],
  ['Custom contact, intake, or quote forms', 'Custom form'],
  ['Website maintenance', 'Website maintenance']
] as const) {
  test(`reveals the ${addition} add-on questions`, async ({ page }) => {
    await begin(page);
    await completeBusiness(page);
    await chooseProject(page, 'New business website', [addition]);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  });
}

test('restores an unfinished request after refresh', async ({ page }) => {
  await begin(page);
  await page.getByLabel('Your full name').fill('Jordan Example');
  await page.waitForTimeout(650);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Continue where you left off?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue Saved Project' }).click();
  await expect(page.getByLabel('Your full name')).toHaveValue('Jordan Example');
});

test('confirms receipt when the client copy is delayed', async ({ page }) => {
  await prepare(page, { confirmationEmailSent: false });
  await begin(page);
  await completeBusiness(page);
  await chooseProject(page, 'New business website');
  await completeWebsiteNeeds(page);
  await continueMaterials(page);
  await completeBudget(page);
  await page.getByLabel('Email', { exact: true }).check();
  await page.getByLabel('The information is accurate to the best of my knowledge.').check();
  await page.getByLabel(/I understand that submitting/).check();
  await expect(page.getByText('Security verification complete.')).toBeVisible();
  await page.getByRole('button', { name: 'Submit Project Details' }).click();
  await expect(page.getByText(/email copy could not be confirmed/)).toBeVisible();
});

test('has no horizontal overflow', async ({ page }) => {
  await page.goto('/start');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
