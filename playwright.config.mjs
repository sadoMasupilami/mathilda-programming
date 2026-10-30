// Tests der Web-App: Chromium (installiertes Google Chrome) und WebKit, Handy und Tablet, hoch und quer, Touch.
//   werkzeuge/mit-nix.sh sh -c 'node werkzeuge/web-bauen.mjs && npx playwright test'
// Voraussetzung: Google Chrome ist installiert (channel 'chrome', wie beim PDF-Bauen) und WebKit für Playwright
// geholt (werkzeuge/mit-nix.sh npx playwright install webkit). Der Playwright-eigene Chromium wird nicht benutzt.
// Bildschirmfotos: test-results/bilder/<projekt>/<ansicht>.png
import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.WERKSTATT_TEST_PORT) || 4173;

// Geräte (Größen wie die echten Geräte; Touch, mobiler Modus)
const GERAETE = {
  'iphone-hoch': { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 },
  'iphone-quer': { viewport: { width: 667, height: 375 }, deviceScaleFactor: 2 },
  'pixel7-hoch': { viewport: { width: 412, height: 839 }, deviceScaleFactor: 2.625 },
  'pixel7-quer': { viewport: { width: 863, height: 360 }, deviceScaleFactor: 2.625 },
  'ipad-hoch': { viewport: { width: 810, height: 1080 }, deviceScaleFactor: 2 },
  'ipad-quer': { viewport: { width: 1080, height: 810 }, deviceScaleFactor: 2 },
};
const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  pixel7: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
};

const projekte = [];
for (const [browser, extra] of [['chromium', { browserName: 'chromium', channel: 'chrome' }], ['webkit', { browserName: 'webkit' }]]) {
  for (const [name, g] of Object.entries(GERAETE)) {
    projekte.push({
      name: browser + '-' + name,
      use: { ...extra, ...g, isMobile: true, hasTouch: true, userAgent: UA[name.split('-')[0]] },
    });
  }
}

export default defineConfig({
  testDir: 'tests',
  testMatch: /web\.spec\.mjs$/,
  outputDir: 'test-results/artefakte',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 6,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:' + PORT + '/denk-werkstatt/',
    locale: 'de-AT',
    // Service Worker gesperrt: Anfragen, die ein Service Worker abfängt, sieht context.route nicht mehr,
    // dann wäre die Wache gegen fremde Hosts löchrig. Nur die Offline-Tests erlauben ihn (test.use).
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: projekte,
  webServer: {
    command: 'node tests/statischer-server.mjs ' + PORT,
    url: 'http://localhost:' + PORT + '/denk-werkstatt/',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
});
