import { Icon } from './Icon.jsx';

/* Externer Ergebnis-Eintrag (Archiv, Websuche) mit einheitlichem Aufbau. */
export function RowItem({ icon, title, subtitle, onClick }) {
  return (
    <button className="row-item" onClick={onClick}>
      <span className="row-item__icon" aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <span className="row-item__body">
        <h4>{title}</h4>
        {subtitle && <p>{subtitle}</p>}
      </span>
      <Icon name="external" size={14} weight="bold" className="row-item__ext" />
    </button>
  );
}
