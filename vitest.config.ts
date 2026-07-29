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
