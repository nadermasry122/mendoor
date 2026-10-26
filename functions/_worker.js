// mendooR Worker – routes /api/* to serverless functions, everything else to static files.
// Requires Secrets Store bindings named GOOGLE_VISION_API_KEY and TAVILY_API_KEY (see wrangler.jsonc).
// KI-Assistenz: Workers-AI-Binding `AI` (ADR D6/D7).

import { searchArchiveItems, searchWebItems } from './sources.js';
import {
  AI_MODEL,
  AI_REQUEST_OPTIONS,
  buildMessages,
  extractAnswer,
  normalizeDevice,
  retrieveSources
} from './rag.js';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── Legacy-MVP-Umschaltung per Query-Parameter ──
    // Beispiele: /?version=legacy · /?legacy=1 · /?utm_content=legacy
    // Leitet – unter Beibehaltung der Parameter – auf die statische
    // Altversion unter /legacy/ um. So lassen sich beide MVPs über eine
    // einzige Live-URL zeigen. Direktaufrufe von /legacy/ bleiben unberührt.
    if (url.pathname === '/' && wantsLegacy(url)) {
      const target = new URL('/legacy/', url);
      target.search = url.search;
      return Response.redirect(target.toString(), 302);
    }

    // ── Health check ──
    if (url.pathname === '/api/ping') {
      return json({
        status: 'ok',
        message: 'mendooR API is live',
        timestamp: new Date().toISOString()
      });
    }

    // ── Cloud Vision proxy ──
    if (url.pathname === '/api/vision') {
      return handleVision(request, env);
    }

    // ── Internet Archive manual/documentation search ──
    if (url.pathname === '/api/archive') {
      return handleArchive(request);
    }

    // ── Tavily web search (trusted-domain articles) ──
    if (url.pathname === '/api/websearch') {
      return handleWebSearch(request, env);
    }

    // ── RAG + Workers AI assistance ──
    if (url.pathname === '/api/ai') {
      return handleAi(request, env);
    }

    // ── Everything else → static files ──
    return env.ASSETS.fetch(request);
  }
};

/* Legacy-MVP-Umschaltung: erkennt u. a. ?version=legacy, ?legacy=1,
   ?utm_content=legacy oder ?utm_campaign=old (siehe fetch-Routing oben). */
const LEGACY_PARAM_KEYS = [
  'version', 'legacy', 'mvp', 'view',
  'utm_content', 'utm_campaign', 'utm_source', 'utm_term'
];
function wantsLegacy(url) {
  for (const key of LEGACY_PARAM_KEYS) {
    const value = url.searchParams.get(key);
    if (value && /^(legacy|old|alt|v1|1)$/i.test(value.trim())) return true;
  }
  return false;
}

/*
  NOTE — Reddit API integration removed 2026-07.
  Reddit's Responsible Builder Policy closed self-service API
  registration; server-side requests without an approved OAuth
  token are rejected with HTTP 403, including from this Worker
  (Cloudflare's datacenter IP ranges are filtered regardless of
  request correctness). See documentation in app.js for the
  link-out replacement (renderCommunityCards / openSubreddit).
  Wayback Machine is not a workaround: Reddit separately blocked
  archive.org from indexing post detail pages and comments.
  Source: support.reddithelp.com/hc/en-us/articles/42728983564564
*/

/* ══════════════════════════════════════════════
   /api/vision – proxies a Base64 image to Google
   Cloud Vision and returns a cleaned result set.
   Body:  { "image": "<base64-without-prefix>" }
   ══════════════════════════════════════════════ */
