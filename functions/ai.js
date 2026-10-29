/* ══════════════════════════════════════════════════════════════
   mendooR — /api/ai: fragebezogener Reparaturassistent (ADR D9)

   POST { device, question?, rawText?, history?, refresh? }
     → Kontext-Bundle (Cache, Stufe 1) → Chunk-Auswahl → Workers AI
     → validierte, belegte Antwort mit Schritten und Bildern

   GET  ?device=…&debug=1[&refresh=1]
     → nur Kontext-Bundle (Zahlen, Quellen, Schritte, Bilder) ohne KI

   POST ?debug=1
     → Bundle + ausgewählte Chunks + Prompt, ohne KI-Aufruf
   ══════════════════════════════════════════════════════════════ */
import { getBundle } from './bundle.js';
import { json } from './http.js';
import { redactIdentifiers } from './redact.js';
import {
  AI_MODEL,
  AI_REQUEST_OPTIONS,
  buildAskMessages,
  detectDeviceVariant,
  extractAnswer,
  normalizeDevice,
  normalizeHistory,
  normalizeQuestion,
  resolveAnswer,
  selectChunks,
} from './rag.js';

const AI_TIMEOUT_MS = 60000;

/* Best-effort-Limit gegen Missbrauch des offenen Endpunkts. Die Cache
   API ist pro Colo, nicht global — für einen dauerhaften Zähler wären
   KV oder Durable Objects nötig (dokumentierte Grenze, ADR D9). */
const RATE_LIMIT = { windowSeconds: 600, max: 20, cacheName: 'mendoor-rate-v1' };

async function checkRateLimit(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const bucket = Math.floor(Date.now() / (RATE_LIMIT.windowSeconds * 1000));
  const key = `https://mendoor.cache/rate/${encodeURIComponent(ip)}/${bucket}`;

  try {
    const cache = await caches.open(RATE_LIMIT.cacheName);
    const hit = await cache.match(key);
    const count = (hit ? Number(await hit.text()) : 0) + 1;

    await cache.put(
      key,
      new Response(String(count), {
        headers: { 'Cache-Control': `max-age=${RATE_LIMIT.windowSeconds}` },
      })
    );

    return {
      ok: count <= RATE_LIMIT.max,
      remaining: Math.max(0, RATE_LIMIT.max - count),
      retryAfter: RATE_LIMIT.windowSeconds,
    };
  } catch {
    /* Ohne Cache lieber durchlassen als fälschlich blockieren. */
    return { ok: true, remaining: null, retryAfter: 0 };
  }
}

function bundleSummary(bundle, cached) {
  return {
    version: bundle.version,
    cached,
    device: bundle.device,
    query: bundle.query,
    createdAt: bundle.createdAt,
    ocr: bundle.ocr ? `${bundle.ocr.slice(0, 200)}${bundle.ocr.length > 200 ? '…' : ''}` : '',
    stats: bundle.stats,
    errors: bundle.errors,
  };
}

