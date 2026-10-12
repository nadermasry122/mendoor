import { useEffect, useState } from 'react';
import { Sheet } from '../ui/Sheet.jsx';

/*
 * Bestätigungs-Sheet nach dem Scan.
 *   manual        → reine manuelle Eingabe (z. B. ohne Kameraberechtigung)
 *   raw === null  → Rauschen verworfen (Boden/Wand)
 *   raw === ''    → OCR lief, aber nichts Verwertbares
 *   raw (Text)    → etwas wurde gelesen
 * Vorschläge sind antippbar; das Ergebnisfeld bleibt manuell korrigierbar
 * (Recall-vor-Precision, ADR B5).
 */
export function OcrSheet({ open, raw, candidates, manual = false, onCancel, onConfirm }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) return;
    setValue(candidates?.[0] || '');
  }, [open, candidates]);

  const noiseRejected = raw === null;
  const hasText = !noiseRejected && typeof raw === 'string' && raw.replace(/\s/g, '').length > 3;
  const hasCandidates = candidates && candidates.length > 0;

  const title = hasCandidates && !manual ? 'Gerät erkannt?' : 'Modell manuell eingeben';

  let sub;
  if (manual) {
    sub = 'Gib Marke und Modell ein, um passende Anleitungen zu finden.';
  } else if (hasCandidates) {
    sub = 'Tippe einen Vorschlag an oder korrigiere das Modell manuell.';
  } else if (noiseRejected) {
    sub =
      'Richte die Kamera direkt auf das Typenschild des Geräts (meist Geräterückseite oder Unterseite) und scanne erneut. Oder gib das Modell unten ein.';
  } else {
    sub = 'Im erkannten Text wurde keine Modellbezeichnung gefunden. Gib Marke und Modell manuell ein.';
  }

  let rawDisplay;
  if (hasText) rawDisplay = raw.slice(0, 400);
  else if (noiseRejected)
    rawDisplay = 'Kein Typenschild erkannt — der gescannte Bereich enthält keinen lesbaren Text.';
  else rawDisplay = 'Text zu undeutlich — bitte näher ans Typenschild halten oder Beleuchtung verbessern.';

  return (
    <Sheet open={open} label="Erkanntes Modell bestätigen">
      <h2>{title}</h2>
      <p className="sheet__sub">{sub}</p>

      {!manual && (
        <>
          <span className="ocr-field-label">Erkannter Text</span>
          <div className={`ocr-raw ${hasText ? '' : 'ocr-raw--empty'}`}>{rawDisplay}</div>

          {hasCandidates && (
            <>
              <span className="ocr-field-label">Vorschläge</span>
              <div className="ocr-chips">
                {candidates.map((c) => (
                  <button key={c} className="ocr-chip" onClick={() => setValue(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <span className="ocr-field-label">Gerät / Modell</span>
      <input
        className="ocr-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="z. B. iPhone 14 Pro oder A2890"
        autoComplete="off"
      />

      <div className="ocr-actions">
        <button className="btn btn--ghost" onClick={onCancel}>
          Abbruch
        </button>
        <button className="btn btn--primary" onClick={() => onConfirm(value)}>
          Anleitungen suchen
        </button>
      </div>
    </Sheet>
  );
}
