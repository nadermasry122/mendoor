import { Icon } from './Icon.jsx';

/*
 * Disclosure Control (Apple-HIG-Muster): Ein Tipp klappt einen
 * Inhaltsbereich direkt unter der auslösenden Zeile auf. Der Auf/Zu-
 * Zustand wird vom übergeordneten Screen gehalten, sodass immer nur ein
 * Bereich zugleich geöffnet ist.
 */
export function Disclosure({ id, icon, title, subtitle, open, onToggle, children, className = '' }) {
  return (
    <div className={`disclosure${className ? ` ${className}` : ''}`} data-open={open ? 'true' : 'false'}>
      <button className="menu-item" onClick={() => onToggle(id)} aria-expanded={open}>
        <span className="menu-item__icon" aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
        <span className="menu-item__text">
          <h4>{title}</h4>
          <p>{subtitle}</p>
        </span>
        <Icon name="chevronRight" size={16} weight="bold" className="menu-item__chevron" />
      </button>
      <div className="disclosure__panel">
        <div className="disclosure__inner">{children}</div>
      </div>
    </div>
  );
}