async function handleVision(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405);
  }

  // Debug flag: ?debug=1 returns the raw Vision response for inspection
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const image = body && body.image;
  if (!image || typeof image !== 'string') {
    return json({ error: 'Missing "image" field (Base64 string expected)' }, 400);
  }

  // Read the secret from the Secrets Store binding
  let apiKey;
  try {
    apiKey = await env.GOOGLE_VISION_API_KEY.get();
  } catch (err) {
    return json({ error: 'API key not configured', detail: err.message }, 500);
  }
  if (!apiKey) {
    return json({ error: 'API key empty' }, 500);
  }

  // Build Google Cloud Vision request
  const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const visionBody = {
    requests: [{
      image: { content: image },
      features: [
        { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
      ]
      // No languageHints — Google's own documentation is explicit that an
      // empty value gives the BEST results, since it enables full automatic
      // language detection. DOCUMENT_TEXT_DETECTION (used here) auto-detects
      // the complete set of supported languages on its own; a hardcoded
      // hint list would only narrow that down and risk actively hurting
      // detection for any device outside the listed languages — the
      // opposite of what a worldwide-usable scanner needs.
      // Source: docs.cloud.google.com/vision/docs/ocr
    }]
  };

  let visionResp;
  try {
    visionResp = await fetch(visionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visionBody)
    });
  } catch (err) {
    return json({ error: 'Vision API unreachable', detail: err.message }, 502);
  }

  if (!visionResp.ok) {
    const errText = await visionResp.text().catch(() => '');
    return json({ error: `Vision API error ${visionResp.status}`, detail: errText.slice(0, 500) }, visionResp.status);
  }

  const data = await visionResp.json().catch(() => null);
  if (!data || !Array.isArray(data.responses) || !data.responses[0]) {
    return json({ error: 'Empty Vision response', raw: data }, 502);
  }

  const r = data.responses[0];
  if (r.error) {
    return json({ error: 'Vision returned error', detail: r.error.message || 'unknown', raw: r }, 502);
  }

  // ── Debug mode: return the complete raw response ──
  if (debug) {
    return json({
      debug: true,
      imageBytes: image.length,
      hasFullTextAnnotation: !!r.fullTextAnnotation,
      hasTextAnnotations: Array.isArray(r.textAnnotations) && r.textAnnotations.length > 0,
      fullText: r.fullTextAnnotation?.text || null,
      textAnnotations: (r.textAnnotations || []).slice(0, 20).map(t => ({
        description: t.description,
        locale: t.locale
      })),
      rawResponse: r
    });
  }

  // ── Normal mode: bereinigte Antwort für die App ──
  const fullText = (r.fullTextAnnotation && r.fullTextAnnotation.text) || '';
  const words = [];

  const pages = (r.fullTextAnnotation && r.fullTextAnnotation.pages) || [];
  for (const page of pages) {
    for (const block of (page.blocks || [])) {
      for (const paragraph of (block.paragraphs || [])) {
        for (const word of (paragraph.words || [])) {
          const text = (word.symbols || []).map(s => s.text || '').join('');
          if (!text) continue;
          words.push({
            text,
            confidence: Math.round(((word.confidence ?? 0)) * 100)
          });
        }
      }
    }
  }

  return json({
    text: fullText.trim(),
    words,
    provider: 'google-cloud-vision'
  });
}

/* Helper — JSON response with CORS headers (optional extra headers) */
function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extraHeaders }
  });
}

/* ══════════════════════════════════════════════
   /api/archive – searches the Internet Archive's
   "texts" collection for scanned manuals and product
   documentation matching a device name.

   Unlike Reddit, archive.org runs a genuinely open,
   documented, no-auth search API intended for exactly
   this kind of use. It has no CORS headers though, so
   the browser can't call it directly — that's the only
   reason this goes through the Worker, not a usage
   restriction on Archive.org's side.

   Docs: https://archive.org/help/aboutsearch.htm
   Query:  /api/archive?q=iPhone+14+Pro
   ══════════════════════════════════════════════ */
async function handleArchive(request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  if (!q) {
    return json({ error: 'Missing query parameter "q"' }, 400);
  }

  try {
    const items = await searchArchiveItems(q);
    return json({ query: q, count: items.length, items });
  } catch (err) {
    return json(
      { error: err.message || 'Archive.org error', detail: err.detail },
      err.status || 502
    );
  }
}

/* ══════════════════════════════════════════════
   /api/websearch – proxies a query to Tavily,
   restricted server-side to a curated list of
   trusted German tech/repair domains.

   Why Tavily: Google's Custom Search JSON API is
   closed to new customers (retires 2027-01-01); its
   suggested successor, Vertex AI Search, bills from
   the first query with no free tier at all. A public
   SearXNG instance was tested and returned 403 — most
   public instances disable their JSON API specifically
   to block automated callers, the same wall Reddit's
   API hit. Tavily's free plan (1,000 searches/month,
   renews monthly, no card required at signup) was the
   only option found that can't silently start billing
   the account — see docs.tavily.com/documentation/api-reference/endpoint/search.

   Query:  /api/websearch?q=iPhone+14+Pro
   ══════════════════════════════════════════════ */
async function handleWebSearch(request, env) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  if (!q) {
    return json({ error: 'Missing query parameter "q"' }, 400);
  }

  try {
    const items = await searchWebItems(q, env);
    return json({ query: q, count: items.length, items });
  } catch (err) {
    return json(
      { error: err.message || 'Tavily error', detail: err.detail },
      err.status || 502
    );
  }
}

