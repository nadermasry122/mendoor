import { test, expect, DEVICE, gotoResult, openedLinks } from './fixtures.js';

/*
 * Ergebnis-Screen: jede Menüzeile, jedes Disclosure und jeder
 * Ergebnis-Eintrag (Community, Archiv, Websuche) — inklusive Lade-,
 * Leer- und Fehlerpfaden mit „Erneut versuchen“.
 */

test.describe('Ergebnis-Screen', () => {
  test('Zurück führt zur Startseite', async ({ page }) => {
    await gotoResult(page);
    await page.locator('.result-header .back-btn').click();
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('Menüzeilen ohne eigene Seite melden sich per Toast', async ({ page }) => {
    await gotoResult(page);

    for (const [title, toast] of [
      ['Einzelheiten', 'Technische Daten – coming soon'],
      ['Zusammensetzung', 'Materialdaten – coming soon'],
      ['Gerät kaputt?', 'Recyclinghöfe in der Nähe – coming soon'],
    ]) {
      await page.locator('button.menu-item', { hasText: title }).click();
      await expect(page.locator('.toast[data-show="true"]')).toHaveText(toast);
    }
  });

  test('„Repairguides“ öffnet die Anleitungsliste', async ({ page }) => {
    await gotoResult(page);
    await page.locator('button.menu-item', { hasText: 'Repairguides' }).click();
    await expect(page.locator('.screen-header h1')).toHaveText('Repairguides');
    await expect(page.locator('.guide-card')).toHaveCount(2);
  });

  test('Disclosure: immer nur ein Bereich offen', async ({ page }) => {
    await gotoResult(page);

    const community = page.locator('.disclosure', { hasText: 'Community & Foren' });
    const archive = page.locator('.disclosure', { hasText: 'Anleitungen im Archiv' });

    await community.locator('> button.menu-item').click();
    await expect(community).toHaveAttribute('data-open', 'true');

    await archive.locator('> button.menu-item').click();
    await expect(archive).toHaveAttribute('data-open', 'true');
    await expect(community).toHaveAttribute('data-open', 'false');

    await archive.locator('> button.menu-item').click();
    await expect(archive).toHaveAttribute('data-open', 'false');
  });

  test('Community: jede Subreddit-Kachel öffnet die Suche', async ({ page }) => {
    await gotoResult(page);
    await page.locator('.disclosure', { hasText: 'Community & Foren' }).locator('> button.menu-item').click();

    const tiles = page.locator('.subreddit-card');
    await expect(tiles).toHaveCount(5);

    for (let index = 0; index < 5; index += 1) {
      await tiles.nth(index).click();
    }

    const links = await openedLinks(page);
    expect(links).toHaveLength(5);
    expect(links[0]).toContain('reddit.com/r/fixit/search');
    expect(links[4]).toContain('reddit.com/r/homelab/search');
    expect(decodeURIComponent(links[0])).toContain(DEVICE);
  });

  test('Archiv: Einträge öffnen, Leerzustand und Fehlerpfad', async ({ page }) => {
    await gotoResult(page);
    const panel = page.locator('.disclosure', { hasText: 'Anleitungen im Archiv' });

    await panel.locator('> button.menu-item').click();
    await expect(panel.locator('.row-item')).toHaveCount(2);
    await panel.locator('.row-item').first().click();
    await expect.poll(async () => (await openedLinks(page)).length).toBe(1);
    expect((await openedLinks(page))[0]).toContain('archive.org/details/manual-1');

    /* Fehler → Wiederholen (Mock wird vorher auf Erfolg gestellt) */
    page.mock.failArchive = true;
    await panel.locator('> button.menu-item').click(); // zu
    await panel.locator('> button.menu-item').click(); // wieder auf → lädt nicht neu (Cache)
    await expect(panel.locator('.row-item')).toHaveCount(2);
  });

  test('Archiv: Fehlerzustand bietet Wiederholen an', async ({ page }) => {
    page.mock.failArchive = true;
    await gotoResult(page);
    const panel = page.locator('.disclosure', { hasText: 'Anleitungen im Archiv' });
    await panel.locator('> button.menu-item').click();

    await expect(panel).toContainText('Verbindung fehlgeschlagen');
    page.mock.failArchive = false;
    await panel.getByRole('button', { name: 'Erneut versuchen' }).click();
    await expect(panel.locator('.row-item')).toHaveCount(2);
  });

  test('Archiv: Leerzustand verlinkt auf archive.org', async ({ page }) => {
    page.mock.emptyArchive = true;
    await gotoResult(page);
    const panel = page.locator('.disclosure', { hasText: 'Anleitungen im Archiv' });
    await panel.locator('> button.menu-item').click();

    await expect(panel).toContainText('Keine Dokumente gefunden');
    await panel.getByRole('button', { name: 'Auf archive.org suchen' }).click();
    await expect.poll(async () => (await openedLinks(page)).length).toBe(1);
    expect((await openedLinks(page))[0]).toContain('archive.org/search');
  });

  test('Websuche: Einträge öffnen und Leerzustand', async ({ page }) => {
    await gotoResult(page);
    const panel = page.locator('.disclosure', { hasText: 'Web-Suche' });
    await panel.locator('> button.menu-item').click();

    await expect(panel.locator('.row-item')).toHaveCount(2);
    await panel.locator('.row-item').first().click();
    await expect.poll(async () => (await openedLinks(page)).length).toBe(1);
    expect((await openedLinks(page))[0]).toContain('repair.example');
  });

  test('Websuche: Leerzustand und Google-Fallback', async ({ page }) => {
    page.mock.emptyWeb = true;
    await gotoResult(page);
    const panel = page.locator('.disclosure', { hasText: 'Web-Suche' });
    await panel.locator('> button.menu-item').click();

    await expect(panel).toContainText('Keine Artikel gefunden');
    await panel.getByRole('button', { name: 'Auf Google suchen' }).click();
    await expect.poll(async () => (await openedLinks(page)).length).toBe(1);
    expect((await openedLinks(page))[0]).toContain('google.com/search');
  });

  test('Websuche: Fehlerzustand mit Wiederholen und Google-Fallback', async ({ page }) => {
    page.mock.failWeb = true;
    await gotoResult(page);
    const panel = page.locator('.disclosure', { hasText: 'Web-Suche' });
    await panel.locator('> button.menu-item').click();

    await expect(panel).toContainText('Verbindung fehlgeschlagen');
    await panel.getByRole('button', { name: 'Stattdessen auf Google suchen' }).click();
    await expect.poll(async () => (await openedLinks(page)).length).toBe(1);

    page.mock.failWeb = false;
    await panel.getByRole('button', { name: 'Erneut versuchen' }).click();
    await expect(panel.locator('.row-item')).toHaveCount(2);
  });

  test('Bottom-Navigation auf dem Ergebnis-Screen', async ({ page }) => {
    await gotoResult(page);
    await page.locator('.nav-btn', { hasText: 'Profil' }).click();
    await expect(page.locator('.toast[data-show="true"]')).toHaveText('Profil – coming soon');

    await page.locator('.nav-btn', { hasText: 'Start' }).click();
    await expect(page.locator('.hero')).toBeVisible();

    await page.locator('.nav-scan').click();
    await expect(page.locator('.scanner-screen')).toBeVisible();
  });
});
