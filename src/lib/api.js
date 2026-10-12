/* ══════════════════════════════════════════════════════════════
   Datenzugriff — gebündelt in einer Schicht.
   Alle schlüsselpflichtigen Dienste laufen über den Worker (ADR A3);
   nur iFixit wird direkt angesprochen (öffentliche, CORS-fähige API).
   ══════════════════════════════════════════════════════════════ */
import { bestSearchTerm, buildQueryCascade } from './search.js';

const IFIXIT_API = 'https://www.ifixit.com/api/2.0';
const VISION_ENDPOINT = '/api/vision';
const ARCHIVE_ENDPOINT = '/api/archive';
const WEBSEARCH_ENDPOINT = '/api/websearch';

/* Debug-Modus: ?debug=1 in der URL. */
export const DEBUG_MODE =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('debug') === '1';

/* ── OCR: Bild an Cloud Vision (über Worker) ── */
export async function recognizeImage(base64, debug = DEBUG_MODE) {
  const endpoint = debug ? `${VISION_ENDPOINT}?debug=1` : VISION_ENDPOINT;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const e = new Error(err.error || `HTTP ${resp.status}`);
    e.httpStatus = resp.status;
    e.detail = err;
    throw e;
  }
  return resp.json();
}

/* ── iFixit ── */
async function searchGuides(query) {
  const url = `${IFIXIT_API}/search/${encodeURIComponent(query)}?doctypes=guide&limit=15`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`iFixit API ${res.status}`);
  const data = await res.json();
  return (data.results || []).filter((r) => r.dataType === 'guide');
}

/* Kaskade von spezifisch zu breit — liefert, sobald etwas kommt. */
export async function searchGuidesForDevice(device) {
  for (const q of buildQueryCascade(device)) {
    const results = await searchGuides(q);
    if (results && results.length > 0) return results;
  }
  return [];
}

/* Guide-Detail: erst deutsche Fassung, sonst Ausgangssprache. */
export async function fetchGuideDetail(guideId) {
  let guide = null;
  try {
    const resDe = await fetch(`${IFIXIT_API}/guides/${guideId}?langid=de`, {
      headers: { Accept: 'application/json' },
    });
    if (resDe.ok) guide = await resDe.json();
  } catch {
    /* Fallback unten */
  }
  if (!guide) {
    const resSrc = await fetch(`${IFIXIT_API}/guides/${guideId}?useSourceLang=1`, {
      headers: { Accept: 'application/json' },
    });
    if (!resSrc.ok) throw new Error(`iFixit API ${resSrc.status}`);
    guide = await resSrc.json();
  }
  return guide;
}

/* ── Internet Archive (über Worker — CORS) ── */
export async function searchArchive(device) {
  const term = bestSearchTerm(device);
  const res = await fetch(`${ARCHIVE_ENDPOINT}?q=${encodeURIComponent(term)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Archive API ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

/* ── Web-Suche via Tavily (über Worker) ── */
export async function searchWeb(device) {
  const term = bestSearchTerm(device);
  const res = await fetch(`${WEBSEARCH_ENDPOINT}?q=${encodeURIComponent(term)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Websearch API ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

/* Fallback: site-beschränkte Google-Suche (Link-out statt API). */
export function buildSiteRestrictedSearchUrl(device, domains) {
  const term = bestSearchTerm(device);
  const siteFilter = `(${domains.map((d) => `site:${d}`).join(' OR ')})`;
  return `https://www.google.com/search?q=${encodeURIComponent(`${term} Reparatur ${siteFilter}`)}`;
}

/* ── Reddit-Link-outs (kein API-Call, ADR D2) ── */
export function buildSubredditSearchUrl(subreddit, device) {
  const term = bestSearchTerm(device);
  return (
    `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search/` +
    `?q=${encodeURIComponent(term)}&restrict_sr=1`
  );
}
