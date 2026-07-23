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

    // ── Reddit community search ──
    if (url.pathname === '/api/reddit') {
      return handleReddit(request);
    }

    // ── Everything else → static files (index.html, styles.css, app.js) ──
    return env.ASSETS.fetch(request);
  }
};

/* ══════════════════════════════════════════════
   /api/reddit – searches repair-related subreddits.
   Reddit blocks direct browser calls (CORS + UA),
   so the Worker acts as proxy.
   Query:  /api/reddit?q=iPhone+14+Pro
   ══════════════════════════════════════════════ */

// Subreddits worth searching for repair/reuse topics
const REPAIR_SUBS = [
  'fixit',
  'repair',
  'electronics',
  'techsupport',
  'mobilerepair',
  'laptops',
  'AskElectronics',
  'ifixit',
  'buildapc',
  'homelab',
  'de_EDV'
].join('+');

async function handleReddit(request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  if (!q) {
    return json({ error: 'Missing query parameter "q"' }, 400);
  }

  // Reddit's public search endpoint, restricted to the repair subreddits
  const redditUrl =
    `https://www.reddit.com/r/${REPAIR_SUBS}/search.json` +
    `?q=${encodeURIComponent(q)}` +
    `&restrict_sr=1&sort=relevance&t=all&limit=25&raw_json=1`;

  let resp;
  try {
    resp = await fetch(redditUrl, {
      headers: {
        // Reddit rejects requests without a descriptive User-Agent
        'User-Agent': 'web:mendooR:v1.0 (educational e-waste repair project)',
        'Accept': 'application/json'
      }
    });
  } catch (err) {
    return json({ error: 'Reddit unreachable', detail: err.message }, 502);
  }

  if (!resp.ok) {
    return json({ error: `Reddit error ${resp.status}` }, resp.status);
  }

  const data = await resp.json().catch(() => null);
  const children = data?.data?.children;
  if (!Array.isArray(children)) {
    return json({ error: 'Unexpected Reddit response' }, 502);
  }

  // Reduce to what the UI actually needs
  const posts = children
    .map(c => c.data)
    .filter(p => p && !p.over_18 && !p.stickied)
    .map(p => ({
      id:        p.id,
      title:     p.title || '',
      subreddit: p.subreddit || '',
      score:     p.score ?? 0,
      comments:  p.num_comments ?? 0,
      created:   p.created_utc ?? 0,
      url:       'https://www.reddit.com' + (p.permalink || ''),
      snippet:   (p.selftext || '').replace(/\s+/g, ' ').trim().slice(0, 220),
      flair:     p.link_flair_text || null,
      thumb:     (p.thumbnail && p.thumbnail.startsWith('http')) ? p.thumbnail : null
    }))
    // Community-verified answers first: score, then discussion volume
    .sort((a, b) => (b.score - a.score) || (b.comments - a.comments))
    .slice(0, 15);

  return json({ query: q, count: posts.length, posts });
}

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
      imageContext: { languageHints: ['en', 'de'] }
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