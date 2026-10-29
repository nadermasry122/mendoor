/*
 * Live-Smoke-Test (optional, braucht Netz und einen gebauten Client).
 *
 * Startet den echten Worker lokal (wrangler dev --local), prüft den
 * Health-Endpunkt und baut ein echtes Kontext-Bundle gegen iFixit und
 * das Internet Archive. Tavily wird — falls kein Key hinterlegt ist —
 * als Fehlerquelle toleriert (der Bundle-Bau läuft weiter).
 *
 *   npm run test:live
 *
 * Nicht Teil von `npm test`: netzabhängig und absichtlich langsam.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const PORT = 8791;
const BASE = `http://127.0.0.1:${PORT}`;
const IS_WIN = process.platform === 'win32';
const DEVICE = 'Dell Latitude 5420';

const WRANGLER_BIN = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));

/* Direkt über den Node-Entry statt über npx: kein Shell-Aufruf, damit
   keine Deprecation-Warnung und sauberes Beenden auf Windows. */
const child = spawn(
  process.execPath,
  [WRANGLER_BIN, 'dev', '--port', String(PORT), '--local', '--ip', '127.0.0.1'],
  { stdio: ['ignore', 'pipe', 'pipe'] }
);

let serverLog = '';
child.stdout.on('data', (chunk) => { serverLog += chunk; });
child.stderr.on('data', (chunk) => { serverLog += chunk; });

function stop() {
  try {
    if (IS_WIN) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  } catch {
    /* bereits beendet */
  }
}
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(130); });

async function waitForServer(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/api/ping`);
      if (res.ok) return;
    } catch {
      /* noch nicht bereit */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Worker nicht erreichbar.\n${serverLog.slice(-2000)}`);
}

try {
  await waitForServer();

  const ping = await (await fetch(`${BASE}/api/ping`)).json();
  assert.equal(ping.status, 'ok');

  const url = `${BASE}/api/ai?device=${encodeURIComponent(DEVICE)}&debug=1&refresh=1`;
  const response = await fetch(url);
  const bundle = await response.json();
  assert.equal(response.status, 200, JSON.stringify(bundle).slice(0, 600));
  assert.ok(bundle.stats.sources > 0, 'keine Quellen im Bundle');
  assert.ok(bundle.stats.chunks > 0, 'keine Chunks im Bundle');

  const ifixit = bundle.sources.filter((source) => source.type === 'ifixit');
  assert.ok(ifixit.length > 0, 'keine iFixit-Quelle');
  assert.ok(ifixit.every((source) => source.license === 'CC BY-NC-SA 3.0'));

  const tavilyError = (bundle.errors || []).find((error) => error.source === 'websearch');
  console.log('Live-Smoke OK:', JSON.stringify(bundle.stats));
  if (tavilyError) {
    console.log('Hinweis: Tavily lokal ohne Key — übersprungen:', tavilyError.message);
  }
} finally {
  stop();
}
