// mendooR Worker – routes /api/* to serverless functions, everything else to static files.
// Requires a Secrets Store binding named GOOGLE_VISION_API_KEY (see wrangler.jsonc).

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

    // ── Everything else → static files (index.html, styles.css, app.js) ──
    return env.ASSETS.fetch(request);
  }
};

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
      ],
      // Hint: languages we expect on type plates
      // Language hints improve accuracy but don't restrict detection —
      // Vision can still read other languages without a hint. 'zh' added
      // because manufacturer type plates sometimes carry Chinese compliance
      // markings (e.g. CCC certification) alongside the Latin-script model
      // data; this doesn't hurt Latin-script recognition.
      imageContext: { languageHints: ['en', 'de', 'zh'] }
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

/* Helper — JSON response with CORS headers */
function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
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

  // Restrict to scanned text documents (manuals, catalogs) rather than
  // audio/video/software, and require the term to appear in the title
  // for relevance rather than matching any metadata field.
  const query = `title:(${q}) AND mediatype:texts`;

  const archiveUrl =
    `https://archive.org/advancedsearch.php` +
    `?q=${encodeURIComponent(query)}` +
    `&fl[]=identifier&fl[]=title&fl[]=year&fl[]=description` +
    `&rows=12&page=1&output=json`;

  let resp;
  try {
    resp = await fetch(archiveUrl, { headers: { 'Accept': 'application/json' } });
  } catch (err) {
    return json({ error: 'Archive.org unreachable', detail: err.message }, 502);
  }

  if (!resp.ok) {
    return json({ error: `Archive.org error ${resp.status}` }, resp.status);
  }

  const data = await resp.json().catch(() => null);
  const docs = data?.response?.docs;
  if (!Array.isArray(docs)) {
    return json({ error: 'Unexpected Archive.org response' }, 502);
  }

  const items = docs
    .filter(d => d && d.identifier && d.title)
    .map(d => ({
      identifier: d.identifier,
      title:      d.title,
      year:       d.year || null,
      url:        `https://archive.org/details/${d.identifier}`,
      thumbnail:  `https://archive.org/services/img/${d.identifier}`
    }));

  return json({ query: q, count: items.length, items });
}