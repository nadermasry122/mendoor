/* ══════════════════════════════════════════════════════════════
   mendooR — Quellen-Retrieval für die RAG-Schicht (ADR D6/D7)

   Diese Datei bündelt die serverseitigen Abrufe der drei bestehenden
   Quellen. Sie wird sowohl von den klassischen /api-Endpunkten als auch
   von der KI-Assistenz (/api/ai) genutzt, damit Retrieval, Filterung und
   Fehlerbehandlung an genau einer Stelle liegen.

   Keine Secrets im Code: Tavily wird ausschließlich über das
   Secrets-Store-Binding `env.TAVILY_API_KEY` gelesen.
   ══════════════════════════════════════════════════════════════ */

export class SourceError extends Error {
  constructor(message, status = 502, detail = '') {
    super(message);
    this.name = 'SourceError';
    this.status = status;
    this.detail = detail;
  }
}

/* ── Suchbegriff: dieselbe Regel wie im Client (ADR D5) ── */
export function isModelCodeToken(token) {
  const hasLetter = /[A-Za-z]/.test(token);
  const hasDigit = /\d/.test(token);
  return token.length >= 6 && hasLetter && hasDigit;
}

export function bestSearchTerm(deviceName) {
  const clean = String(deviceName || '').trim().replace(/\s+/g, ' ');
  const tokens = clean.split(' ').filter(Boolean);
  if (tokens.length <= 1) return clean;

  const kept = tokens.filter((t) => !isModelCodeToken(t));
  /* Nur noch ein Wort übrig (meist die Marke): Der Code ist dann der
     einzige gerätespezifische Bestandteil und bleibt erhalten. */
  if (kept.length <= 1) return clean;
  return kept.slice(0, 4).join(' ');
}

export function buildQueryCascade(device) {
  const clean = String(device || '').trim().replace(/\s+/g, ' ');
  const tokens = clean.split(' ').filter(Boolean);
  const cascade = [clean];

  if (tokens.length > 2) cascade.push(tokens.slice(0, 2).join(' '));
  if (tokens.length > 1) cascade.push(tokens[0]);

  tokens.forEach((t) => {
    if (/^[A-Z]{1,4}\d{2,6}[A-Z]{0,4}$/i.test(t) && !cascade.includes(t)) cascade.push(t);
  });

  return [...new Set(cascade)];
}

/* ── Text-Helfer ── */
export function truncate(value, max = 420) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatDuration(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return '';
  if (s >= 3600) {
    const hours = Math.round((s / 3600) * 10) / 10;
    return `${String(hours).replace('.', ',')} Std.`;
  }
  return `${Math.max(1, Math.round(s / 60))} Min.`;
}

export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/* ══════════════════════════════════════════════════════════════
   iFixit — öffentliche, CORS-fähige API. Die Kaskade entspricht der
   Client-Logik (ADR D1/D5), damit die KI dieselbe Trefferbasis sieht.
   ══════════════════════════════════════════════════════════════ */

/* Häufige Füllwörter, die für den Geräteabgleich nichts aussagen. */
const QUERY_STOP_TOKENS = new Set([
  'der', 'die', 'das', 'und', 'für', 'fur', 'mit', 'von', 'the', 'and', 'for', 'with',
  'model', 'modell', 'typ', 'type', 'guide', 'anleitung', 'repair', 'reparatur',
  'replacement', 'austausch', 'series', 'serie', 'pro', 'max', 'plus', 'ultra', 'mini',
  '5g', '4g', 'lte', 'wifi',
]);

function queryTokens(query) {
  return String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9äöüß]+/)
    .filter((token) => !QUERY_STOP_TOKENS.has(token) && (token.length >= 2 || /^\d$/.test(token)));
}

/*
 * iFixit sucht unscharf: „A2890“ liefert z. B. Anleitungen für ein
 * Samsung SCH-A890, „A2251“ einen Shark-Staubsauger. Solche Treffer sind
 * für die KI schädlicher als keine Treffer, weil das Modell sie sonst
 * brav zusammenfasst. Wir behalten nur Guides, deren Titel/Subject/Kategorie
 * alle aussagekräftigen Token des Gerätenamens enthalten.
 */
