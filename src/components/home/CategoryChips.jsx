import { useState } from 'react';
import { CATEGORIES } from '../../constants/content.js';
import { Icon } from '../ui/Icon.jsx';

/* Horizontal scrollbare Kategorie-Auswahl. Hält die Auswahl selbst,
   optional kann der Screen per onChange reagieren. Icons sind einfarbig
   und folgen der 5-Farben-Regel. */
export function CategoryChips({ initial = 'cooling', onChange }) {
  const [active, setActive] = useState(initial);

  const select = (id) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className="cats" role="group" aria-label="Kategorie">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          className={`cat-chip ${active === cat.id ? 'active' : ''}`}
          onClick={() => select(cat.id)}
          aria-pressed={active === cat.id}
        >
          <span className="cat-chip__icon" aria-hidden="true">
            <Icon name={cat.icon} size={26} />
          </span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