export async function handleAi(request, env) {
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';
  const refreshParam = url.searchParams.get('refresh') === '1';

  /* ── GET: nur Diagnose ── */
  if (request.method === 'GET') {
    const device = normalizeDevice(url.searchParams.get('device'));
    if (!device) {
      return json(
        {
          error: 'Missing "device" query parameter',
          hint: 'Debug: GET /api/ai?device=iPhone%2014&debug=1 · Antwort: POST { "device": "…", "question": "…" }',
        },
        400
      );
    }
    if (!debug) {
      return json(
        {
          error: 'GET is only supported for debug=1',
          hint: 'Use POST with JSON { "device": "…", "question": "…" } for an answer.',
        },
        405,
        { Allow: 'POST' }
      );
    }

    try {
      const { bundle, cached } = await getBundle(device, env, { refresh: refreshParam });
      return json(
        {
          debug: true,
          ...bundleSummary(bundle, cached),
          full: url.searchParams.get('full') === '1',
          sources: bundle.sources,
          steps: bundle.steps.slice(0, 30),
          images: bundle.images.slice(0, 30),
          ...(url.searchParams.get('full') === '1'
            ? { chunks: bundle.chunks }
            : { chunkPreview: bundle.chunks.slice(0, 5) }),
        },
        200,
        { 'Cache-Control': 'no-store' }
      );
    } catch (err) {
      return json(
        { error: 'Bundle build failed', detail: err.message },
        502,
        { 'Cache-Control': 'no-store' }
      );
    }
  }

  if (request.method !== 'POST') {
    return json(
      { error: 'Method not allowed. Use POST (or GET with ?debug=1).' },
      405,
      { Allow: 'POST, GET' }
    );
  }

  /* ── POST: Frage beantworten ── */
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const device = normalizeDevice(body && body.device);
  if (!device) {
    return json({ error: 'Missing or invalid "device" field' }, 400);
  }

  const question = normalizeQuestion(body && body.question);
  const history = normalizeHistory(body && body.history);
  /* Datenminimierung: Seriennummer/MAC/IMEI verlassen den Worker nicht. */
  const rawText = redactIdentifiers(body && body.rawText);
  const refresh = refreshParam || (body && body.refresh === true);

  const rate = await checkRateLimit(request);
  if (!rate.ok) {
    return json(
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMITED',
        hint: 'Bitte in einigen Minuten erneut versuchen.',
      },
      429,
      { 'Retry-After': String(rate.retryAfter), 'Cache-Control': 'no-store' }
    );
  }

  if (!debug && !env.AI) {
    return json(
      { error: 'Workers AI binding not configured', code: 'AI_BINDING_MISSING' },
      503,
      { 'Cache-Control': 'no-store' }
    );
  }

  let bundleResult;
  try {
    bundleResult = await getBundle(device, env, { rawText, refresh });
  } catch (err) {
    return json(
      { error: 'Source retrieval failed', detail: err.message },
      502,
      { 'Cache-Control': 'no-store' }
    );
  }

  const { bundle, cached } = bundleResult;

  if (!bundle.chunks.length) {
    return json(
      {
        answer: null,
        status: 'not_covered',
        reason: 'no_sources',
        query: bundle.query,
        deviceHint: null,
        sources: [],
        steps: [],
        images: [],
        errors: bundle.errors,
      },
      200,
      { 'Cache-Control': 'no-store' }
    );
  }

  const chunks = selectChunks(bundle, question);
  if (chunks.length === 0) {
    return json(
      {
        answer: null,
        status: 'not_covered',
        reason: 'no_matching_chunks',
        query: bundle.query,
        deviceHint: null,
        sources: [],
        steps: [],
        images: [],
        errors: bundle.errors,
      },
      200,
      { 'Cache-Control': 'no-store' }
    );
  }

  const messages = buildAskMessages({
    device,
    ocr: bundle.ocr,
    question,
    history,
    chunks,
    sources: bundle.sources,
  });

  if (debug) {
    return json(
      {
        debug: true,
        model: AI_MODEL,
        ...bundleSummary(bundle, cached),
        selectedChunks: chunks,
        messages,
      },
      200,
      { 'Cache-Control': 'no-store' }
    );
  }

  let result;
  let timeoutTimer;
  try {
    const timeout = new Promise((_, reject) => {
      timeoutTimer = setTimeout(() => reject(new Error(`AI timeout after ${AI_TIMEOUT_MS / 1000}s`)), AI_TIMEOUT_MS);
    });

    /* Primär mit gpt-oss-Reasoning; lehnt die Laufzeit den optionalen
       Parameter ab, einmal ohne ihn wiederholen. */
    const aiCall = (async () => {
      try {
        return await env.AI.run(AI_MODEL, { messages, ...AI_REQUEST_OPTIONS });
      } catch (err) {
        if (!/reasoning|unsupported|invalid|unexpected/i.test(err.message || '')) throw err;
        return env.AI.run(AI_MODEL, {
          messages,
          max_tokens: AI_REQUEST_OPTIONS.max_tokens,
          temperature: AI_REQUEST_OPTIONS.temperature,
        });
      }
    })();

    result = await Promise.race([aiCall, timeout]);
  } catch (err) {
    const timeout = /timeout/i.test(err.message || '');
    return json(
      {
        error: timeout ? 'Workers AI timeout' : 'Workers AI request failed',
        code: timeout ? 'AI_TIMEOUT' : 'AI_ERROR',
        detail: err.message,
      },
      timeout ? 504 : 502,
      { 'Cache-Control': 'no-store' }
    );
  } finally {
    clearTimeout(timeoutTimer);
  }

  const raw = extractAnswer(result);
  if (!raw) {
    return json({ error: 'Empty AI response', code: 'AI_EMPTY' }, 502, {
      'Cache-Control': 'no-store',
    });
  }

  const resolved = resolveAnswer(raw, { bundle, chunks });
  const deviceHint = resolved.status === 'not_covered' ? null : detectDeviceVariant(device, bundle);

  return json(
    {
      ...resolved,
      deviceHint,
      model: AI_MODEL,
      query: bundle.query,
      cached,
      context: {
        chunks: chunks.length,
        sources: bundle.sources.length,
        images: bundle.images.length,
        steps: bundle.steps.length,
      },
      retrievedAt: new Date().toISOString(),
      usage: result && result.usage ? result.usage : null,
      remaining: rate.remaining,
      errors: bundle.errors,
    },
    200,
    { 'Cache-Control': 'no-store' }
  );
}
