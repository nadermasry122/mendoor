import { test, expect, gotoResult, openedLinks } from './fixtures.js';

/*
 * Startseite: jede anklickbare Fläche.
 *   · Scankachel + Scan-Button der Navigation
 *   · alle sechs Kategorie-Chips
 *   · „Zuletzt gescannt“ (leer → Eintrag nach Scan)
 *   · alle vier Inspirationskacheln
 *   · Bottom-Navigation (Start, Profil)
 */
test.describe('Startseite', () => {
  test('zeigt Hero und alle Bereiche', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero h1')).toHaveText('mendooR');
    await expect(page.locator('.scanner-box')).toContainText('Gerät scannen');
    await expect(page.locator('.cat-chip')).toHaveCount(6);
    await expect(page.locator('.insp-card')).toHaveCount(4);
    await expect(page.locator('.empty-box')).toContainText('Noch keine gescannten Geräte');
  });

  test('Kategorie-Chips sind einzeln auswählbar', async ({ page }) => {
    await page.goto('/');
    const labels = ['Kühlsysteme', 'Bildschirme', 'Lampen', 'Großgeräte', 'Kleingeräte', 'IT & Telekom'];

    for (const label of labels) {
      const chip = page.locator('.cat-chip', { hasText: label });
      await chip.click();
      await expect(chip).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.cat-chip[aria-pressed="true"]')).toHaveCount(1);
    }
  });

  test('Inspirationskacheln öffnen ihre Detailseite und zurück', async ({ page }) => {
    await page.goto('/');
    const titles = [
      'Altes Handy als Dashcam',
      'Laptop als Homeserver',
      'Kamera ausbauen & reuse',
      'Vape-Akku recyceln',
    ];

    for (const title of titles) {
      await page.locator('.insp-card', { hasText: title }).click();
      await expect(page.locator('.screen-header h1')).toContainText(title);
      await page.locator('.back-btn').click();
      await expect(page.locator('.hero')).toBeVisible();
    }
  });

  test('Bottom-Navigation: Profil-Hinweis und Start', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-btn', { hasText: 'Profil' }).click();
    await expect(page.locator('.toast[data-show="true"]')).toHaveText('Profil – coming soon');

    await page.locator('.nav-btn', { hasText: 'Start' }).click();
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('beide Scan-Einstiege führen zum Scanner', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scanner-box').click();
    await expect(page.locator('.scanner-screen')).toBeVisible();
    await page.locator('.cam-topbar .icon-btn[aria-label="Zurück"]').click();
    await expect(page.locator('.hero')).toBeVisible();

    await page.locator('.nav-scan').click();
    await expect(page.locator('.scanner-screen')).toBeVisible();
  });

  test('„Zuletzt gescannt“ öffnet das Ergebnis', async ({ page }) => {
    await gotoResult(page, 'Dell Latitude 5420');
    await page.locator('.result-header .back-btn').click();
    await expect(page.locator('.recent-item')).toHaveCount(1);
    await expect(page.locator('.recent-item')).toContainText('Dell Latitude 5420');

    await page.locator('.recent-item').click();
    await expect(page.locator('.product-card h2')).toHaveText('Dell Latitude 5420');
  });

  test('externe Links werden nicht im Tab geöffnet', async ({ page }) => {
    await page.goto('/');
    expect(await openedLinks(page)).toEqual([]);
  });
});
