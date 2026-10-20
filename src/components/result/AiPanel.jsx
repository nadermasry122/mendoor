import { useCallback, useEffect, useRef, useState } from 'react';
import { requestAiGuide } from '../../lib/api.js';
import { getSavedAi, makeSavedAiId, removeSavedAi, saveAiResult } from '../../lib/savedAi.js';
import { Icon } from '../ui/Icon.jsx';
import { FormattedText } from '../ui/FormattedText.jsx';

/*
 * Inhalt der optionalen KI-Kachel (ADR D6/D7).
 *
 * Die Kachel ist bewusst in ein Disclosure eingebettet und startet nicht
 * automatisch: Jeder Aufruf kostet Neurons und trifft mehrere externe
 * Quellen. Der Button startet die serverseitige RAG-Kette; die Antwort ist
 * ausschließlich aus den abgerufenen Quellen zu belegen.
 */
const SOURCE_LABELS = {
  ifixit: 'iFixit',
  archive: 'Archiv',
  web: 'Web',
};

function errorText(error) {
  if (!error) return 'Die KI-Assistenz ist gerade nicht erreichbar.';
  if (error.code === 'AI_BINDING_MISSING') {
    return 'Die KI ist in dieser Umgebung noch nicht konfiguriert. Die Quellenlisten bleiben nutzbar.';
  }
  if (error.code === 'AI_TIMEOUT') {
    return 'Die KI-Antwort hat zu lange gedauert. Bitte versuche es erneut; die Quellenlisten bleiben nutzbar.';
  }
  if (error.httpStatus === 429) {
    return 'Das KI-Kontingent ist gerade erschöpft. Bitte später erneut versuchen; die Quellenlisten bleiben nutzbar.';
  }
  return 'Die KI-Assistenz ist gerade nicht erreichbar. Die Quellenlisten bleiben nutzbar.';
}

export function AiPanel({ device }) {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    setStatus('idle');
    setData(null);
    setError(null);
    setSaveError(null);
    setSaved(Boolean(getSavedAi(makeSavedAiId(device))));
  }, [device]);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);
    setSaveError(null);

    try {
      const result = await requestAiGuide(device, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const existing = getSavedAi(makeSavedAiId(device));
      setData(result);
      setSaved(Boolean(existing && existing.answer === result.answer));
      setStatus('ready');
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err);
      setStatus('error');
    }
  }, [device]);

  const toggleSaved = useCallback(() => {
    const id = makeSavedAiId(device);
    setSaveError(null);

    if (saved) {
      removeSavedAi(id);
      setSaved(false);
      return;
    }

    try {
      saveAiResult({
        device,
        answer: data?.answer || '',
        sources: data?.sources || [],
        model: data?.model || null,
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err.message || 'Speichern nicht möglich.');
    }
  }, [data, device, saved]);

  const sources = Array.isArray(data?.sources) ? data.sources : [];
  const hasAnswer = typeof data?.answer === 'string' && data.answer.trim().length > 0;

  return (
    <div className="ai-panel" aria-live="polite">
      <p className="ai-panel__note">
        Optional: Fasst die Quellen zu einer belegten Einschätzung zusammen. Jeder Aufruf
        startet eine externe KI-Anfrage.
      </p>

      {status === 'idle' && (
        <button className="btn btn--primary ai-panel__action" onClick={run}>
          <Icon name="sparkle" size={16} weight="fill" />
          Einschätzung erstellen
        </button>
      )}

      {status === 'loading' && (
        <div className="ai-panel__loading">
          <span className="ai-panel__spinner" aria-hidden="true" />
          <div>
            <strong>Quellen werden ausgewertet …</strong>
            <p>iFixit, Archiv und Websuche werden abgerufen und belegt zusammengefasst.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="ai-panel__error">
          <Icon name="wifiOff" size={20} />
          <p>{errorText(error)}</p>
          <button className="btn btn--ghost" onClick={run}>
            Erneut versuchen
          </button>
        </div>
      )}

      {status === 'ready' && !hasAnswer && (
        <div className="ai-panel__error">
          <Icon name="search" size={20} />
          <p>
            Für „{device}“ wurden keine ausreichenden Quellen gefunden. Die Quellenlisten
            unten bleiben nutzbar.
          </p>
          <button className="btn btn--ghost" onClick={run}>
            Erneut versuchen
          </button>
        </div>
      )}

      {status === 'ready' && hasAnswer && (
        <div className="ai-panel__result">
          <div className="ai-panel__answer">
            <FormattedText value={data.answer} block />
          </div>

          {sources.length > 0 && (
            <div className="ai-panel__sources">
              <h3>Bereitgestellte Quellen</h3>
              <ul>
                {sources.map((source) => (
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
          )}

          <div className="ai-panel__actions">
            <button className="btn btn--ghost" onClick={toggleSaved}>
              <Icon name={saved ? 'trash' : 'save'} size={16} />
              {saved ? 'Gespeichert – entfernen' : 'Auf Gerät speichern'}
            </button>
            <button className="btn btn--ghost" onClick={run}>
              Neu erstellen
            </button>
          </div>

          {saveError && <p className="ai-panel__save-error">{saveError}</p>}
        </div>
      )}

      <p className="ai-panel__disclaimer">
        KI-generiert auf Basis der verlinkten Quellen. Keine Garantie auf Vollständigkeit;
        bei Akku, Netzspannung oder Unsicherheit eine Fachperson hinzuziehen.
      </p>
    </div>
  );
}
