import { Icon } from '../ui/Icon.jsx';
import { deviceSourceLabel, guessDeviceCategory } from '../../lib/device.js';

/* Produktkarte auf dem Ergebnis-Screen. Herkunft und Quellenstatus sind
   dynamisch; die Kategorie ist eine UI-Heuristik (siehe lib/device.js). */
export function ProductCard({ device, source, guideCount, guideStatus }) {
  const category = guessDeviceCategory(device);
  const sourceLabel = deviceSourceLabel(source);

  let statusText = 'Quellen werden geprüft';
  let statusMuted = false;
  if (guideStatus === 'error') {
    statusText = 'Quellen nicht erreichbar';
    statusMuted = true;
  } else if (guideStatus === 'ready' && guideCount > 0) {
    statusText = `${guideCount} ${guideCount === 1 ? 'Anleitung' : 'Anleitungen'} verfügbar`;
  } else if (guideStatus === 'ready') {
    statusText = 'Keine Anleitung gefunden';
    statusMuted = true;
  }

  return (
    <div className="product-card">
      <div className="product-card__info">
        <span className="product-tag">
          <Icon name={category.icon} size={12} />
          {category.label}
        </span>
        <h2>{device}</h2>
        <p className="product-model">{sourceLabel}</p>
        <div className={`product-status${statusMuted ? ' product-status--muted' : ''}`}>
          <span className="product-status__dot" />
          <span>{statusText}</span>
        </div>
      </div>
      <div className="product-card__img" aria-hidden="true">
        <Icon name={category.icon} size={44} weight="light" />
      </div>
    </div>
  );
}
