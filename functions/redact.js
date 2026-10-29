/* ══════════════════════════════════════════════════════════════
   mendooR — Datenminimierung vor dem Modellaufruf (ADR D9, Punkt 8)

   Der OCR-Text des Typenschilds enthält neben Marke/Modell häufig
   Seriennummer, MAC-Adresse oder IMEI. Diese Identifikatoren helfen
   bei keiner Reparaturfrage, sind aber personenbeziehbar (Geräte-
   Zuordnung). Sie werden deshalb serverseitig entfernt, bevor der
   Text in den Prompt gelangt.

   Bewusst serverseitig: eine Stelle, die Regel, kein duplizierter
   Client-Code, und der Filter greift auch, wenn ein anderer Client
   den Endpunkt aufruft.
   ══════════════════════════════════════════════════════════════ */

/* Reihenfolge ist relevant: erst Label + Wert, dann nackte Muster. */
const RULES = [
  /* "S/N: ABC123...", "Serial No. 12345", "Seriennummer 0815" */
  [/\b(s\/n|sn|serial(?:\s*(?:no|number|#))?|seriennummer|seriennr\.?)\b\s*[:#]?\s*[A-Z0-9][A-Z0-9\-]{4,}/gi, '[Seriennummer entfernt]'],
  /* IMEI (15 Ziffern, explizit benannt) */
  [/\bimei\b\s*[:#]?\s*\d{15}\b/gi, '[IMEI entfernt]'],
  /* MAC-Adresse */
  [/\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/gi, '[MAC entfernt]'],
  /* Standalone IMEI-artige 15-stellige Zahl */
  [/(?<![\d.,])\d{15}(?![\d.,])/g, '[IMEI entfernt]'],
];

/* Maximal 1.200 Zeichen Typenschild-Text sind für den Prompt genug:
   Netzteilspannung, Revision, Varianten. Längere Texte sind meist
   Fehllesungen des Klassifikators. */
const MAX_OCR_CHARS = 1200;

export function redactIdentifiers(value) {
  let text = String(value || '');
  if (!text) return '';
  for (const [pattern, replacement] of RULES) {
    text = text.replace(pattern, replacement);
  }
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_OCR_CHARS);
}
