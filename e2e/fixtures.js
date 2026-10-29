import { test as base, expect } from '@playwright/test';

/*
 * Gemeinsame E2E-Fixtures.
 *
 * Jede Testseite erhält `page.mock` — ein steuerbares Abbild der externen
 * Dienste. Damit lassen sich Erfolgs-, Leer- und Fehlerpfade erzwingen,
 * ohne echte APIs oder Schlüssel zu verwenden.
 */

const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

export const DEVICE = 'Dell Latitude 5420';

/* ── Fixture-Daten ─────────────────────────────────────────── */

export const VISION_TEXT = 'Dell Latitude 5420\nService Tag: ABC1234\n19V 3.34A';

export function visionPayload() {
  return {
    text: VISION_TEXT,
    words: [
      { text: 'Dell', confidence: 96 },
      { text: 'Latitude', confidence: 94 },
      { text: '5420', confidence: 92 },
      { text: '19V', confidence: 88 },
    ],
    provider: 'mock-vision',
  };
}

export function guideSearchResults() {
  return {
    results: [
      {
        dataType: 'guide',
        guideid: 111,
        title: 'Dell Latitude 5420 Akku austauschen',
        subject: 'Dell Latitude 5420',
        category: 'Laptop',
        difficulty: 'Moderate',
        type: 'replacement',
        image: { standard: 'https://img.example/guide1.jpg' },
      },
      {
        dataType: 'guide',
        guideid: 112,
        title: 'Dell Latitude 5420 Tastatur austauschen',
        subject: 'Dell Latitude 5420',
        category: 'Laptop',
        difficulty: 'Easy',
        type: 'replacement',
        image: { standard: 'https://img.example/guide2.jpg' },
      },
    ],
  };
}

export function guideDetailPayload() {
  return {
    guideid: 111,
    title: 'Dell Latitude 5420 Akku austauschen',
    summary: 'Akku in wenigen Schritten tauschen.',
    introduction_raw: 'Eine kurze Anleitung zum Austausch des Akkus.',
    conclusion_raw: 'Baue das Gerät in umgekehrter Reihenfolge zusammen.',
    difficulty: 'Moderate',
    time_required: '20 Minuten',
    category: 'Laptop',
    url: 'https://www.ifixit.com/Guide/111',
    image: { standard: 'https://img.example/guide1.jpg' },
    tools: [{ text: 'Kreuzschlitz PH0' }],
    steps: [
      {
        title: 'Schrauben lösen',
        lines: [{ text_raw: 'Löse die acht Schrauben an der Unterseite.' }],
        media: { type: 'image', data: [{ standard: 'https://img.example/step1.jpg' }] },
      },
      {
        title: 'Akku abstecken',
        lines: [{ text_raw: 'Ziehe den Akkustecker senkrecht nach oben ab.' }],
        media: { type: 'image', data: [{ standard: 'https://img.example/step2.jpg' }] },
      },
    ],
  };
}

export function archivePayload() {
  return {
    query: DEVICE,
    count: 2,
    items: [
      {
        identifier: 'manual-1',
        title: 'Latitude 5420 Service Manual',
        year: 2019,
        description: 'Servicehandbuch',
        url: 'https://archive.org/details/manual-1',
      },
      {
        identifier: 'manual-2',
        title: 'Latitude 5420 Owner Manual',
        year: 2020,
        description: 'Benutzerhandbuch',
        url: 'https://archive.org/details/manual-2',
      },
    ],
  };
}

export function webPayload() {
  return {
    query: DEVICE,
    count: 2,
    items: [
      {
        title: 'Latitude 5420 Mainboard reinigen',
        url: 'https://repair.example/latitude-5420',
        snippet: 'Oxidierte Kontakte mit Isopropanol reinigen.',
        kind: 'repair',
      },
      {
        title: 'Dell Latitude 5420 Service Manual',
        url: 'https://dell.example/manual',
        snippet: 'Offizielles Servicehandbuch als PDF.',
        kind: 'manual',
      },
    ],
  };
}

/* Serverseitig aufgelöste Antwort (so wie sie der Worker liefert:
   Zitate bereits umnummeriert, Bild an den Schritt gebunden). */
export function answerPayload(overrides = {}) {
  return {
    status: 'answered',
    answer: 'Die Kontakte sind oxidiert [1]. Reinige sie mit Isopropanol.',
    steps: [
      {
        title: 'Gerät öffnen',
        text: 'Löse die acht Schrauben an der Unterseite [1].',
        sources: [1],
        image: {
          id: 'i1',
          sourceId: 's1',
          url: 'https://img.example/step1.jpg',
          alt: 'Schritt 1',
          license: 'CC BY-NC-SA 3.0',
          attribution: 'iFixit',
        },
      },
      {
        title: 'Kontakte reinigen',
        text: 'Isopropanol auf ein Tuch geben und die Kontakte abtupfen [1].',
        sources: [1],
        image: null,
      },
    ],
    followUp: null,
    sources: [
      {
        id: 's1',
        type: 'ifixit',
        title: 'Dell Latitude 5420 Akku austauschen',
        url: 'https://www.ifixit.com/Guide/111',
        number: 1,
        license: 'CC BY-NC-SA 3.0',
        attribution: 'iFixit',
      },
    ],
    images: [],
    deviceHint: null,
    model: 'mock-model',
    query: DEVICE,
    cached: true,
    context: { chunks: 4, sources: 3, images: 2, steps: 3 },
    usage: null,
    remaining: 19,
    errors: [],
    ...overrides,
  };
}

