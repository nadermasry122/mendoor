/* ══════════════════════════════════════════════════════════════
   Typenschild-Klassifikator
   ──────────────────────────────────────────────────────────────
   Cloud Vision liefert jeden erkannten Text — inklusive
   Verpackungsprosa, Anleitungen und Marketing. Diese Funktionen
   behalten nur, was wie ein Typenschild aussieht.
   Herkunft: test/app.js (ADR B2/B3/B4/B5), unverändert portiert.
   ══════════════════════════════════════════════════════════════ */

// Häufige Funktionswörter — eine Zeile voll davon ist Prosa, kein Typenschild.
const STOPWORDS = new Set([
  // Englisch
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'from', 'by', 'at', 'as',
  'is', 'are', 'was', 'were', 'be', 'been', 'this', 'that', 'these', 'those', 'it', 'its', 'you',
  'your', 'we', 'our', 'they', 'their', 'can', 'will', 'may', 'should', 'must', 'not', 'no',
  'all', 'any', 'more', 'than', 'when', 'if', 'how', 'what', 'which', 'please', 'use', 'using',
  // Deutsch
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'und', 'oder',
  'von', 'zu', 'im', 'in', 'auf', 'für', 'mit', 'aus', 'bei', 'nach', 'über', 'unter', 'ist', 'sind',
  'war', 'waren', 'wird', 'werden', 'kann', 'können', 'soll', 'sollen', 'muss', 'müssen', 'nicht',
  'alle', 'mehr', 'als', 'wenn', 'wie', 'was', 'welche', 'bitte', 'sie', 'ihr', 'ihre', 'diese', 'dieser',
]);

// Labels, die stark auf ein Typenschild hindeuten
const PLATE_LABELS = /\b(model|modell|type|typ|p\/?n|part\s*(no|number)|s\/?n|serial|seriennummer|art\.?-?nr|ref|imei|fcc\s*id|ic\s*:|mtm|sku|ean|upc)\b/i;

// Elektrische / regulatorische Kennzeichnungen typischer Typenschilder
const PLATE_SPECS = /\b(\d+([.,]\d+)?\s*(v|va|w|kw|a|ma|mah|wh|hz|khz|ghz|db|kg|g|ml|l)\b|~|⎓|dc|ac|rohs|weee|ce\b|ul\b|class\s*[ivx]+)\b/i;

const KNOWN_BRANDS = [
  'apple', 'iphone', 'ipad', 'macbook', 'imac', 'samsung', 'galaxy', 'sony', 'lg',
  'philips', 'bosch', 'siemens', 'miele', 'aeg', 'panasonic', 'toshiba', 'sharp', 'hp', 'dell', 'lenovo',
  'thinkpad', 'asus', 'acer', 'msi', 'huawei', 'xiaomi', 'redmi', 'poco', 'oneplus', 'oppo', 'vivo', 'realme',
  'honor', 'motorola', 'nokia', 'google', 'pixel', 'microsoft', 'surface', 'xbox', 'playstation', 'nintendo',
  'canon', 'nikon', 'fujifilm', 'gopro', 'bose', 'jbl', 'sennheiser', 'logitech', 'razer', 'anker', 'fairphone',
  'kindle', 'amazon', 'dyson', 'braun', 'krups', 'delonghi', 'tefal', 'severin', 'medion', 'grundig', 'beko',
  'latitude', 'xps', 'inspiron', 'precision', 'vostro', 'elitebook', 'pavilion', 'envy', 'spectre', 'omen',
  'ideapad', 'legion', 'yoga', 'zenbook', 'vivobook', 'rog', 'tuf', 'predator', 'aspire', 'nitro', 'swift',
  'vaio', 'satellite', 'portege', 'probook', 'chromebook',
];

/*
 * Schriften ohne Leerzeichen-Wortgrenzen (Chinesisch, Japanisch, Koreanisch,
 * Thai). isProseLine() zählt sonst „Wörter“ per Whitespace-Split — bei
 * diesen Schriften hat ein ganzer Satz null Leerzeichen und würde als
 * „1 Wort“ durch den Prosa-Filter rutschen.
 */
export function hasNoSpaceScript(text) {
  return /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F]/.test(text);
}

/* Entscheidet, ob eine Zeile wie Prosa (Satz) statt wie Plattendaten liest. */
export function isProseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;

  if (hasNoSpaceScript(trimmed)) {
    const digitRatio = (trimmed.match(/\d/g) || []).length / trimmed.length;
    return trimmed.length > 12 && digitRatio < 0.06;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 5) return false;

  const stopCount = words.filter((w) =>
    STOPWORDS.has(w.toLowerCase().replace(/[^a-zäöüß]/gi, ''))
  ).length;
  const stopRatio = stopCount / words.length;
  const endsLikeSentence = /[.!?]\s*$/.test(trimmed);
  const digitRatio = (trimmed.match(/\d/g) || []).length / trimmed.length;

  if (stopRatio >= 0.28) return true;
  if (words.length > 9 && digitRatio < 0.06) return true;
  if (endsLikeSentence && stopRatio >= 0.18) return true;

  return false;
}

