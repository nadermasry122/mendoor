import { TileCard } from '../ui/TileCard.jsx';

/* Horizontal scrollbare Inspiration-Karten. Nutzt dieselbe Kachel wie die
   Community-Reihe im Ergebnis-Screen. */
export function InspirationRow({ items = [], onSelect }) {
  return (
    <div className="hscroll">
      {items.map((item) => (
        <TileCard
          key={item.id}
          className="insp-card"
          icon={item.icon}
          title={item.title}
          subtitle={item.meta}
          onClick={() => onSelect?.(item)}
        />
      ))}
    </div>
  );
}
