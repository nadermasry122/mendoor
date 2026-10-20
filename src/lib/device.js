/*
 * Kleine UI-Heuristik für Gerätekategorie und Herkunft.
 *
 * Die Kategorie ist keine fachliche Klassifikation, sondern nur ein
 * passendes Icon/Label für die Darstellung. Sie ersetzt keine
 * Typenschild-Erkennung und keine Materialdaten.
 */

const CATEGORY_RULES = [
  {
    re: /iphone|galaxy|pixel|smartphone|redmi|xiaomi|huawei|oneplus|oppo|vivo|motorola|nokia|sony xperia/i,
    label: 'Smartphone',
    icon: 'smartphone',
  },
  {
    re: /macbook|thinkpad|notebook|laptop|surface|latitude|ideapad|aspire|pavilion|zenbook|chromebook|elitebook/i,
    label: 'Laptop',
    icon: 'laptop',
  },
  {
    re: /kamera|camera|canon|nikon|fujifilm|lumix|alpha|eos|cybershot/i,
    label: 'Kamera',
    icon: 'camera',
  },
  {
    re: /waschmaschine|kühlschrank|kuehlschrank|herd|backofen|spülmaschine|spuelmaschine|trockner|mikrowelle|staubsauger/i,
    label: 'Haushaltsgerät',
    icon: 'plug',
  },
  {
    re: /lamp|leuchte|birne|strahler/i,
    label: 'Lampe',
    icon: 'lightbulb',
  },
  {
    re: /monitor|bildschirm|display|fernseher|tv/i,
    label: 'Bildschirm',
    icon: 'monitor',
  },
];

export function guessDeviceCategory(device) {
  const name = String(device || '');
  const match = CATEGORY_RULES.find((rule) => rule.re.test(name));
  return match ? { label: match.label, icon: match.icon } : { label: 'Gerät', icon: 'wrench' };
}

export function deviceSourceLabel(source) {
  if (source === 'manual') return 'Manuell eingegeben';
  if (source === 'demo') return 'Beispielgerät';
  return 'Erkannt via OCR-Scan';
}

export function deviceSourceShort(source) {
  if (source === 'manual') return 'Manuell';
  if (source === 'demo') return 'Beispiel';
  return 'OCR';
}
