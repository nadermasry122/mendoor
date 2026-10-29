import { defineConfig, devices } from '@playwright/test';

/*
 * End-to-End-Tests für die React-App (ADR D9, Teststrategie).
 *
 * Die Tests laufen gegen den Vite-Dev-Server. Alle externen Dienste
 * (iFixit, Cloudflare-Worker-Endpunkte, Tavily, Bild-CDNs) werden über
 * `page.route` durch deterministische Fixtures ersetzt — siehe
 * `e2e/fixtures.js`. Dadurch brauchen die Tests weder API-Schlüssel noch
 * Netzwerkzugriff und sind reproduzierbar.
 *
 * Kamera: Chromium startet mit Fake-Device, damit der Scan-Flow
 * (Auslösen → /api/vision → Bestätigungs-Sheet) echt durchlaufen wird.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  outputDir: 'test-results',

  use: {
    baseURL: 'http://127.0.0.1:4317',
    viewport: { width: 390, height: 844 },
    permissions: ['camera'],
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],

  webServer: {
    command: 'npm run dev -- --port 4317 --strictPort',
    url: 'http://127.0.0.1:4317',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
