/*
 * Lokale Speicherung der KI-Ergebnisse (ADR D6/D7).
 *
 * Bewusst nur auf dem Gerät (localStorage): kein Konto, kein Server,
 * keine Synchronisation. Pro Gerät gibt es einen Eintrag; erneutes
 * Speichern überschreibt die ältere Fassung.
 */
const STORAGE_KEY = 'mendoor.ai.saved.v1';
const MAX_ITEMS = 20;

function storage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSavedAi() {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items.filter((item) => item && item.id && item.device) : [];
  } catch {
    return [];
  }
}

export function makeSavedAiId(device) {
  const slug = String(device || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `ai-${slug || 'geraet'}`;
}

export function getSavedAi(id) {
  return loadSavedAi().find((item) => item.id === id) || null;
}

export function saveAiResult({ device, answer, sources, model }) {
  const store = storage();
  if (!store) throw new Error('Lokaler Speicher ist nicht verfügbar.');

  const item = {
    id: makeSavedAiId(device),
    device,
    answer,
    sources: Array.isArray(sources) ? sources : [],
    model: model || null,
    savedAt: new Date().toISOString(),
  };

  const next = [item, ...loadSavedAi().filter((entry) => entry.id !== item.id)].slice(0, MAX_ITEMS);
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    throw new Error('Speichern nicht möglich (Speicher voll?).');
  }
  return item;
}

export function removeSavedAi(id) {
  const store = storage();
  if (!store) return [];
  const next = loadSavedAi().filter((item) => item.id !== id);
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Beim Löschen ist ein Quota-Fehler unkritisch; die Liste bleibt lokal. */
  }
  return next;
}

export function formatSavedDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Gespeichert';
  return date.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}
