import { Icon } from '../ui/Icon.jsx';

/* Primäre Handlungsaufforderung zum Starten des Scans. Bewusst kompakt als
   horizontale Aktionszeile (Icon · Titel · Unterzeile · Chevron), damit der
   Scan oben sichtbar bleibt, ohne den ersten Bildschirm zu dominieren. */
export function ScannerBox({ onClick }) {
  return (
    <div className="scanner-wrap">
      <button className="scanner-box" onClick={onClick}>
        <span className="scanner-box__icon" aria-hidden="true">
          <Icon name="scan" size={24} weight="bold" />
        </span>
        <span className="scanner-box__text">
          <span className="scanner-box__title">Gerät scannen</span>
          <span className="scanner-box__sub">Kamera auf das Gerät halten und auslösen</span>
        </span>
        <Icon name="chevronRight" size={18} weight="bold" className="scanner-box__chevron" />
      </button>
    </div>
  );
}