/* ══════════════════════════════════════════════
   /api/ai – RAG + Workers AI (ADR D6/D7)

   Body: { "device": "iPhone 14" }
   Query: ?debug=1 liefert nur Retrieval + Prompt, ohne AI-Aufruf.

   Ablauf: Quellen serverseitig abrufen (iFixit, Archiv, Tavily),
   normalisieren/begrenzen, strikt quellengebundenen Prompt bauen und
   erst dann das Modell aufrufen. Ohne Quellen keine generative Antwort.
   ══════════════════════════════════════════════ */
async function handleAi(request, env) {
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';
  let device = '';

  if (request.method === 'GET') {
    device = normalizeDevice(url.searchParams.get('device'));
    if (!device) {
      return json(
        {
          error: 'Missing "device" query parameter',
          hint: 'Use POST with JSON { "device": "..." } for an AI answer. Debug: GET /api/ai?device=iPhone%2014&debug=1'
        },
        400
      );
    }
    if (!debug) {
      return json(
        {
          error: 'GET is only supported for debug=1',
          hint: 'Use POST with JSON { "device": "..." } for an AI answer.'
        },
        405,
        { Allow: 'POST' }
      );
    }
  } else if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    device = normalizeDevice(body && body.device);
    if (!device) {
      return json({ error: 'Missing or invalid "device" field' }, 400);
    }
  } else {
    return json(
      { error: 'Method not allowed. Use POST (or GET with ?debug=1).' },
      405,
      { Allow: 'POST, GET' }
    );
  }

  // Retrieval darf auch im Debug-Modus ohne AI-Binding laufen.
  if (!debug && !env.AI) {
    return json(
      { error: 'Workers AI binding not configured', code: 'AI_BINDING_MISSING' },
      503,
      { 'Cache-Control': 'no-store' }
    );
  }

  let retrieval;
  try {
    retrieval = await retrieveSources(device, env);
  } catch (err) {
    return json(
      { error: 'Source retrieval failed', detail: err.message },
      502,
      { 'Cache-Control': 'no-store' }
    );
  }

  const { query, sources, errors } = retrieval;

  if (debug) {
    return json(
      {
        debug: true,
        model: AI_MODEL,
        query,
        sources,
        errors,
        messages: sources.length > 0 ? buildMessages(device, sources) : []
      },
      200,
      { 'Cache-Control': 'no-store' }
    );
  }

  if (sources.length === 0) {
    return json(
      { answer: null, reason: 'no_sources', query, sources: [], errors },
      200,
      { 'Cache-Control': 'no-store' }
    );
  }

  const messages = buildMessages(device, sources);

  let result;
  let timeoutTimer;
  try {
    const timeout = new Promise((_, reject) => {
      timeoutTimer = setTimeout(() => reject(new Error('AI timeout after 30s')), 30000);
    });

    // Primär mit gpt-oss-Reasoning; falls die Laufzeit den optionalen
    // Parameter ablehnt, einmal ohne ihn wiederholen.
    const aiCall = (async () => {
      try {
        return await env.AI.run(AI_MODEL, { messages, ...AI_REQUEST_OPTIONS });
      } catch (err) {
        if (!/reasoning|unsupported|invalid|unexpected/i.test(err.message || '')) throw err;
        return env.AI.run(AI_MODEL, { messages, max_tokens: 800, temperature: 0.2 });
      }
    })();

    result = await Promise.race([aiCall, timeout]);
  } catch (err) {
    const timeout = /timeout/i.test(err.message || '');
    return json(
      {
        error: timeout ? 'Workers AI timeout' : 'Workers AI request failed',
        code: timeout ? 'AI_TIMEOUT' : 'AI_ERROR',
        detail: err.message
      },
      timeout ? 504 : 502,
      { 'Cache-Control': 'no-store' }
    );
  } finally {
    clearTimeout(timeoutTimer);
  }

  const answer = extractAnswer(result);
  if (!answer) {
    return json(
      { error: 'Empty AI response', code: 'AI_EMPTY' },
      502,
      { 'Cache-Control': 'no-store' }
    );
  }

  return json(
    {
      answer,
      model: AI_MODEL,
      query,
      sources: sources.map(({ id, type, title, url, meta, kind }) => ({ id, type, title, url, meta, ...(kind ? { kind } : {}) })),
      retrievedAt: new Date().toISOString(),
      usage: result && result.usage ? result.usage : null
    },
    200,
    { 'Cache-Control': 'no-store' }
  );
}
