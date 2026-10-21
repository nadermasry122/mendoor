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
   Tavily — Websuche, serverseitig auf eine kuratierte Liste
   vertrauenswürdiger deutscher Tech-/Reparatur-Domains beschränkt.
   Gründe für Tavily: siehe ADR D4 (monatlich erneuertes Freikontingent,
   keine Kreditkarte im Signup).
   ══════════════════════════════════════════════════════════════ */
export const TRUSTED_DOMAINS = [
  'computerbase.de',
  'chip.de',
  'notebookcheck.net',
  'heise.de',
  'golem.de',
  'pcwelt.de',
];

/*
 * Die vertrauenswürdigen Tech-Domains liefern viel Produktjournalismus
 * (Tests, Preisvergleiche, Angebote) und nur selten gerätespezifische
 * Reparaturhinweise. Ohne Filter landen solche Seiten als „Web-Quelle“
 * im RAG-Prompt und die KI fasst dann Tests oder Preise statt Reparaturen
 * zusammen. Deshalb: Gerät muss im Titel/URL stehen, der Titel muss
 * Reparaturabsicht signalisieren, und reine Test-/Preis-/Suchseiten
 * fliegen raus.
 */
const WEB_REPAIR_HINT = /(reparatur|instandsetzung|repair|defekt|fehler|anleitung|zerleg|auseinanderbau|austausch|auswechseln|ersetzen|akku|batterie|display|bildschirm|problem|beheben|wartung|diagnose|\bfix\b|how\s+to)/i;
const WEB_NOISE_TITLE = /(\bim test\b|testbericht|preisvergleich|\bab \d+[.,]\d+\s*€|kaufen|bestellen|angebot|deal|schnäppchen|\bsearch\b|\bsuche\b)/i;
const WEB_NOISE_URL = /(^|\/)(search|suche)(\/|$)|preisvergleich/i;

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

function isRelevantWebResult(query, result) {
  const title = stripHtml(result.title);
  if (!title) return false;
  if (WEB_NOISE_URL.test(result.url || '')) return false;
  if (!WEB_REPAIR_HINT.test(title)) return false;
  if (WEB_NOISE_TITLE.test(title)) return false;

  const tokens = webQueryTokens(query);
  if (tokens.length === 0) return true;
  /* Bewusst nur der Titel: Snippets enthalten oft Gerätelisten oder
     Werbetexte, die einen Treffer nur vortäuschen. Token-Vergleich statt
     substring, damit „Pro“ nicht in „Problem“ matcht; lange Codes dürfen
     auch zusammengeschrieben im Titel stehen (WH1000XM4). */
  const titleLower = title.toLowerCase();
  let urlLower = '';
  try {
    urlLower = decodeURIComponent(String(result.url || '')).toLowerCase();
  } catch {
    urlLower = String(result.url || '').toLowerCase();
  }
  const haystack = `${titleLower} ${urlLower}`;
  const haystackTokens = new Set(haystack.split(/[^a-z0-9äöüß]+/).filter(Boolean));
  return tokens.every(
    (token) => haystackTokens.has(token) || (token.length >= 5 && haystack.includes(token))
  );
}

export async function searchWebItems(query, env) {
  let apiKey;
  try {
    apiKey = await env.TAVILY_API_KEY.get();
  } catch (err) {
    throw new SourceError('Tavily API key not configured', 500, err.message);
  }
  if (!apiKey) {
    throw new SourceError('Tavily API key empty', 500);
  }

  const tavilyBody = {
    query: `${query} Reparatur`,
    search_depth: 'basic',
    max_results: 8,
    include_domains: TRUSTED_DOMAINS,
  };

  let resp;
  try {
    resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tavilyBody),
    });
  } catch (err) {
    throw new SourceError('Tavily unreachable', 502, err.message);
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new SourceError(`Tavily error ${resp.status}`, resp.status >= 500 ? 502 : resp.status, detail.slice(0, 300));
  }

  const data = await resp.json().catch(() => null);
  const results = Array.isArray(data?.results) ? data.results : [];

  return results
    .filter((r) => r && r.url && r.title && /^https?:\/\//i.test(r.url))
    .filter((r) => isRelevantWebResult(query, r))
    .slice(0, 8)
    .map((r) => ({
      title: stripHtml(r.title),
      url: r.url,
      snippet: truncate(stripHtml(r.content || ''), 420),
    }));
}