function isRelevantGuide(query, guide) {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return true;
  const haystack = `${guide.title || ''} ${guide.subject || ''} ${guide.category || ''}`.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

export async function searchIfixitGuides(device) {
  for (const query of buildQueryCascade(device)) {
    const url =
      `https://www.ifixit.com/api/2.0/search/${encodeURIComponent(query)}` +
      `?doctypes=guide&limit=6`;

    let resp;
    try {
      resp = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (err) {
      throw new SourceError('iFixit unreachable', 502, err.message);
    }

    if (!resp.ok) {
      throw new SourceError(`iFixit API ${resp.status}`, resp.status >= 500 ? 502 : resp.status);
    }

    const data = await resp.json().catch(() => null);
    const guides = Array.isArray(data?.results)
      ? data.results.filter(
          (r) =>
            r &&
            r.dataType === 'guide' &&
            r.guideid &&
            r.title &&
            isRelevantGuide(device, r)
        )
      : [];

    if (guides.length > 0) return guides;
  }

  return [];
}

/* ══════════════════════════════════════════════════════════════
   Internet Archive — Advanced Search API. Offen, dokumentiert und
   authentifizierungsfrei; der Worker ist nur wegen fehlender CORS-Header
   nötig. Für die KI werden offensichtliche Nicht-Dokumente (z. B.
   Gerichtsakten aus PACER) herausgefiltert.
   ══════════════════════════════════════════════════════════════ */
const IRRELEVANT_ARCHIVE = /\b(pacer|docket|lawsuit|court|seized|seizure|exhibit|united states v\.)\b/i;

function isRelevantArchiveDoc(doc) {
  if (!doc || !doc.identifier || !doc.title) return false;
  const text = `${doc.title} ${stripHtml(doc.description || '')}`;
  return !IRRELEVANT_ARCHIVE.test(text);
}

export async function searchArchiveItems(query) {
  const archiveQuery = `title:(${query}) AND mediatype:texts`;
  const archiveUrl =
    'https://archive.org/advancedsearch.php' +
    `?q=${encodeURIComponent(archiveQuery)}` +
    '&fl[]=identifier&fl[]=title&fl[]=year&fl[]=description' +
    '&rows=12&page=1&output=json';

  let resp;
  try {
    resp = await fetch(archiveUrl, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new SourceError('Archive.org unreachable', 502, err.message);
  }

  if (!resp.ok) {
    throw new SourceError(`Archive.org error ${resp.status}`, resp.status >= 500 ? 502 : resp.status);
  }

  const data = await resp.json().catch(() => null);
  const docs = data?.response?.docs;
  if (!Array.isArray(docs)) {
    throw new SourceError('Unexpected Archive.org response', 502);
  }

  return docs
    .filter(isRelevantArchiveDoc)
    .slice(0, 6)
    .map((d) => ({
      identifier: d.identifier,
      title: stripHtml(d.title),
      year: d.year || null,
      description: truncate(stripHtml(d.description || ''), 420),
      url: `https://archive.org/details/${encodeURIComponent(d.identifier)}`,
      thumbnail: `https://archive.org/services/img/${encodeURIComponent(d.identifier)}`,
    }));
}

/* ══════════════════════════════════════════════════════════════
   Websuche — offene Tavily-Suche mit Intent- und Trust-Ranking
   (ADR D8). Keine Domain-Allowlist mehr: Recall kommt aus der
   offenen Suche, Precision aus dem Ranking. Nur eindeutiger Müll
   (Marktplätze, Preisvergleiche, Shops, Such-/SEO-Seiten) wird
   über eine Denylist entfernt. Gründe für Tavily: siehe ADR D4.
   ══════════════════════════════════════════════════════════════ */

/* Marken-Inferenz: Produktlinien ohne explizite Marke werden einer
   Marke zugeordnet (z. B. „Latitude“ → Dell). Nur ein kuratierter,
   kleiner Satz — er verbessert die Query, ist aber keine vollständige
   Herstellerdatenbank (ADR D8, Stufe A). */
const BRAND_HINTS = [
  [/latitude|inspiron|xps|optiplex|precision/i, 'Dell'],
  [/thinkpad|ideapad|legion|yoga|thinkcentre/i, 'Lenovo'],
  [/pavilion|omen|elitebook|probook|spectre/i, 'HP'],
  [/macbook|iphone|ipad|imac|mac mini|mac pro|apple watch|airpods/i, 'Apple'],
  [/surface/i, 'Microsoft'],
  [/galaxy|odyssey/i, 'Samsung'],
  [/vaio|playstation|bravia|xperia|wh-1000|wh1000/i, 'Sony'],
  [/pixel|nest|chromecast/i, 'Google'],
  [/kindle|echo|firestick|fire stick/i, 'Amazon'],
  [/roomba/i, 'iRobot'],
  [/senseo/i, 'Philips'],
  [/nespresso/i, 'DeLonghi'],
];

const KNOWN_BRANDS = new Set([
  'apple', 'samsung', 'dell', 'lenovo', 'hp', 'hewlett packard', 'sony',
  'microsoft', 'asus', 'acer', 'lg', 'xiaomi', 'huawei', 'oneplus',
  'google', 'amazon', 'bosch', 'siemens', 'miele', 'philips', 'grundig',
  'toshiba', 'panasonic', 'jvc', 'daikin', 'vaillant', 'viessmann',
  'mitsubishi', 'electrolux', 'aeg', 'bauknecht', 'whirlpool', 'jura',
  'delonghi', 'de longhi', 'nespresso', 'sennheiser', 'bose', 'jbl',
  'anker', 'gopro', 'canon', 'nikon', 'fujifilm', 'olympus', 'pentax',
  'gigabyte', 'msi', 'razer', 'nokia', 'motorola', 'zte', 'oppo', 'vivo',
]);

export function inferBrand(device) {
  const text = String(device || '');
  for (const [pattern, brand] of BRAND_HINTS) {
    if (pattern.test(text)) return brand;
  }
  const lower = text.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (brand.length >= 3 && lower.includes(brand)) return brand.charAt(0).toUpperCase() + brand.slice(1);
  }
  return '';
}

function brandToken(brand) {
  return String(brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/* Offene Suche: Query mit Marke (falls inferiert) und bilingualen
   Dokumentations-/Reparaturbegriffen (ADR D8, Stufe A). */
export function buildWebQuery(base, brand) {
  const clean = String(base || '').trim();
  const bt = brandToken(brand);
  const prefix = bt && !clean.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ` : '';
  return `${prefix}${clean} Reparatur Bedienungsanleitung service manual`.trim();
}

export function buildSecondWebQuery(base, brand) {
  const clean = String(base || '').trim();
  const bt = brandToken(brand);
  const prefix = bt && !clean.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ` : '';
  return `${prefix}${clean} teardown Zerlegen Ersatzteile`.trim();
}

/* Intent: Dokumentations- ODER Reparaturabsicht im Titel. */
const DOC_HINT = /(service.?manual|service.?anleitung|owner.?s?.?manual|user.?manual|user.?guide|bedienungsanleitung|betriebsanleitung|gebrauchsanweisung|handbuch|manual|schematic|schaltplan)/i;
const REPAIR_HINT = /(reparatur|instandsetzung|repair|teardown|zerleg|disassembly|demontage|anleitung|austausch|auswechseln|ersetzen|tausch|akku|batterie|display|bildschirm|defekt|fehler|problem|beheben|wartung|diagnose|\bfix\b|how\s?to)/i;
const INTENT_HINT = /(service.?manual|service.?anleitung|owner.?s?.?manual|user.?manual|user.?guide|bedienungsanleitung|betriebsanleitung|gebrauchsanweisung|handbuch|manual|schematic|schaltplan|reparatur|instandsetzung|repair|teardown|zerleg|disassembly|demontage|anleitung|austausch|auswechseln|ersetzen|tausch|akku|batterie|display|bildschirm|defekt|fehler|problem|beheben|wartung|diagnose|\bfix\b|how\s?to)/i;

/* Eindeutiger Müll: Marktplätze, Preisvergleiche, Shops, SEO-/Suchseiten. */
const DENY_DOMAIN = /(amazon|ebay|alibaba|aliexpress|dhgate|banggood|fruugo|geizhals|idealo|billiger|guenstiger|preisvergleich|mediamarkt|saturn|otto|kaufland|wish|etsy|shopping|\.shop\b|shop\.)/i;
const NOISE_TITLE = /(\bim test\b|testbericht|preisvergleich|\bab \d+[.,]\d+\s*€|kaufen|bestellen|angebot|deal|schnäppchen|schnaeppchen|rabatt|\bsuche\b|\bsearch\b)/i;
const NOISE_URL = /(^|\/)(search|suche)(\/|$)|preisvergleich/i;

/* Für Web-Treffer zählen auch Modellzusätze wie Pro/Max/Ultra, damit
   „iPhone 14 Pro“ nicht durch einen „iPhone 14 Plus“-Artikel ersetzt wird. */
const WEB_STOP_TOKENS = new Set([
  'der', 'die', 'das', 'und', 'für', 'fur', 'mit', 'von', 'the', 'and', 'for', 'with',
  'model', 'modell', 'typ', 'type', 'guide', 'anleitung', 'repair', 'reparatur',
  'replacement', 'austausch', 'series', 'serie',
]);

function webQueryTokens(query) {
  return String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9äöüß]+/)
    .filter((token) => token && !WEB_STOP_TOKENS.has(token) && (token.length >= 2 || /^\d$/.test(token)));
}

/*
 * Trust-Ranking statt Ausschluss (ADR D8, Stufe B). Verworfen wird nur
 * eindeutiger Müll oder ein Treffer ohne jeden Gerätebezug in Titel/URL.
 * Die Punktzahl entscheidet die Reihenfolge (Herstellerhandbuch vor
 * Reparaturhinweis vor Fachartikel).
 */
export function rankWebResult(query, result, brand) {
  const title = stripHtml(result && result.title);
  const url = String(result && result.url || '');
  if (!title || !/^https?:\/\//i.test(url)) return null;

  let domain = '';
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { domain = ''; }
  const d = domain.toLowerCase();
  const u = url.toLowerCase();
  const t = title.toLowerCase();

  if (DENY_DOMAIN.test(d) || NOISE_URL.test(u) || NOISE_TITLE.test(title)) return null;
  if (!INTENT_HINT.test(title)) return null;

  const tokens = webQueryTokens(query);
  const hayTokens = new Set(`${t} ${u}`.split(/[^a-z0-9äöüß]+/).filter(Boolean));
  const matched = tokens.filter((tok) => hayTokens.has(tok) || (tok.length >= 5 && (t.includes(tok) || u.includes(tok))));
  const relevance = tokens.length ? matched.length / tokens.length : 0;
  if (tokens.length && relevance === 0) return null;

  let score = Number(result && result.score) || 0;

  const bt = brandToken(brand);
  const isManufacturerDomain = bt && d.includes(bt);
  if (isManufacturerDomain) score += 5;
  else if ([...KNOWN_BRANDS].some((b) => { const c = b.replace(/[^a-z0-9]/g, ''); return c.length >= 3 && d.includes(c); })) score += 3;

  if (/(ifixit|repair|reparatur|zerlegen|teardown)/i.test(d)) score += 2;
  if (DOC_HINT.test(title)) score += 3;
  if (REPAIR_HINT.test(title)) score += 1;
  if (/\.pdf(\?|#|$)/i.test(u) || /\/(download|support|service|manual|handbuch|anleitung)(\/|$)/i.test(u)) score += 2;
  score += relevance === 1 ? 2 : relevance;

  const kind = DOC_HINT.test(title) ? 'manual' : (REPAIR_HINT.test(title) ? 'repair' : 'article');

  return {
    title,
    url,
    snippet: truncate(stripHtml(result && result.content || ''), 420),
    /* Rohinhalt nur für das Kontext-Bundle (ADR D9); die klassische
       Websuche liefert weiterhin ausschließlich Snippets. */
    raw: String((result && (result.raw_content || result.content)) || ''),
    kind,
    score,
  };
}

export function rankWebResults(query, brand, results) {
  const items = [];
  const seen = new Set();
  for (const r of results || []) {
    if (!r || !r.url || !r.title) continue;
    const item = rankWebResult(query, r, brand);
    if (!item || seen.has(item.url)) continue;
    seen.add(item.url);
    items.push(item);
  }
  return items.sort((a, b) => b.score - a.score);
}

const WEB_CACHE_NAME = 'mendoor-web-v1';
const WEB_CACHE_TTL = 3600;
const MIN_USABLE_WEB = 2;

async function runTavilySearch(query, env, { depth = 'basic', rawContent = false, maxResults = 10 } = {}) {
  const cacheKey =
    `https://mendoor.cache/web/${depth}${rawContent ? '-raw' : ''}/${encodeURIComponent(query)}`;
  try {
    const cache = await caches.open(WEB_CACHE_NAME);
    const hit = await cache.match(cacheKey);
    if (hit) return await hit.json();
  } catch { /* Cache ist optional */ }

  let apiKey;
  try {
    apiKey = await env.TAVILY_API_KEY.get();
  } catch (err) {
    throw new SourceError('Tavily API key not configured', 500, err.message);
  }
  if (!apiKey) {
    throw new SourceError('Tavily API key empty', 500);
  }

  let resp;
  try {
    resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        search_depth: depth,
        max_results: maxResults,
        ...(rawContent ? { include_raw_content: true } : {}),
      }),
    });
  } catch (err) {
    throw new SourceError('Tavily unreachable', 502, err.message);
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new SourceError(`Tavily error ${resp.status}`, resp.status >= 500 ? 502 : resp.status, detail.slice(0, 300));
  }

  const data = await resp.json().catch(() => null);

  try {
    const cache = await caches.open(WEB_CACHE_NAME);
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${WEB_CACHE_TTL}` },
      })
    );
  } catch { /* Cache ist optional */ }

  return data;
}

/*
 * Offene Websuche (ADR D8): Query bauen, Tavily offen abrufen, ranken.
 * Liefert die offene Suche weniger als zwei brauchbare Treffer, folgt
 * eine zweite, repaturspezifische Query (ADR D8, Stufe C).
 */
export async function searchWebItems(device, env) {
  const base = bestSearchTerm(device);
  const brand = inferBrand(device) || inferBrand(base);

  const first = await runTavilySearch(buildWebQuery(base, brand), env);
  let results = rankWebResults(base, brand, first && first.results);

  if (results.length < MIN_USABLE_WEB) {
    const second = await runTavilySearch(buildSecondWebQuery(base, brand), env);
    const more = rankWebResults(base, brand, second && second.results);
    const seen = new Set(results.map((r) => r.url));
    for (const item of more) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      results.push(item);
    }
    results = results.sort((a, b) => b.score - a.score);
  }

  return results.slice(0, 8).map(({ title, url, snippet, kind }) => ({ title, url, snippet, kind }));
}

/*
 * Websuche mit Rohinhalt für das Kontext-Bundle (ADR D9).
 * Bewusst getrennt von `searchWebItems`: Die klassische Websuche bleibt
 * bei Snippets und `basic` (Kosten), nur das Bundle lädt Volltext.
 */
export async function searchWebItemsWithContent(device, env) {
  const base = bestSearchTerm(device);
  const brand = inferBrand(device) || inferBrand(base);
  const opts = { depth: 'advanced', rawContent: true, maxResults: 8 };

  const first = await runTavilySearch(buildWebQuery(base, brand), env, opts);
  let results = rankWebResults(base, brand, first && first.results);

  if (results.length < MIN_USABLE_WEB) {
    const second = await runTavilySearch(buildSecondWebQuery(base, brand), env, opts);
    const more = rankWebResults(base, brand, second && second.results);
    const seen = new Set(results.map((r) => r.url));
    for (const item of more) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      results.push(item);
    }
    results = results.sort((a, b) => b.score - a.score);
  }

  return results.slice(0, 5);
}

/* ══════════════════════════════════════════════════════════════
   iFixit-Guide-Detail (ADR D9): Schritte + Bilder.
   Die Such-API liefert nur Metadaten; erst `/guides/{id}` enthält
   die Arbeitsschritte und die Bildobjekte je Schritt.
   Lizenz: CC BY-NC-SA — Attribution ist Pflicht.
   ══════════════════════════════════════════════════════════════ */
const IFIXIT_API_BASE = 'https://www.ifixit.com/api/2.0';
const IFIXIT_LICENSE = 'CC BY-NC-SA 3.0';

export { IFIXIT_LICENSE };

function difficultyName(value) {
  if (!value) return '';
  const raw = typeof value === 'object' ? value.name || value.title || '' : String(value);
  return String(raw).trim();
}

function ifixitImageUrl(media) {
  const first = media && Array.isArray(media.data) ? media.data[0] : null;
  if (!first) return '';
  return first.standard || first.medium || first.large || first.original || first.thumbnail || '';
}

/* Guide-Detail defensiv normalisieren: iFixit liefert `lines` als
   Objekte (`{text, bullet}`) oder als Strings, `media` je Schritt. */
export function normalizeIfixitGuide(guide) {
  const guideid = String(guide?.guideid || guide?.guideId || guide?.id || '');
  const url = guide?.url || (guideid ? `https://www.ifixit.com/Guide/${guideid}` : '');

  const steps = (Array.isArray(guide?.steps) ? guide.steps : [])
    .map((step, index) => {
      const lines = (Array.isArray(step?.lines) ? step.lines : [])
        .map((line) =>
          typeof line === 'string'
            ? line
            : (line && (line.text_rendered || line.text_raw || line.text)) || ''
        )
        .map((text) => stripHtml(text))
        .filter(Boolean);
      const image = ifixitImageUrl(step?.media);
      const title = stripHtml(step?.title || '');
      return {
        index,
        title,
        text: lines.join('\n'),
        image: image ? { url: image, alt: title || `Schritt ${index + 1}` } : null,
      };
    })
    .filter((step) => step.title || step.text);

  return {
    guideid,
    title: stripHtml(guide?.title || ''),
    url,
    summary: stripHtml(guide?.summary || ''),
    introduction: stripHtml(guide?.introduction_raw || guide?.introduction_rendered || ''),
    conclusion: stripHtml(guide?.conclusion_raw || guide?.conclusion_rendered || ''),
    tools: (Array.isArray(guide?.tools) ? guide.tools : [])
      .map((tool) => stripHtml(tool?.text || tool?.name || ''))
      .filter(Boolean),
    difficulty: difficultyName(guide?.difficulty),
    time: guide?.time_required_max || guide?.time_required_min || null,
    steps,
  };
}

export async function fetchIfixitGuideDetail(guideid) {
  const id = String(guideid || '').trim();
  if (!id) return null;
  let lastError = null;

  /* Erst deutsche Fassung, dann Ausgangssprache (dieselbe Kaskade
     wie im Client, src/lib/api.js). */
  for (const suffix of ['?langid=de', '?useSourceLang=1', '']) {
    try {
      const resp = await fetch(`${IFIXIT_API_BASE}/guides/${encodeURIComponent(id)}${suffix}`, {
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok) {
        lastError = new SourceError(`iFixit guide ${resp.status}`, resp.status >= 500 ? 502 : resp.status);
        continue;
      }
      const data = await resp.json().catch(() => null);
      if (data && Array.isArray(data.steps) && data.steps.length > 0) return normalizeIfixitGuide(data);
    } catch (err) {
      lastError = new SourceError('iFixit guide unreachable', 502, err.message);
    }
  }

  if (lastError) throw lastError;
  return null;
}

/* ══════════════════════════════════════════════════════════════
   Internet-Archive-Volltext (ADR D9).
   Nur bei freier Lizenz wird der OCR-Volltext geladen; sonst bleibt
   es beim Metadatensatz (Titel/Beschreibung) und einem Link.
   ══════════════════════════════════════════════════════════════ */
const ARCHIVE_FREE_LICENSE = /(publicdomain|public domain|creativecommons|creative commons|cc0|cc-by)/i;

export function archiveLicense(metadata) {
  const raw = [metadata?.licenseurl, metadata?.rights, metadata?.license]
    .filter(Boolean)
    .join(' · ');
  return { free: ARCHIVE_FREE_LICENSE.test(raw), label: truncate(raw, 160) };
}

export async function fetchArchiveMetadata(identifier) {
  const resp = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) {
    throw new SourceError(`Archive metadata ${resp.status}`, resp.status >= 500 ? 502 : resp.status);
  }
  return resp.json();
}

function pickArchiveTextFile(metadata) {
  const files = Array.isArray(metadata?.files) ? metadata.files : [];
  const candidates = files.filter((file) => file && file.name && /(_djvu\.txt|\.txt)$/i.test(file.name));
  const djvu = candidates.find((file) => /_djvu\.txt$/i.test(file.name));
  return (djvu || candidates[0])?.name || '';
}

export async function fetchArchiveText(identifier, { maxBytes = 120000 } = {}) {
  const metadata = await fetchArchiveMetadata(identifier);
  const license = archiveLicense(metadata);
  const file = pickArchiveTextFile(metadata);

  if (!license.free || !file) {
    return { text: '', license, file, blocked: !license.free };
  }

  const url =
    `https://archive.org/download/${encodeURIComponent(identifier)}/` +
    `${encodeURIComponent(file)}`;

  let resp;
  try {
    resp = await fetch(url, { headers: { Range: `bytes=0-${maxBytes}` } });
  } catch (err) {
    throw new SourceError('Archive text unreachable', 502, err.message);
  }

  if (!resp.ok) {
    throw new SourceError(`Archive text ${resp.status}`, resp.status >= 500 ? 502 : resp.status);
  }

  const text = await resp.text();
  return { text: text.slice(0, maxBytes), license, file, blocked: false };
}
