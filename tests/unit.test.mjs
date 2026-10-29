import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkText, buildBundle } from '../functions/bundle.js';
import {
  questionTokens, selectChunks, parseStructuredAnswer, resolveAnswer,
  sanitizeAnswerText, detectDeviceVariant, normalizeHistory, normalizeQuestion,
} from '../functions/rag.js';
import { redactIdentifiers } from '../functions/redact.js';

test('Chunking, Tokenisierung, Redaktion, Validierung, Geraeteabgleich', () => {
// chunkText
const chunks = chunkText('Satz eins. Satz zwei! ' + 'Fülltext '.repeat(300) + ' Ende.');
assert.ok(chunks.length >= 2);
assert.ok(chunks.every((c) => c.length <= 1120));
assert.deepEqual(chunkText(''), []);
assert.deepEqual(chunkText('zu kurz'), []);

// tokens
assert.deepEqual(questionTokens('Wie reinige ich die oxidierte Platine?'), ['reinige', 'oxidierte', 'platine']);

// redaction
const red = redactIdentifiers('Dell Latitude 5420 S/N: ABC12345678 MAC 00:1A:2B:3C:4D:5E IMEI 356789012345678 19V 3.34A');
assert.ok(!/ABC12345678/.test(red), red);
assert.ok(!/00:1A:2B:3C:4D:5E/.test(red), red);
assert.ok(!/356789012345678/.test(red), red);
assert.ok(/19V 3\.34A/.test(red), red);
assert.ok(/Latitude 5420/.test(red), red);

// history
assert.deepEqual(normalizeHistory('x'), []);
assert.equal(normalizeHistory([{role:'user',content:'a'},{role:'system',content:'b'}]).length, 1);
assert.ok(normalizeQuestion('x'.repeat(1000)).length === 600);

// sanitize
const allowed = new Set(['https://www.ifixit.com/Guide/1']);
assert.equal(sanitizeAnswerText('siehe https://evil.example/x', allowed), 'siehe');
assert.equal(sanitizeAnswerText('[Guide](https://evil.example/x)', allowed), 'Guide');
assert.equal(sanitizeAnswerText('[Guide](https://www.ifixit.com/Guide/1)', allowed), '[Guide](https://www.ifixit.com/Guide/1)');

// parse
assert.equal(parseStructuredAnswer('{"status":"answered"}').status, 'answered');
assert.equal(parseStructuredAnswer('```json\n{"a":1}\n```').a, 1);
assert.equal(parseStructuredAnswer('kein json'), null);

// bundle fixture
const bundle = {
  version: 1,
  device: 'Dell Latitude 5420',
  sources: [
    { id: 's1', type: 'ifixit', title: 'Latitude 5420 Battery Replacement', url: 'https://www.ifixit.com/Guide/1', kind: '' },
    { id: 's2', type: 'web', title: 'Dell Latitude 5420 Service Manual', url: 'https://dell.example/manual', kind: 'manual' },
    { id: 's3', type: 'web', title: 'Mainboard reinigen', url: 'https://repair.example/a', kind: 'repair' },
  ],
  chunks: [
    { id: 'c1', sourceId: 's1', heading: 'Schritt 1: Öffnen', text: 'Drehe die Schrauben an der Unterseite heraus und öffne das Gehäuse.' },
    { id: 'c2', sourceId: 's1', heading: 'Schritt 2: Akku', text: 'Ziehe den Akkustecker ab und entferne den Akku.' },
    { id: 'c3', sourceId: 's2', heading: 'Handbuchauszug 1', text: 'Die Platine sitzt unter der Tastatur.' },
    { id: 'c4', sourceId: 's3', heading: 'Oxidation', text: 'Oxidierte Kontakte mit Isopropanol reinigen.' },
  ],
  images: [{ id: 'i1', sourceId: 's1', stepIndex: 0, url: 'https://ifixit.example/1.jpg', alt: 'Schritt 1', license: 'CC BY-NC-SA 3.0' }],
  steps: [{ id: 't1', sourceId: 's1', index: 0, title: 'Öffnen', text: 'x', imageId: 'i1' }],
};

// selectChunks: question about oxidation should pick c4 first
const picked = selectChunks(bundle, 'Die Teile sind oxidiert, wie reinige ich sie?');
assert.equal(picked[0].id, 'c4', picked.map((c) => c.id).join(','));
assert.ok(picked.length <= 6);
// empty question -> overview, max 1 per source
const overview = selectChunks(bundle, '');
assert.ok(overview.length >= 2 && overview.length <= 3, String(overview.length));

// resolveAnswer with valid JSON
const raw = JSON.stringify({
  status: 'answered',
  answer: 'Die Kontakte sind oxidiert [c4].',
  steps: [{ title: 'Reinigen', text: 'Isopropanol nutzen [c4].', sources: ['c4'], stepRef: 'c4' }],
  followUp: null,
});
const out = resolveAnswer(raw, { bundle, chunks: picked });
assert.equal(out.status, 'answered');
assert.equal(out.sources.length, 1);
assert.equal(out.sources[0].number, 1);
assert.equal(out.sources[0].id, 's3');
assert.equal(out.steps[0].sources[0], 1);
assert.ok(!/\[c4\]/.test(out.answer), out.answer);
assert.ok(/\[1\]/.test(out.answer));

// image resolution via stepRef
const raw2 = JSON.stringify({
  status: 'answered', answer: 'a',
  steps: [{ title: 'Öffnen', text: 'b', sources: ['c1'], stepRef: 'c1' }],
});
const out2 = resolveAnswer(raw2, { bundle, chunks: bundle.chunks });
assert.equal(out2.steps[0].image.id, 'i1');

// invented image ref must be dropped
const raw3 = JSON.stringify({ status: 'answered', answer: 'a', steps: [{ title: 'x', text: 'y', sources: ['c4'], stepRef: 'c1' }] });
assert.equal(resolveAnswer(raw3, { bundle, chunks: picked }).steps[0].image, null);

// parse fallback
const fb = resolveAnswer('Nur Prosa ohne JSON https://evil.example', { bundle, chunks: picked });
assert.equal(fb.parseFallback, true);
assert.equal(fb.status, 'answered');
assert.ok(!/evil/.test(fb.answer));

// device variant
const b2 = {
  sources: [
    { type: 'ifixit', title: 'Lenovo ThinkPad T14 Gen 3 Battery Replacement' },
    { type: 'ifixit', title: 'Lenovo ThinkPad T14 Gen 3 Fan Replacement' },
    { type: 'ifixit', title: 'Lenovo ThinkPad T14 Gen 3 Display Replacement' },
  ],
};
const hint = detectDeviceVariant('ThinkPad T14', b2);
assert.ok(hint, 'hint expected');
assert.equal(hint.suggestedDevice, 'Lenovo ThinkPad T14 Gen 3');
assert.equal(detectDeviceVariant('ThinkPad T14 Gen 3', b2), null);
assert.equal(detectDeviceVariant('ThinkPad T14', { sources: [] }), null);

});
