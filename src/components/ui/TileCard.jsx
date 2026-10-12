import { Icon } from './Icon.jsx';

/*
 * Wiederverwendbare Kachel mit Icon, Titel und Untertitel — für die
 * horizontalen Reihen („Inspiration" auf der Startseite, „Community &
 * Foren" im Ergebnis). Einheitliches Padding und einheitliches Icon-Feld;
 * das Icon ist einfarbig (erbt `currentColor`).
 */
export function TileCard({ icon, title, subtitle, onClick, className = '' }) {
  return (
    <button className={`tile-card ${className}`.trim()} onClick={onClick}>
      <span className="tile-icon" aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <span className="tile-title">{title}</span>
      {subtitle && <span className="tile-meta">{subtitle}</span>}
    </button>
  );
}
