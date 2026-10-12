import { Icon } from './Icon.jsx';

/* Einheitlicher Leer-/Fehlerzustand für alle Datenquellen. */
export function StateBox({ icon, title, children, actions }) {
  return (
    <div className="state-box">
      {icon && <Icon name={icon} size={40} weight="light" className="state-box__icon" />}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {actions && <div className="state-box__actions">{actions}</div>}
    </div>
  );
}