/* ── Fixture ───────────────────────────────────────────────── */

export const test = base.extend({
  context: async ({ context }, use) => {
    /* window.open abfangen: externe Links werden protokolliert statt
       geöffnet (kein Popup, keine Netzlast). */
    await context.addInitScript(() => {
      window.__opened = [];
      window.open = (url) => {
        window.__opened.push(String(url));
        return null;
      };
    });
    await use(context);
  },

  page: async ({ page }, use) => {
    const mock = {
      visionCalls: 0,
      aiRequests: [],
      aiQueue: [],
      aiStatus: 200,
      failArchive: false,
      failWeb: false,
      failVision: false,
      failGuides: false,
      emptyGuides: false,
      emptyArchive: false,
      emptyWeb: false,
      answer: () => answerPayload(),
    };
    page.mock = mock;

    /* 1) Alles Fremde blocken (deterministisch, offline-fähig). */
    await page.route(/^https?:\/\/(?!127\.0\.0\.1:4317|localhost:4317)/, (route) => route.abort());

    /* 2) Bilder: immer ein 1×1-Pixel, damit Layouts nicht auf Netz warten. */
    await page.route(/\.(png|jpe?g|webp|gif)(\?.*)?$/i, (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL })
    );

    /* 3) Worker-Endpunkte. */
    await page.route('**/api/ping', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) })
    );

    await page.route('**/api/vision**', async (route) => {
      mock.visionCalls += 1;
      if (mock.failVision) {
        return route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Vision API error 500' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(visionPayload()),
      });
    });

    await page.route('**/api/archive**', (route) => {
      if (mock.failArchive) {
        return route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Archive.org unreachable' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mock.emptyArchive ? { ...archivePayload(), count: 0, items: [] } : archivePayload()),
      });
    });

    await page.route('**/api/websearch**', (route) => {
      if (mock.failWeb) {
        return route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Tavily error 502' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mock.emptyWeb ? { ...webPayload(), count: 0, items: [] } : webPayload()),
      });
    });

    await page.route('**/api/ai**', async (route) => {
      const request = route.request();
      if (request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            debug: true,
            cached: false,
            stats: { sources: 3, chunks: 4, images: 2, steps: 3, chars: 4000 },
            sources: [],
            steps: [],
            images: [],
            chunkPreview: [],
            errors: [],
          }),
        });
      }

      const body = JSON.parse(request.postData() || '{}');
      mock.aiRequests.push(body);

      if (mock.aiStatus !== 200) {
        return route.fulfill({
          status: mock.aiStatus,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMITED' }),
        });
      }

      const next = mock.aiQueue.length > 0 ? mock.aiQueue.shift() : mock.answer(body);
      const payload = typeof next === 'function' ? next(body) : next;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    });

    /* 4) iFixit direkt (Client ruft die öffentliche API selbst auf). */
    await page.route('https://www.ifixit.com/api/2.0/search/**', (route) => {
      if (mock.failGuides) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"down"}' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mock.emptyGuides ? { results: [] } : guideSearchResults()),
      });
    });

    await page.route('https://www.ifixit.com/api/2.0/guides/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(guideDetailPayload()),
      })
    );

    await use(page);
  },
});

export { expect };

/* ── Navigations-Helfer ────────────────────────────────────── */

/** Start → Scanner → manuelle Eingabe → Ergebnis-Screen. */
export async function gotoResult(page, device = DEVICE) {
  await page.goto('/');
  await expect(page.locator('.hero')).toBeVisible();
  await page.locator('.scanner-box').click();
  await expect(page.locator('.scanner-screen')).toBeVisible();
  await page.locator('.cam-manual').click();
  await expect(page.locator('.sheet[data-open="true"]')).toBeVisible();
  await page.locator('.ocr-input').fill(device);
  await page.getByRole('button', { name: 'Anleitungen suchen' }).click();
  await expect(page.locator('.product-card h2')).toHaveText(device);
}

/** KI-Disclosure öffnen (nur ein Bereich darf offen sein). */
export async function openAssistant(page) {
  const button = page.locator('.disclosure--ai > button.menu-item');
  if ((await button.getAttribute('aria-expanded')) !== 'true') {
    await button.click();
  }
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.ai-panel')).toBeVisible();
}

/** Frage stellen und auf die nächste Antwort warten. */
export async function ask(page, text) {
  const answers = page.locator('.ai-msg--assistant');
  const before = await answers.count();
  await page.locator('.ai-input__field').fill(text);
  await page.locator('.ai-input__send').click();
  await expect(answers).toHaveCount(before + 1);
}

/** Geöffnete externe Links (window.open) aus der Seite lesen. */
export async function openedLinks(page) {
  return page.evaluate(() => window.__opened || []);
}
