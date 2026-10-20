import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatSavedDate, getSavedAi, removeSavedAi } from '../../lib/savedAi.js';
import { ScreenHeader } from '../ui/ScreenHeader.jsx';
import { FormattedText } from '../ui/FormattedText.jsx';
import { StateBox } from '../ui/StateBox.jsx';
import { Icon } from '../ui/Icon.jsx';

const SOURCE_LABELS = {
  ifixit: 'iFixit',
  archive: 'Archiv',
  web: 'Web',
};

/* Detailansicht eines lokal gespeicherten KI-Ergebnisses (ADR D7). */
export function SavedAiDetailScreen({ savedId }) {
  const { navigate } = useApp();
  const [item, setItem] = useState(() => getSavedAi(savedId));

  useEffect(() => {
    setItem(getSavedAi(savedId));
  }, [savedId]);

  const remove = () => {
    removeSavedAi(savedId);
    navigate('home');
  };

  if (!item) {
    return (
      <div className="screen">
        <ScreenHeader
          onBack={() => navigate('home')}
          title="Gespeicherte KI-Einschätzung"
          subtitle="Nicht gefunden"
        />
        <div className="scroll">
          <StateBox
            icon="file"
            title="Eintrag nicht gefunden"
            actions={
              <button className="btn btn--primary" onClick={() => navigate('home')}>
                Zur Startseite
              </button>
            }
          >
            Der gespeicherte Eintrag wurde möglicherweise auf diesem Gerät gelöscht.
          </StateBox>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <ScreenHeader
        onBack={() => navigate('home')}
        title={item.device}
        subtitle={`Gespeichert am ${formatSavedDate(item.savedAt)}`}
        badge="KI"
      />

      <div className="scroll">
        <section className="detail-section">
          <h2>Einschätzung</h2>
          <FormattedText value={item.answer} block />
        </section>

        {Array.isArray(item.sources) && item.sources.length > 0 && (
          <section className="detail-section">
            <h2>Bereitgestellte Quellen</h2>
            <div className="ai-panel__sources">
              <ul>
                {item.sources.map((source) => (
                  <li key={`${source.id}-${source.url}`}>
                    <span className="ai-panel__source-id">[{source.id}]</span>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.title}
                    </a>
                    <span className="ai-panel__source-type">
                      {SOURCE_LABELS[source.type] || source.type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <div className="saved-ai-actions">
          <button className="btn btn--ghost" onClick={remove}>
            <Icon name="trash" size={16} />
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}