/* Bewertet, wie stark eine Zeile nach Typenschild aussieht (0 = nein). */
export function typePlateScore(line) {
  if (!line || !line.trim()) return 0;
  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();
  let score = 0;

  if (PLATE_LABELS.test(trimmed)) score += 4;
  if (KNOWN_BRANDS.some((b) => lower.includes(b))) score += 3;
  if (PLATE_SPECS.test(trimmed)) score += 2;
  if (/\b[A-Z0-9][A-Z0-9\-\/]{3,}\b/.test(trimmed)) score += 2;
  if (/^[A-Z0-9\s\-\/.:]+$/.test(trimmed) && trimmed.length <= 30) score += 1;

  const digitRatio = (trimmed.match(/\d/g) || []).length / trimmed.length;
  if (digitRatio > 0.15) score += 1;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 5) score += 1;

  return score;
}

/* Reduziert rohen OCR-Text auf plausibel vom Typenschild stammende Zeilen. */
export function filterToTypePlate(text) {
  if (!text) return '';
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const kept = lines
    .filter((l) => !isProseLine(l))
    .map((l) => ({ line: l, score: typePlateScore(l) }))
    .filter((o) => o.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((o) => o.line);

  return kept.join('\n');
}

/*
 * Strukturbasierte Kandidatenextraktion (ADR B3).
 * Drei strukturelle Regeln statt einer wachsenden Regex-/Markenliste:
 *   R1 explizites Label, R2 identifier-förmiges Token, R3 „Wort + Zahl“.
 * Bewusst Recall vor Precision — die Bestätigung erfolgt durch den Nutzer.
 */
const UNIT_LIKE = /^\d+([.,]\d+)?[-\/]?\d*(v|va|w|kw|a|ma|mah|wh|hz|khz|ghz|db|kg|g|ml|l)$/i;
const LABELED = /\b(?:model|modell|typ|type|p\/?n|part\s*(?:no|number)|mtm)\b\.?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{2,24})/i;
const WORD_NUMBER = /\b([A-Z][a-zA-Z]{2,15}(?:\s+[A-Z][a-zA-Z]{2,15})?\s+[A-Z]?\d{1,5}[A-Z]{0,3})\b/;

export function extractCandidates(text) {
  if (!text) return [];

  const plateText = filterToTypePlate(text);
  if (!plateText) return [];

  const lines = plateText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const scored = [];

  const push = (t, s) => {
    const v = (t || '').trim().replace(/^[:\-#.\s]+|[.,;:\-\s]+$/g, '');
    if (!v || v.length < 3 || v.length > 40) return;
    if (/^\d{1,2}$/.test(v)) return;
    if (STOPWORDS.has(v.toLowerCase())) return;
    scored.push({ text: v, score: s });
  };

  lines.forEach((line) => {
    const lower = line.toLowerCase();

    // RULE 1
    const labelMatch = line.match(LABELED);
    if (labelMatch && labelMatch[1]) push(labelMatch[1], 6);

    // RULE 2
    const tokens = line.match(/[A-Za-z0-9][A-Za-z0-9\-\/]{2,19}/g) || [];
    tokens.forEach((tok) => {
      const hasLetter = /[A-Za-z]/.test(tok);
      const hasDigit = /\d/.test(tok);
      if (hasLetter && hasDigit && !UNIT_LIKE.test(tok)) push(tok, 4);
    });

    // RULE 3
    const wordNumMatch = line.match(WORD_NUMBER);
    if (wordNumMatch && wordNumMatch[1]) push(wordNumMatch[1], 5);

    // Marken-Boost (kein Muss)
    const brandHit = KNOWN_BRANDS.find((b) => lower.includes(b));
    if (brandHit) {
      const words = line.split(/\s+/).filter(Boolean);
      if (words.length <= 6) push(line, 3);
    }
  });

  const map = new Map();
  scored.forEach(({ text: t, score }) => {
    const key = t.toLowerCase();
    if (!map.has(key) || map.get(key).score < score) map.set(key, { text: t, score });
  });

  return Array.from(map.values())
    .sort((a, b) => b.score - a.score)
    .map((o) => o.text)
    .slice(0, 6);
}

/*
 * isRealText — verwirft Rauschen (Boden, Wand, Stoff), bevor es die UI
 * erreicht. Gibt nur true zurück, wenn die Wortliste nach echtem Label aussieht.
 */
export function isRealText(words) {
  if (!words || words.length === 0) return false;

  const confidentWords = words.filter((w) => w.confidence >= 70 && w.text.trim().length >= 2);
  if (confidentWords.length < 2) return false;

  const avgConf = words.reduce((s, w) => s + w.confidence, 0) / words.length;
  if (avgConf < 60) return false;

  const hasRealWord = words.some((w) => w.confidence >= 65 && /[A-Za-z0-9]{2,}/.test(w.text));
  if (!hasRealWord) return false;

  const allText = words.map((w) => w.text).join('');
  const symbolCount = (allText.match(/[|=\-.~^_]/g) || []).length;
  if (symbolCount / allText.length > 0.3) return false;

  return true;
}
