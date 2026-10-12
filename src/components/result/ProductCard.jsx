import { Icon } from '../ui/Icon.jsx';

/* Produktkarte auf dem Ergebnis-Screen. */
export function ProductCard({ device }) {
  return (
    <div className="product-card">
      <div className="product-card__info">
        <span className="product-tag">
          <Icon name="smartphone" size={12} />
          Smartphone
        </span>
        <h2>{device}</h2>
        <p className="product-model">Erkannt via OCR-Scan</p>
        <div className="product-status">
          <span className="product-status__dot" />
          <span>Wiederverwendbar</span>
        </div>
      </div>
      <div className="product-card__img" aria-hidden="true">
        <Icon name="smartphone" size={44} weight="light" />
      </div>
    </div>
  );
}
