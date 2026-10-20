import { Icon } from '../ui/Icon.jsx';

/* Liste der zuletzt gescannten Geräte. Liegt bei leerer Liste einen
   Hinweistext an. */
export function RecentScans({ items = [], onOpen }) {
  if (items.length === 0) {
    return (
      <div className="empty-box">
        Noch keine Geräte.
        <br />
        Scanne ein Typenschild oder gib ein Modell manuell ein.
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <button key={item.id} className="recent-item" onClick={() => onOpen?.(item)}>
          <span className="recent-item__icon" aria-hidden="true">
            <Icon name={item.icon || 'smartphone'} size={20} />
          </span>
          <span className="recent-item__body">
            <strong>{item.name}</strong>
            <span>{item.meta}</span>
          </span>
          <span className="pill pill--accent">Reuse</span>
        </button>
      ))}
    </div>
  );
}
