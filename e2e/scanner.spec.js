import { test, expect, DEVICE } from './fixtures.js';

/*
 * Scanner: alle Bedienelemente.
 *   · Zurück, manuelle Eingabe (Abbrechen/Bestätigen), OCR-Auslöser,
 *     Vorschlags-Chips, Galerie, Kamerawechsel, Zoom/Blitz/Objektiv
 *     (nur wenn die Kamera sie meldet), Fehlerzustand + Wiederholen
 */
test.describe('Scanner', () => {
  test('Zurück führt zur Startseite', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scanner-box').click();
    await page.locator('.cam-topbar .icon-btn[aria-label="Zurück"]').click();
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('manuelle Eingabe: Abbrechen und Bestätigen', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scanner-box').click();

    await page.locator('.cam-manual').click();
    await expect(page.locator('.sheet[data-open="true"]')).toBeVisible();
    await expect(page.locator('.sheet')).toContainText('Modell manuell eingeben');

    await page.getByRole('button', { name: 'Abbruch' }).click();
    await expect(page.locator('.sheet')).toHaveAttribute('data-open', 'false');

    await page.locator('.cam-manual').click();
    await page.locator('.ocr-input').fill(DEVICE);
    await page.getByRole('button', { name: 'Anleitungen suchen' }).click();

    await expect(page.locator('.product-card h2')).toHaveText(DEVICE);
  });

  test('leere manuelle Eingabe wird abgefangen', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scanner-box').click();
    await page.locator('.cam-manual').click();
    await page.getByRole('button', { name: 'Anleitungen suchen' }).click();

    await expect(page.locator('.toast[data-show="true"]')).toHaveText('Bitte ein Modell eingeben');
    await expect(page.locator('.sheet[data-open="true"]')).toBeVisible();
  });

  test('OCR-Auslöser: Vorschläge, Chip-Auswahl und Bestätigung', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scanner-box').click();
    await expect(page.locator('.btn-shutter')).toBeVisible();
    /* Auf das erste Videobild warten — sonst meldet der Scanner
       "Kamera noch nicht bereit" (videoWidth ist noch 0). */
    await page.waitForFunction(() => (document.querySelector('.cam-video')?.videoWidth || 0) > 0);

    await page.locator('.btn-shutter').click();

    const sheet = page.locator('.sheet[data-open="true"]');
    await expect(sheet).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.sheet')).toContainText('Gerät erkannt?');
    // Der gefilterte Typenschild-Text wird angezeigt (Modell + Spannung).
    await expect(page.locator('.ocr-raw')).toContainText('Dell');
    await expect(page.locator('.ocr-raw')).toContainText('19V');

    const chips = page.locator('.ocr-chip');
    await expect(chips.first()).toBeVisible();
    await expect(chips).not.toHaveCount(0);

    await chips.first().click();
    const chipText = (await chips.first().innerText()).trim();
    await expect(page.locator('.ocr-input')).toHaveValue(chipText);

    await page.getByRole('button', { name: 'Anleitungen suchen' }).click();
    await expect(page.locator('.product-card h2')).toHaveText(chipText);
  });

  test('Galerie-Platzhalter meldet sich per Toast', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scanner-box').click();
    await page.locator('.btn-gallery').click();
    await expect(page.locator('.toast[data-show="true"]')).toHaveText('Galerie – coming soon');
  });

  test('Kamerawechsel meldet die aktive Kamera', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scanner-box').click();
    await page.locator('.btn-flip').click();
    await expect(page.locator('.toast[data-show="true"]')).toHaveText('Frontkamera');
    await page.locator('.btn-flip').click();
    await expect(page.locator('.toast[data-show="true"]')).toHaveText('Rückkamera');
  });

  test('optionale Kamerabedienung: Zoom, Blitz, Objektiv', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scanner-box').click();
    await expect(page.locator('.scanner-screen')).toBeVisible();

    /* Capability Detection (ADR C1): Diese Bedienelemente erscheinen nur,
       wenn die (Fake-)Kamera sie meldet. Der Test prüft sie deshalb
       bedingt — aber wenn vorhanden, wird jedes benutzt. */
    const zoom = page.locator('.cam-zoom input[type="range"]');
    if (await zoom.count()) {
      await zoom.focus();
      await zoom.press('ArrowRight');
      await expect(page.locator('.cam-zoom span')).toBeVisible();
    }

    const torch = page.locator('button[aria-label="Blitz"]');
    if (await torch.count()) {
      await torch.click();
      await expect(torch).toHaveAttribute('aria-pressed', 'true');
      await torch.click();
      await expect(torch).toHaveAttribute('aria-pressed', 'false');
    }

    const lens = page.locator('button[aria-label="Objektiv wechseln"]');
    if (await lens.count()) {
      await lens.click();
      await expect(page.locator('.toast[data-show="true"]')).toBeVisible();
    }

    /* Tap-to-Focus auf dem Videobild */
    await page.locator('.cam-video').click({ position: { x: 100, y: 120 } });
    await expect(page.locator('.focus-ring')).toBeVisible();
  });

  test('Kamerafehler: Hinweis und Wiederholen', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () =>
            Promise.reject(Object.assign(new Error('NotAllowedError'), { name: 'NotAllowedError' })),
          enumerateDevices: async () => [],
        },
      });
    });

    await page.goto('/');
    await page.locator('.scanner-box').click();

    await expect(page.locator('.cam-error')).toBeVisible();
    await expect(page.locator('.cam-error')).toContainText('Kamera');

    await page.getByRole('button', { name: 'Erneut versuchen' }).click();
    await expect(page.locator('.scanner-screen')).toBeVisible();

    /* Manuelle Eingabe bleibt trotz Kameraausfall erreichbar. */
    await page.locator('.cam-manual').click();
    await expect(page.locator('.sheet[data-open="true"]')).toBeVisible();
  });
});
