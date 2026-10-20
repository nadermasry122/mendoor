import { useCallback, useEffect, useRef, useState } from 'react';
import { requestAiGuide } from '../../lib/api.js';
import { Icon } from '../ui/Icon.jsx';
import { FormattedText } from '../ui/FormattedText.jsx';

/*
 * KI-Kachel auf dem Ergebnis-Screen (ADR D6/D7).
 *
 * Die Kachel ruft bewusst nicht automatisch beim Mounten auf: Jeder
 * Aufruf kostet Neurons und trifft mehrere externe Quellen. Der Button
 * startet die serverseitige RAG-Kette; die Antwort ist ausschließlich
 * aus den abgerufenen Quellen zu belegen.
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
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const result = await requestAiGuide(device, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setData(result);
      setStatus('ready');
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err);
      setStatus('error');
    }
  }, [device]);

  const sources = Array.isArray(data?.sources) ? data.sources : [];
  const hasAnswer = typeof data?.answer === 'string' && data.answer.trim().length > 0;

  return (
    <section className="ai-card" aria-labelledby="ai-card-title" aria-live="polite">
      <div className="ai-card__head">
        <span className="ai-card__icon" aria-hidden="true">
          <Icon name="sparkle" size={22} weight="fill" />
        </span>
        <div className="ai-card__intro">
          <span className="ai-card__eyebrow">KI-Assistenz · quellenbasiert</span>
          <h2 id="ai-card-title">Was sagt die Quellenlage?</h2>
          <p>
            Fasst iFixit, Internet Archive und Websuche zu einer belegten Einschätzung
            für „{device}“ zusammen.
          </p>
        </div>
      </div>

      {status === 'idle' && (
        <button className="btn btn--primary btn--block ai-card__action" onClick={run}>
          <Icon name="sparkle" size={16} weight="fill" />
          Einschätzung erstellen
        </button>
      )}

      {status === 'loading' && (
        <div className="ai-card__loading">
          <span className="ai-card__spinner" aria-hidden="true" />
          <div>
            <strong>Quellen werden ausgewertet …</strong>
            <p>iFixit, Archiv und Websuche werden abgerufen und belegt zusammengefasst.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="ai-card__error">
          <Icon name="wifiOff" size={20} />
          <p>{errorText(error)}</p>
          <button className="btn btn--ghost" onClick={run}>
            Erneut versuchen
          </button>
        </div>
      )}

      {status === 'ready' && !hasAnswer && (
        <div className="ai-card__error">
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
        <div className="ai-card__result">
          <div className="ai-card__answer">
            <FormattedText value={data.answer} block />
          </div>

          {sources.length > 0 && (
            <div className="ai-card__sources">
              <h3>Bereitgestellte Quellen</h3>
              <ul>
                {sources.map((source) => (
                  <li key={`${source.id}-${source.url}`}>
                    <span className="ai-card__source-id">[{source.id}]</span>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.title}
                    </a>
                    <span className="ai-card__source-type">
                      {SOURCE_LABELS[source.type] || source.type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="btn btn--ghost ai-card__action" onClick={run}>
            Neu erstellen
          </button>
        </div>
      )}

      <p className="ai-card__disclaimer">
        KI-generiert auf Basis der verlinkten Quellen. Keine Garantie auf Vollständigkeit;
        bei Akku, Netzspannung oder Unsicherheit eine Fachperson hinzuziehen.
      </p>
    </section>
  );
}
