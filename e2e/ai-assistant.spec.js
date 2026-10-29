import { test, expect, answerPayload, gotoResult, openAssistant, ask } from './fixtures.js';

/*
 * Reparaturassistent (ADR D9): kompletter Dialogpfad.
 *
 * Geprüft werden alle anklickbaren Elemente des Panels:
 * Einstiegsvorschläge, Eingabefeld + „Fragen“, „Ja, gelöst“,
 * „Nein, es klemmt noch“ + vier Grund-Chips, „Gerät ändern“ /
 * „Beim aktuellen bleiben“, „Erneut versuchen“, „Neue Sitzung mit
 * Zusammenfassung“, „Weitere Frage stellen“, „Verlauf löschen“.
 */

/** Ergebnis-Screen über den echten OCR-Flow (liefert Typenschild-Text). */
async function gotoResultViaOcr(page) {
  await page.goto('/');
  await page.locator('.scanner-box').click();
  await page.waitForFunction(() => (document.querySelector('.cam-video')?.videoWidth || 0) > 0);
  await page.locator('.btn-shutter').click();
  await expect(page.locator('.sheet[data-open="true"]')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Anleitungen suchen' }).click();
  await expect(page.locator('.product-card h2')).toContainText(/Latitude 5420/);
  return (await page.locator('.product-card h2').innerText()).trim();
}

test.describe('Reparaturassistent', () => {
  test('Einstieg: drei Vorschläge, Klick stellt die Frage', async ({ page }) => {
    await gotoResult(page);
    await openAssistant(page);

    const chips = page.locator('.ai-chip');
    await expect(chips).toHaveCount(3);
    await expect(page.locator('.ai-chat__intro-title')).toHaveText('Was möchtest du wissen?');

    await page.locator('.ai-chip', { hasText: 'Wie öffne ich das Gerät?' }).click();
    await expect(page.locator('.ai-msg--user')).toHaveText('Wie öffne ich das Gerät?');
    await expect(page.locator('.ai-msg--assistant')).toHaveCount(1);

    expect(page.mock.aiRequests).toHaveLength(1);
    expect(page.mock.aiRequests[0].device).toBe('Dell Latitude 5420');
    expect(page.mock.aiRequests[0].question).toBe('Wie öffne ich das Gerät?');
  });

  test('Antwort zeigt Einordnung, Schritte, Bild mit Lizenz und Quellen', async ({ page }) => {
    await gotoResult(page);
    await openAssistant(page);
    await ask(page, 'Die Kontakte sind oxidiert, wie reinige ich sie?');

    const answer = page.locator('.ai-msg--assistant').first();
    await expect(answer).toContainText('Die Kontakte sind oxidiert');
    await expect(answer.locator('.ai-step')).toHaveCount(2);
    await expect(answer.locator('.ai-step__title').first()).toHaveText('Gerät öffnen');
    await expect(answer.locator('.ai-step__figure img')).toHaveCount(1);
    await expect(answer.locator('.ai-step__figure figcaption')).toContainText('CC BY-NC-SA 3.0');
    await expect(answer.locator('.ai-step__badge').first()).toHaveText('[1]');

    const sources = answer.locator('.ai-panel__sources li');
    await expect(sources).toHaveCount(1);
    await expect(sources.first()).toContainText('[1]');
    await expect(sources.first().locator('a')).toHaveAttribute('href', 'https://www.ifixit.com/Guide/111');
    await expect(sources.first().locator('.ai-panel__source-type')).toHaveText('iFixit');
  });

  test('„Ja, gelöst“ schließt ab und erlaubt eine neue Frage', async ({ page }) => {
    await gotoResult(page);
    await openAssistant(page);
    await ask(page, 'Wie öffne ich das Gerät?');

    await page.getByRole('button', { name: 'Ja, gelöst' }).click();
    await expect(page.locator('.ai-gate--done')).toBeVisible();
    await expect(page.locator('.ai-input')).toHaveCount(0);

    await page.getByRole('button', { name: 'Weitere Frage stellen' }).click();
    await expect(page.locator('.ai-input')).toBeVisible();
    await expect(page.locator('.ai-gate--done')).toHaveCount(0);
  });

  test('„Nein“ bietet vier Gründe; „Symptom ist anders“ füllt die Eingabe', async ({ page }) => {
    await gotoResult(page);
    await openAssistant(page);
    await ask(page, 'Wie öffne ich das Gerät?');

    await page.getByRole('button', { name: 'Nein, es klemmt noch' }).click();
    const reasons = page.locator('.ai-gate__reasons .ai-chip');
    await expect(reasons).toHaveCount(4);

    await page.locator('.ai-chip', { hasText: 'Symptom ist anders' }).click();
    await expect(page.locator('.ai-input__field')).toHaveValue(/Das Symptom ist anders/);
    expect(page.mock.aiRequests).toHaveLength(1);
  });

  test('Grund-Chip stellt eine neue Frage (mit Verlauf)', async ({ page }) => {
    await gotoResult(page);
    await openAssistant(page);
    await ask(page, 'Wie öffne ich das Gerät?');

    await page.getByRole('button', { name: 'Nein, es klemmt noch' }).click();
    await page.locator('.ai-chip', { hasText: 'Teil nicht gefunden' }).click();
    await expect(page.locator('.ai-msg--assistant')).toHaveCount(2);

    const second = page.mock.aiRequests[1];
    expect(second.question).toContain('Ich finde das benötigte Teil nicht');
    expect(second.history.length).toBeGreaterThanOrEqual(2);
    expect(second.history[0]).toMatchObject({ role: 'user', content: 'Wie öffne ich das Gerät?' });
    expect(second.history[1].role).toBe('assistant');
  });

  test('Rückfrage (needs_more_info) erscheint als Hinweis und Platzhalter', async ({ page }) => {
    page.mock.aiQueue.push(
      answerPayload({
        status: 'needs_more_info',
        answer: '',
        steps: [],
        followUp: 'Welche Baugruppe ist oxidiert — Mainboard oder Anschlüsse?',
      })
    );

    await gotoResult(page);
    await openAssistant(page);
    await ask(page, 'Teile sind oxidiert');

    await expect(page.locator('.ai-answer__followup')).toContainText('Welche Baugruppe');
    await expect(page.locator('.ai-input__field')).toHaveAttribute(
      'placeholder',
      'Welche Baugruppe ist oxidiert — Mainboard oder Anschlüsse?'
    );
  });

  test('keine belegte Antwort (not_covered) wird ehrlich benannt', async ({ page }) => {
    page.mock.aiQueue.push(
      answerPayload({ status: 'not_covered', answer: '', steps: [], sources: [], followUp: null })
    );

    await gotoResult(page);
    await openAssistant(page);
    await ask(page, 'Wie tausche ich das Mainboard?');

    await expect(page.locator('.ai-answer__notice')).toContainText('keine belastbare Antwort');
    await expect(page.locator('.ai-step')).toHaveCount(0);
  });

  test('Gerätehinweis: ablehnen und nicht erneut anzeigen', async ({ page }) => {
    const hint = {
      suggestedDevice: 'Lenovo ThinkPad T14 Gen 3',
      variant: 'Gen 3',
      evidence: ['Lenovo ThinkPad T14 Gen 3 Akku tauschen'],
      reason: 'Die gefundenen Anleitungen betreffen eine andere Ausführung.',
    };

    page.mock.aiQueue.push(answerPayload({ deviceHint: hint }));
    await gotoResult(page);
    await openAssistant(page);
    await ask(page, 'Wie öffne ich das Gerät?');

    await expect(page.locator('.ai-hint')).toBeVisible();
    await expect(page.locator('.ai-hint')).toContainText('Lenovo ThinkPad T14 Gen 3');

    await page.getByRole('button', { name: 'Beim aktuellen bleiben' }).click();
    await expect(page.locator('.ai-hint')).toHaveCount(0);
    await expect(page.locator('.product-card h2')).toHaveText('Dell Latitude 5420');

    /* Maximal ein Hinweis pro Sitzung (ADR D9): auch eine neue Antwort
       mit Hinweis darf ihn nicht erneut einblenden. */
    page.mock.aiQueue.push(answerPayload({ deviceHint: hint }));
    await ask(page, 'Noch eine Frage');
    await expect(page.locator('.ai-hint')).toHaveCount(0);
  });

  test('Gerätehinweis: übernehmen ändert das Gerät und leert den Verlauf', async ({ page }) => {
    const hint = {
      suggestedDevice: 'Lenovo ThinkPad T14 Gen 3',
      variant: 'Gen 3',
      evidence: ['Lenovo ThinkPad T14 Gen 3 Akku tauschen'],
      reason: 'Die gefundenen Anleitungen betreffen eine andere Ausführung.',
    };

    page.mock.aiQueue.push(answerPayload({ deviceHint: hint }));
    await gotoResult(page);
    await openAssistant(page);
    await ask(page, 'Wie öffne ich das Gerät?');

    await page.getByRole('button', { name: 'Gerät ändern' }).click();

    await expect(page.locator('.product-card h2')).toHaveText('Lenovo ThinkPad T14 Gen 3');
    await expect(page.locator('.toast[data-show="true"]')).toContainText('geändert');
    await expect(page.locator('.ai-msg')).toHaveCount(0);
    await expect(page.locator('.ai-chat__intro')).toBeVisible();
  });

  test('Rate-Limit: Fehlermeldung und erfolgreicher Wiederholversuch', async ({ page }) => {
    await gotoResult(page);
    await openAssistant(page);

    page.mock.aiStatus = 429;
    await page.locator('.ai-input__field').fill('Wie öffne ich das Gerät?');
    await page.locator('.ai-input__send').click();

    await expect(page.locator('.ai-panel__error')).toContainText('Zu viele Anfragen');
    await expect(page.locator('.ai-msg--assistant')).toHaveCount(0);

    page.mock.aiStatus = 200;
    await page.getByRole('button', { name: 'Erneut versuchen' }).click();
    await expect(page.locator('.ai-msg--assistant')).toHaveCount(1);
    /* Wiederholen erzeugt keine doppelte Nutzerfrage */
    await expect(page.locator('.ai-msg--user')).toHaveCount(1);
  });

  test('Gesprächsbudget: 10 Fragen, Hinweis und neue Sitzung', async ({ page }) => {
    await gotoResult(page);
    await openAssistant(page);

    for (let i = 1; i <= 10; i += 1) {
      await ask(page, `Frage ${i}`);
      await expect(page.locator('.ai-panel__counter')).toHaveText(`${i}/10 Fragen in dieser Sitzung`);
    }

    await expect(page.locator('.ai-gate--limit')).toContainText('Gesprächsbudget erreicht');
    await expect(page.locator('.ai-input')).toHaveCount(0);

    await page.getByRole('button', { name: 'Neue Sitzung mit Zusammenfassung' }).click();
    await expect(page.locator('.ai-input')).toBeVisible();
    await expect(page.locator('.ai-panel__counter')).toHaveText('1/10 Fragen in dieser Sitzung');
    await expect(page.locator('.ai-msg--user')).toHaveCount(1);
    await expect(page.locator('.ai-msg--user')).toContainText('Bisheriger Stand:');
  });

  test('Verlauf überlebt die Navigation und lässt sich löschen', async ({ page }) => {
    await gotoResult(page);
    await openAssistant(page);
    await ask(page, 'Wie öffne ich das Gerät?');

    const device = (await page.locator('.product-card h2').innerText()).trim();
    const stored = await page.evaluate((key) => localStorage.getItem(key), `mendoor.ai.v1.${device}`);
    expect(stored).toContain('Wie öffne ich das Gerät?');

    /* Screen verlassen und zurückkehren */
    await page.locator('button.menu-item', { hasText: 'Repairguides' }).click();
    await expect(page.locator('.screen-header h1')).toHaveText('Repairguides');
    await page.locator('.back-btn').click();
    await openAssistant(page);

    await expect(page.locator('.ai-msg--user')).toHaveCount(1);
    await expect(page.locator('.ai-msg--assistant')).toHaveCount(1);

    await page.locator('.ai-panel__footer .ai-panel__link').click();
    await expect(page.locator('.ai-msg')).toHaveCount(0);
    await expect(page.locator('.toast[data-show="true"]')).toHaveText('Verlauf gelöscht');
    expect(await page.evaluate((key) => localStorage.getItem(key), `mendoor.ai.v1.${device}`)).toBeNull();
  });

  test('OCR-Text des Typenschilds wird als Kontext mitgeschickt', async ({ page }) => {
    await gotoResultViaOcr(page);
    await openAssistant(page);
    await ask(page, 'Welche Spannung braucht das Netzteil?');

    const request = page.mock.aiRequests[0];
    expect(request.rawText).toContain('Dell');
    expect(request.rawText).toContain('Latitude 5420');
  });
});
