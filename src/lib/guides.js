/* ══════════════════════════════════════════════════════════════
   Aufbereitung von iFixit-Inhalten.
   Die API liefert pro Schrittzeile sowohl `text_raw` (Wiki-Markup
   wie [link|url|Text|new_window=true]) als auch `text_rendered`
   (fertiges HTML). Bevorzugt wird immer `text_rendered`; dieser
   Helfer dient nur als Fallback, wenn nur Markup vorliegt.
   ══════════════════════════════════════════════════════════════ */

/* [link|URL|Text|…] · [product|ID|Name] · [guide|ID|Titel] · [item|ID|Name] */
const LABELED = /\[(link|product|guide|item|wiki|dictionary)\|(?:[^|\]]*)\|([^|\]]*)(?:\|[^\]]*)?\]/gi;
/* Inline-Bilder [img[…]] bzw. [image[…]] komplett entfernen */
const IMAGES = /\[(?:img|image|video|embed)\[[^\]]*\]\]?/gi;
/* Einfache BBCode-artige Tags */
const SIMPLE_TAGS = /\[\/?(?:b|i|u|s|code|quote|sub|sup|br|newline|nl|icon|flag|summary|title)\]/gi;
/* Übrig gebliebene […]-Markup-Reste */
const LEFTOVER = /\[[^\]]*\]/g;

export function stripIfixitMarkup(text) {
  if (!text) return '';
  return String(text)
    .replace(LABELED, '$2')
    .replace(IMAGES, '')
    .replace(SIMPLE_TAGS, '')
    .replace(LEFTOVER, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
