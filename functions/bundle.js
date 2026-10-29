/* ══════════════════════════════════════════════════════════════
   mendooR — Kontext-Bundle (ADR D9, Stufe 1)

   Baut pro Gerät EINMAL einen angereicherten Kontext und legt ihn in
   der Cache API ab (TTL 24 h). Enthalten sind:

     · iFixit-Guides inklusive Schritten und Bildobjekten
     · Internet-Archive-Volltext (nur bei freier Lizenz)
     · Tavily-Rohinhalt (search_depth: advanced)

   Die Antwortschicht (`rag.js`) wählt daraus nur die zur konkreten
   Frage passenden Chunks. Damit kostet eine Frage keine neue
   Websuche, solange sie im vorhandenen Kontext beantwortbar ist.
   ══════════════════════════════════════════════════════════════ */
import {
  IFIXIT_LICENSE,
  bestSearchTerm,
  domainOf,
  fetchArchiveText,
  fetchIfixitGuideDetail,
  formatDuration,
  searchArchiveItems,
  searchIfixitGuides,
  searchWebItemsWithContent,
  stripHtml,
  truncate,
} from './sources.js';

/* Version im Cache-Schlüssel: Ändert sich die Bundle-Struktur,
   werden alte Einträge automatisch ignoriert. */
export const BUNDLE_VERSION = 2;
export const BUNDLE_TTL = 86400;
const CACHE_NAME = 'mendoor-bundle-v1';

const LIMITS = {
  sources: 10,
  chunks: 70,
  totalChars: 90000,
  perSourceChars: 22000,
  ifixitGuides: 3,
  ifixitSteps: 40,
  archiveItems: 2,
  webItems: 4,
  webChunksPerSource: 6,
};

/* ── Chunking ────────────────────────────────────────────────
   Satzweise teilen, dann zu Blöcken von max. ~1.100 Zeichen bündeln.
   Kleine Blöcke werden verworfen (Seitenleisten, Cookie-Hinweise). */
export function chunkText(input, { maxLen = 1100, minLen = 60 } = {}) {
  const text = stripHtml(input);
  if (!text) return [];

  const parts = text.split(/(?<=[.!?])\s+|\n{2,}/);
  const pieces = [];

  /* Einzelne Sätze können länger als ein Chunk sein (OCR-Volltext ohne
     Satzzeichen): dann wortweise aufteilen, sonst entstehen Riesenblöcke. */
  for (const part of parts) {
    const piece = part.trim();
    if (!piece) continue;
    if (piece.length <= maxLen) {
      pieces.push(piece);
      continue;
    }
    let rest = piece;
    while (rest.length > maxLen) {
      let cut = rest.lastIndexOf(' ', maxLen);
      if (cut < maxLen * 0.5) cut = maxLen;
      pieces.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) pieces.push(rest);
  }

  const chunks = [];
  let buffer = '';

  for (const piece of pieces) {
    if (buffer && buffer.length + piece.length + 1 > maxLen) {
      if (buffer.length >= minLen) chunks.push(buffer.trim());
      buffer = piece;
    } else {
      buffer = buffer ? `${buffer} ${piece}` : piece;
    }
  }
  if (buffer.trim().length >= minLen) chunks.push(buffer.trim());
  return chunks;
}

/* ── Cache-Schlüssel ───────────────────────────────────────── */
async function hashKey(value) {
  try {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)]
      .slice(0, 12)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    /* Ohne crypto.subtle (sehr exotische Umgebung): stabiler Ersatz. */
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
    return Math.abs(hash).toString(16);
  }
}

async function bundleCacheKey(device, rawText) {
  return `https://mendoor.cache/bundle/v${BUNDLE_VERSION}/${await hashKey(`${device}\u0000${rawText}`)}`;
}

