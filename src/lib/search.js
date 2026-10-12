/* ══════════════════════════════════════════════════════════════
   Suchbegriffsbildung und Aufbereitung
   Herkunft: test/app.js (ADR D5), unverändert portiert.
   ══════════════════════════════════════════════════════════════ */

/* Ein internes Herstellercode-Token (6+ Zeichen, Buchstaben UND Ziffern). */
export function isModelCodeToken(token) {
  const hasLetter = /[A-Za-z]/.test(token);
  const hasDigit = /\d/.test(token);
  return token.length >= 6 && hasLetter && hasDigit;
}

/*
 * bestSearchTerm — baut EINEN guten ausgehenden Suchbegriff aus einem
 * Gerätenamen. Nur intern anmutende Codes werden verworfen; kurze
 * Alphanumerik („A11“), Zahlen und Wörter bleiben erhalten.
 */
export function bestSearchTerm(deviceName) {
  const clean = deviceName.trim().replace(/\s+/g, ' ');
  const tokens = clean.split(' ').filter(Boolean);
  if (tokens.length <= 1) return clean;

  const kept = tokens.filter((t) => !isModelCodeToken(t));
  if (kept.length === 0) return clean;

  return kept.slice(0, 4).join(' ');
}

/*
 * buildQueryCascade — Kaskade von spezifisch zu breit für die iFixit-Suche.
 */
export function buildQueryCascade(device) {
  const clean = device.trim().replace(/\s+/g, ' ');
  const tokens = clean.split(' ').filter(Boolean);
  const cascade = [clean];

  if (tokens.length > 2) cascade.push(tokens.slice(0, 2).join(' '));
  if (tokens.length > 1) cascade.push(tokens[0]);

  tokens.forEach((t) => {
    if (/^[A-Z]{1,4}\d{2,6}[A-Z]{0,4}$/i.test(t) && !cascade.includes(t)) cascade.push(t);
  });

  return [...new Set(cascade)];
}

/* iFixit-Schwierigkeit (string oder {name}) → deutsches Label + CSS-Stufe. */
export function mapDifficulty(diff) {
  if (!diff) return null;
  const raw = typeof diff === 'object' ? diff.name || '' : diff;
  if (!raw) return null;
  const d = raw.toLowerCase();
  if (d.includes('very') || d.includes('hard') || d.includes('difficult')) return { label: 'Sehr schwierig', level: 'hard' };
  if (d.includes('moderate') || d.includes('medium')) return { label: 'Mittel', level: 'medium' };
  if (d.includes('easy')) return { label: 'Einfach', level: 'easy' };
  return { label: raw, level: 'medium' };
}

const TYPE_MAP = {
  replacement: 'Austausch',
  installation: 'Einbau',
  repair: 'Reparatur',
  disassembly: 'Zerlegung',
  teardown: 'Teardown',
  technique: 'Technik',
};

export function translateType(t) {
  if (!t) return null;
  return TYPE_MAP[t.toLowerCase()] || t;
}
