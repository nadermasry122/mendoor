import { test, expect, gotoResult, openedLinks } from './fixtures.js';

/*
 * Repairguides (iFixit): Liste, Fehler-/Leerzustand und Detailseite
 * inklusive „Vollständige Anleitung auf iFixit“.
 */
test.describe('Repairguides', () => {
  async function openGuides(page) {
    await gotoResult(page);
    await page.locator('button.menu-item', { hasText: 'Repairguides' }).click();
    await expect(page.locator('.screen-header h1')).toHaveText('Repairguides');
  }

  test('Liste zeigt Treffer und Zurück führt zum Ergebnis', async ({ page }) => {
    await openGuides(page);
    await expect(page.locator('.guide-card')).toHaveCount(2);
    await expect(page.locator('.guide-card').first()).toContainText('Dell Latitude 5420 Akku');
    await expect(page.locator('.screen-header')).toContainText('iFixit');

    await page.locator('.back-btn').click();
    await expect(page.locator('.result-header')).toBeVisible();
  });

  test('Anleitungskarte öffnet die Detailseite mit Schritten und Werkzeug', async ({ page }) => {
    await openGuides(page);
    await page.locator('.guide-card').first().click();

    await expect(page.locator('.detail-title h1')).toContainText('Akku austauschen');
    await expect(page.locator('.detail-section', { hasText: 'Benötigtes Werkzeug' })).toContainText('Kreuzschlitz');
    await expect(page.locator('.detail-section', { hasText: 'Schritte (2)' })).toBeVisible();
    await expect(page.locator('.step')).toHaveCount(2);
    await expect(page.locator('.step img').first()).toBeVisible();
    await expect(page.locator('.step').first()).toContainText('acht Schrauben');

    /* Externer CTA ist ein echter Link mit korrektem Ziel */
    const cta = page.locator('.detail-cta a');
    await expect(cta).toHaveAttribute('href', 'https://www.ifixit.com/Guide/111');
    await expect(cta).toHaveAttribute('target', '_blank');

    await page.locator('.back-btn').click();
    await expect(page.locator('.screen-header h1')).toHaveText('Repairguides');
  });

  test('Fehlerzustand: Wiederholen lädt die Liste', async ({ page }) => {
    page.mock.failGuides = true;
    await openGuides(page);

    await expect(page.locator('.state-box')).toContainText('Verbindung fehlgeschlagen');
    page.mock.failGuides = false;
    await page.getByRole('button', { name: 'Erneut versuchen' }).click();
    await expect(page.locator('.guide-card')).toHaveCount(2);
  });

  test('Leerzustand verlinkt auf die iFixit-Suche', async ({ page }) => {
    page.mock.emptyGuides = true;
    await openGuides(page);

    await expect(page.locator('.state-box')).toContainText('Keine Anleitungen gefunden');
    await page.getByRole('button', { name: 'Auf iFixit.com suchen' }).click();
    await expect.poll(async () => (await openedLinks(page)).length).toBe(1);
    expect((await openedLinks(page))[0]).toContain('ifixit.com/Suche');
  });
});

test.describe('Inspirations-Detailseite', () => {
  test('Zurück und Quellenlink', async ({ page }) => {
    await page.goto('/');
    await page.locator('.insp-card', { hasText: 'Altes Handy als Dashcam' }).click();

    await expect(page.locator('.screen-header h1')).toContainText('Dashcam');
    await expect(page.locator('.insp-intro')).toContainText('Dashcam');

    const source = page.locator('a[href*="ifixit.com"]').first();
    await expect(source).toHaveAttribute('target', '_blank');

    await page.locator('.back-btn').click();
    await expect(page.locator('.hero')).toBeVisible();
  });
});
