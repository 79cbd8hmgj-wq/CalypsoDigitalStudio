import { defineConfig, devices } from '@playwright/test';

const ciOptions = process.env.CI ? { retries: 1, workers: 1 } : { retries: 0 };

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  ...ciOptions,
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
