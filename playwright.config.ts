import { defineConfig } from '@playwright/test';

// E2E runs against the production build (vite preview), in Chromium with software WebGL,
// so CI machines without a GPU still exercise the real 3D path.
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  fullyParallel: true,
  // Software WebGL is CPU-heavy: too many parallel workers starve each other's frames.
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4191',
    viewport: { width: 1200, height: 860 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite build && npx vite preview --host 127.0.0.1 --port 4191 --strictPort',
    url: 'http://127.0.0.1:4191', // Hum's own port: another local project uses vite's default 4173
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium' } },
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
  ],
});
