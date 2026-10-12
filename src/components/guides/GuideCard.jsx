import { mapDifficulty, translateType } from '../../lib/search.js';
import { SmartImage } from '../ui/SmartImage.jsx';
import { FormattedText } from '../ui/FormattedText.jsx';

/* Reparaturanleitungs-Karte (iFixit). */
export function GuideCard({ guide, onOpen }) {
  const diff = mapDifficulty(guide.difficulty);
  const type = translateType(guide.type);
  const image = guide.image && (guide.image.standard || guide.image.medium || guide.image.thumbnail);

  return (
    <button className="guide-card" onClick={onOpen}>
      <SmartImage src={image} className="guide-card__img" fallbackIcon="wrench" alt="" />
      <span className="guide-card__body">
        <h3><FormattedText value={guide.title || guide.subject || 'Anleitung'} links={false} /></h3>
        <span className="guide-card__meta">
          {diff && <span className={`pill pill--${diff.level}`}>{diff.label}</span>}
          {type && <span className="pill">{type}</span>}
          {guide.category && (
            <span className="pill">
              <FormattedText value={guide.category} links={false} />
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
