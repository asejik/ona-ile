import { defineConfig, devices } from '@playwright/test';

// Read CI without pulling in Node's type definitions.
const CI = Boolean((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.CI);

export default defineConfig({
  testDir: 'tests/e2e',
  // Lets CI split individual tests (not whole files) evenly across its parallel machines (--shard).
  fullyParallel: true,
  timeout: 90_000,
  // WebGL runs on the CPU (SwiftShader) here, so one browser at a time.
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
