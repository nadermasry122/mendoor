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
  if (kept.length === 0) return clean;
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
      ? data.results.filter((r) => r && r.dataType === 'guide' && r.guideid && r.title)
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
    .slice(0, 8)
    .map((r) => ({
      title: stripHtml(r.title),
      url: r.url,
      snippet: truncate(stripHtml(r.content || ''), 420),
    }));
}
