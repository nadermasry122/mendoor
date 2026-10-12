import { Icon } from './Icon.jsx';

/* Untere App-Navigation. `onNavigate` erhält die Zielkennung, `onScan`
   den zentralen Scan-Button. Wird von mehreren Screens geteilt. */
export function BottomNav({ active, onNavigate, onScan }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-btn ${active === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <Icon name="home" />
        <span>Start</span>
      </button>
      <button className="nav-scan" onClick={onScan} aria-label="Gerät scannen">
        <Icon name="scan" size={24} weight="bold" />
      </button>
      <button
        className={`nav-btn ${active === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <Icon name="user" />
        <span>Profil</span>
      </button>
    </nav>
  );
}