/* ── Bundle bauen ──────────────────────────────────────────── */
export async function buildBundle(device, env, { rawText = '' } = {}) {
  const query = bestSearchTerm(device);
  const errors = [];
  const sources = [];
  const chunks = [];
  const images = [];
  const steps = [];
  let chunkNo = 0;
  let imageNo = 0;
  let chars = 0;

  const addSource = (type, data) => {
    if (sources.length >= LIMITS.sources) return null;
    const id = `s${sources.length + 1}`;
    sources.push({
      id,
      type,
      title: truncate(stripHtml(data.title || 'Quelle'), 180),
      url: String(data.url || ''),
      snippet: truncate(stripHtml(data.snippet || ''), 480),
      meta: truncate(stripHtml(data.meta || ''), 160),
      ...(data.kind ? { kind: data.kind } : {}),
      license: data.license || '',
      attribution: data.attribution || '',
    });
    return id;
  };

  const addChunk = (sourceId, heading, text, { minLen = 80 } = {}) => {
    if (!sourceId || !text || chunks.length >= LIMITS.chunks) return;
    if (chars >= LIMITS.totalChars) return;

    const used = chunks
      .filter((chunk) => chunk.sourceId === sourceId)
      .reduce((sum, chunk) => sum + chunk.text.length, 0);
    const room = Math.min(text.length, LIMITS.perSourceChars - used, LIMITS.totalChars - chars);
    if (room < minLen) return;

    chunks.push({
      id: `c${++chunkNo}`,
      sourceId,
      heading: truncate(heading || '', 120),
      text: text.slice(0, room),
    });
    chars += room;
  };

  const [ifixitResult, archiveResult, webResult] = await Promise.allSettled([
    searchIfixitGuides(device),
    searchArchiveItems(query),
    searchWebItemsWithContent(query, env),
  ]);

  /* ── iFixit: Suchtreffer → Details (Schritte + Bilder) ── */
  if (ifixitResult.status === 'fulfilled') {
    const guides = ifixitResult.value.slice(0, LIMITS.ifixitGuides);
    const details = await Promise.allSettled(
      guides.map((guide) => fetchIfixitGuideDetail(guide.guideid))
    );

    details.forEach((result, index) => {
      if (result.status !== 'fulfilled' || !result.value) {
        errors.push({
          source: 'ifixit',
          message: result.status === 'rejected' ? String(result.reason?.message || result.reason) : 'detail empty',
          guideid: guides[index]?.guideid || null,
        });
        return;
      }

      const guide = result.value;
      const sourceId = addSource('ifixit', {
        title: guide.title || guides[index].title,
        url: guide.url,
        snippet: guide.summary || guides[index].summary || '',
        meta: [guide.difficulty, formatDuration(guide.time), 'iFixit'].filter(Boolean).join(' · '),
        license: IFIXIT_LICENSE,
        attribution: 'iFixit',
      });
      if (!sourceId) return;

      /* Einleitung, Werkzeuge und Abschluss sind für eine Anleitung oft
         wichtiger als die Schritte selbst (Vorbereitung, Sicherheit). */
      if (guide.introduction) addChunk(sourceId, 'Einleitung', guide.introduction);
      if (guide.tools.length > 0) {
        addChunk(sourceId, 'Benötigte Werkzeuge', `Werkzeuge: ${guide.tools.join(', ')}.`, { minLen: 8 });
      }

      guide.steps.forEach((step) => {
        if (steps.length >= LIMITS.ifixitSteps) return;
        addChunk(
          sourceId,
          `Schritt ${step.index + 1}${step.title ? `: ${step.title}` : ''}`,
          step.text,
          /* iFixit-Schritte sind oft kurz — hier zählt der Schritt,
             nicht die Textlänge. */
          { minLen: 8 }
        );

        let imageId = '';
        if (step.image && step.image.url) {
          imageId = `i${++imageNo}`;
          images.push({
            id: imageId,
            sourceId,
            stepIndex: step.index,
            url: step.image.url,
            alt: truncate(step.image.alt, 140),
            license: IFIXIT_LICENSE,
            attribution: 'iFixit',
          });
        }

        steps.push({
          id: `t${steps.length + 1}`,
          sourceId,
          index: step.index,
          title: truncate(step.title, 140),
          text: truncate(step.text, 700),
          imageId,
        });
      });

      if (guide.conclusion) addChunk(sourceId, 'Zusammenbau / Abschluss', guide.conclusion);
    });
  } else {
    errors.push({ source: 'ifixit', message: String(ifixitResult.reason?.message || ifixitResult.reason) });
  }

  /* ── Internet Archive: Metadaten + Volltext nur bei freier Lizenz ── */
  const archiveItems = archiveResult.status === 'fulfilled'
    ? archiveResult.value.slice(0, LIMITS.archiveItems)
    : [];
  if (archiveResult.status !== 'fulfilled') {
    errors.push({ source: 'archive', message: String(archiveResult.reason?.message || archiveResult.reason) });
  }

  const archiveTexts = await Promise.allSettled(
    archiveItems.map((item) => fetchArchiveText(item.identifier))
  );

  archiveItems.forEach((item, index) => {
    const result = archiveTexts[index];
    const license = result.status === 'fulfilled' ? result.value.license : { free: false, label: '' };

    const sourceId = addSource('archive', {
      title: item.title,
      url: item.url,
      snippet: item.description,
      meta: `Internet Archive · ${item.year || 'o. J.'}`,
      license: license.label,
      attribution: 'Internet Archive',
    });
    if (!sourceId) return;

    if (result.status === 'fulfilled' && !result.value.blocked && result.value.text) {
      chunkText(result.value.text).forEach((text, chunkIndex) => {
        addChunk(sourceId, `Handbuchauszug ${chunkIndex + 1}`, text);
      });
    } else if (result.status === 'rejected') {
      errors.push({
        source: 'archive',
        message: String(result.reason?.message || result.reason),
        identifier: item.identifier,
      });
    }
  });

  /* ── Tavily-Rohinhalt ── */
  if (webResult.status === 'fulfilled') {
    webResult.value.slice(0, LIMITS.webItems).forEach((item) => {
      const sourceId = addSource('web', {
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        meta: `Websuche · ${domainOf(item.url)}`,
        kind: item.kind,
        license: '',
        attribution: domainOf(item.url),
      });
      if (!sourceId) return;

      const text = item.raw && item.raw.length > item.snippet.length ? item.raw : item.snippet;
      chunkText(text)
        .slice(0, LIMITS.webChunksPerSource)
        .forEach((part, chunkIndex) => {
          addChunk(sourceId, `${item.title} · Abschnitt ${chunkIndex + 1}`, part);
        });
    });
  } else {
    errors.push({ source: 'websearch', message: String(webResult.reason?.message || webResult.reason) });
  }

  return {
    version: BUNDLE_VERSION,
    device,
    query,
    createdAt: new Date().toISOString(),
    ocr: truncate(rawText, 1200),
    sources,
    chunks,
    images,
    steps,
    errors,
    stats: {
      sources: sources.length,
      chunks: chunks.length,
      chars,
      images: images.length,
      steps: steps.length,
      ifixitGuides: sources.filter((source) => source.type === 'ifixit').length,
      archiveTexts: sources.filter((source) => source.type === 'archive' && source.license).length,
    },
  };
}

/* ── Bundle abrufen (Cache-first) ──────────────────────────── */
export async function getBundle(device, env, { rawText = '', refresh = false } = {}) {
  const key = await bundleCacheKey(device, rawText);

  if (!refresh) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(key);
      if (hit) {
        const data = await hit.json();
        if (data && data.version === BUNDLE_VERSION) return { bundle: data, cached: true };
      }
    } catch {
      /* Cache ist optional — ohne Cache wird neu gebaut. */
    }
  }

  const bundle = await buildBundle(device, env, { rawText });

  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      key,
      new Response(JSON.stringify(bundle), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${BUNDLE_TTL}`,
        },
      })
    );
  } catch {
    /* Cache ist optional. */
  }

  return { bundle, cached: false };
}
