import { Icon } from './Icon.jsx';

/* Menüzeile der Ergebnisliste. Chevron zeigt an, dass eine Aktion folgt. */
export function MenuItem({ icon, title, subtitle, onClick }) {
  return (
    <button className="menu-item" onClick={onClick}>
      <span className="menu-item__icon" aria-hidden="true">
        <Icon name={icon} size={20} />
      </span>
      <span className="menu-item__text">
        <h4>{title}</h4>
        {subtitle && <p>{subtitle}</p>}
      </span>
      <Icon name="chevronRight" size={16} weight="bold" className="menu-item__chevron" />
    </button>
  );
}
