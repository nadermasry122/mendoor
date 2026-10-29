import test from 'node:test';
import assert from 'node:assert/strict';

test('Worker-Endpunkt /api/ai: Bundle, Prompt, Antwort, Debug', async () => {
/* ── Upstream-Antworten stubben (kein Netz, keine Schlüssel) ── */
const calls = [];
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  calls.push(u);
  const json = (data) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

  if (u.startsWith('https://www.ifixit.com/api/2.0/search/')) {
    return json({ results: [{ dataType: 'guide', guideid: 111, title: 'Dell Latitude 5420 Battery Replacement', subject: 'Dell Latitude 5420', category: 'Laptop' }] });
  }
  if (u.includes('/api/2.0/guides/111')) {
    return json({
      guideid: 111,
      title: 'Dell Latitude 5420 Battery Replacement',
      summary: 'Akku tauschen',
      difficulty: { name: 'Moderate' },
      time_required_max: 3600,
      url: 'https://www.ifixit.com/Guide/111',
      steps: [
        {
          title: 'Gehäuse öffnen',
          lines: [{ text: 'Entferne die acht Schrauben an der Unterseite.' }, { text: 'Hebe die Abdeckung vorsichtig ab.' }],
          media: { type: 'image', data: [{ standard: 'https://ifixit.example/step1.jpg', medium: 'https://ifixit.example/step1m.jpg' }] },
        },
        { title: 'Akku abstecken', lines: [{ text: 'Ziehe den Akkustecker senkrecht nach oben ab.' }], media: { type: 'image', data: [{ standard: 'https://ifixit.example/step2.jpg' }] } },
      ],
    });
  }
  if (u.startsWith('https://archive.org/advancedsearch.php')) {
    return json({ response: { docs: [
      { identifier: 'manual-free', title: 'Latitude 5420 Service Manual', year: 2019, description: 'Servicehandbuch' },
      { identifier: 'manual-locked', title: 'Latitude 5420 User Guide', year: 2019, description: 'Benutzerhandbuch' },
    ] } });
  }
  if (u === 'https://archive.org/metadata/manual-free') {
    return json({ licenseurl: 'http://creativecommons.org/publicdomain/mark/1.0/', files: [{ name: 'manual-free_djvu.txt' }] });
  }
  if (u === 'https://archive.org/metadata/manual-locked') {
    return json({ files: [{ name: 'manual-locked_djvu.txt' }] });
  }
  if (u.startsWith('https://archive.org/download/manual-free/')) {
    return new Response('Kapitel 1. Entferne zuerst den Akku. '.repeat(80));
  }
  if (u === 'https://api.tavily.com/search') {
    const q = JSON.parse(init.body).query;
    return json({ results: [
      {
        title: 'Latitude 5420 Mainboard reinigen — Repair Guide',
        url: 'https://repair.example/latitude-5420-reinigen',
        content: 'Oxidierte Kontakte mit Isopropanol reinigen. Platine vorher abklemmen.',
        raw_content: 'Oxidierte Kontakte mit Isopropanol reinigen. Platine vorher abklemmen. '.repeat(60),
        score: 0.8,
      },
      {
        title: 'Latitude 5420 kaufen — Angebot',
        url: 'https://shop.example/latitude-5420',
        content: 'Günstig kaufen',
        score: 0.9,
      },
    ], query: q });
  }
  return new Response('not found', { status: 404 });
};

const { getBundle } = await import('../functions/bundle.js');
const { handleAi } = await import('../functions/ai.js');

const testEnv = { TAVILY_API_KEY: { get: async () => 'test-key' } };
const { bundle, cached } = await getBundle('Dell Latitude 5420', testEnv, { rawText: 'Dell Latitude 5420 S/N: ABC123456 19V 3.34A' });
assert.equal(cached, false);
assert.equal(bundle.sources.length, 4, JSON.stringify(bundle.sources.map((s) => s.type)));
assert.ok(bundle.stats.steps >= 2);
assert.ok(bundle.stats.images >= 2);
assert.ok(bundle.chunks.length >= 4);

const ifixit = bundle.sources.find((s) => s.type === 'ifixit');
assert.equal(ifixit.license, 'CC BY-NC-SA 3.0');
assert.equal(bundle.images[0].url, 'https://ifixit.example/step1.jpg');

const free = bundle.sources.find((s) => s.url.includes('manual-free'));
const locked = bundle.sources.find((s) => s.url.includes('manual-locked'));
assert.ok(free.license.includes('creativecommons'));
assert.equal(locked.license, '');
assert.ok(!bundle.chunks.some((c) => c.sourceId === locked.id), 'gesperrtes Archiv darf keine Chunks liefern');
assert.ok(bundle.chunks.some((c) => c.sourceId === free.id));

const web = bundle.sources.find((s) => s.type === 'web');
assert.equal(web.kind, 'repair');
assert.ok(!bundle.sources.some((s) => s.url.includes('shop.example')), 'Shop muss gefiltert sein');

/* ── Endpunkt mit gefälschtem Modell ── */
const modelReply = {
  status: 'answered',
  answer: 'Die Kontakte sind oxidiert [c1].',
  steps: [{ title: 'Reinigen', text: 'Isopropanol nutzen, vorher abklemmen [c1].', sources: ['c1'], stepRef: 'c1' }],
  followUp: null,
};
const env = { AI: { run: async () => ({ response: JSON.stringify(modelReply), usage: { total_tokens: 42 } }) } };
const req = new Request('http://local/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '1.2.3.4' },
  body: JSON.stringify({ device: 'Dell Latitude 5420', question: 'Die Teile sind oxidiert, wie reinige ich sie?', rawText: 'S/N ABC123456' }),
});
const resp = await handleAi(req, env);
const data = await resp.json();
assert.equal(resp.status, 200, JSON.stringify(data));
assert.equal(data.status, 'answered');
assert.ok(data.sources.length >= 1);
assert.ok(/\[1\]/.test(data.answer), data.answer);
assert.ok(!/\[c1\]/.test(data.answer));
assert.ok(data.steps.length === 1);
assert.ok(data.usage.total_tokens === 42);
assert.ok(data.context.chunks >= 1);

/* Debug-POST: kein AI-Aufruf, Prompt sichtbar */
const dbgReq = new Request('http://local/api/ai?debug=1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ device: 'Dell Latitude 5420', question: 'Wie öffne ich das Gehäuse?' }),
});
const dbg = await (await handleAi(dbgReq, env)).json();
assert.equal(dbg.debug, true);
assert.ok(dbg.messages.length >= 2);
assert.ok(/Gehäuse/.test(JSON.stringify(dbg.messages)));

/* Gerätehinweis: Titel mit Gen 3, Gerät ohne */
const b2 = { sources: [
  { type: 'ifixit', title: 'Lenovo ThinkPad T14 Gen 3 Battery Replacement' },
  { type: 'ifixit', title: 'Lenovo ThinkPad T14 Gen 3 Fan Replacement' },
] };
const { detectDeviceVariant } = await import('../functions/rag.js');
assert.equal(detectDeviceVariant('ThinkPad T14', b2).suggestedDevice, 'Lenovo ThinkPad T14 Gen 3');

});
