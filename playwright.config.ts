import { defineConfig } from '@playwright/test';

// E2E runs against the production build (vite preview), in Chromium. v2 has no WebGL (the globe is a 2D
// canvas), so no software-GPU flags: forcing SwiftShader only added CPU load, which stalled browsers on CI.
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  fullyParallel: true,
  // The globes are canvas-heavy: too many parallel workers starve each other's frames on CI's two cores.
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4191',
    viewport: { width: 1200, height: 860 },
    launchOptions: { args: ['--mute-audio'] },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite build && npm run build:og && npx vite preview --host 127.0.0.1 --port 4191 --strictPort', // og: link-preview cards
    url: 'http://127.0.0.1:4191', // Hum's own port: another local project uses vite's default 4173
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium' } },
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
  ],
});
