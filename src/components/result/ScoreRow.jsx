import { mapDifficulty } from '../../lib/search.js';

/*
 * Kompakte Quellenlage statt statischer Materialschätzungen.
 * Die Werte stammen aus den tatsächlich geladenen iFixit-Treffern.
 */
export function ScoreRow({ guides = [], status = 'idle' }) {
  if (status === 'idle' || status === 'loading') {
    return <div className="source-strip source-strip--muted">Quellen werden geprüft …</div>;
  }
  if (status === 'error') {
    return <div className="source-strip source-strip--muted">Quellenlage nicht verfügbar</div>;
  }

  const count = guides.length;
  const levels = guides.map((guide) => mapDifficulty(guide.difficulty)).filter(Boolean);
  const easiest =
    levels.find((level) => level.level === 'easy') ||
    levels.find((level) => level.level === 'medium') ||
    levels[0] ||
    null;
  const levelLabel = easiest ? easiest.label : '–';

  return (
    <div className="source-strip" aria-label="Quellenlage">
      <span className="source-strip__item">
        <strong>{count}</strong> {count === 1 ? 'Anleitung' : 'Anleitungen'}
      </span>
      <span className="source-strip__sep" aria-hidden="true" />
      <span className="source-strip__item">
        <strong>{levelLabel}</strong> Niveau
      </span>
      <span className="source-strip__sep" aria-hidden="true" />
      <span className="source-strip__item">
        <strong>{count > 0 ? 'iFixit' : '–'}</strong> Quelle
      </span>
    </div>
  );
}
