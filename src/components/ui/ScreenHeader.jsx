import { Icon } from './Icon.jsx';

export function BackButton({ onClick, label = 'Zurück' }) {
  return (
    <button className="back-btn" onClick={onClick} aria-label={label}>
      <Icon name="arrowLeft" size={16} weight="bold" />
    </button>
  );
}

/* Kopfzeile für Unterseiten (Repairguides, Guide-Detail …). */
export function ScreenHeader({ onBack, title, subtitle, badge, right }) {
  return (
    <header className="screen-header">
      {onBack && <BackButton onClick={onBack} />}
      <div className="screen-header__text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {badge && <span className="badge">{badge}</span>}
      {right}
    </header>
  );
}
