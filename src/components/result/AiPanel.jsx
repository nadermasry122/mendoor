import { useCallback, useEffect, useRef, useState } from 'react';
import { askAi } from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../ui/Icon.jsx';
import { FormattedText } from '../ui/FormattedText.jsx';

/*
 * Reparaturassistent (ADR D9).
 *
 * Statt einer einmaligen Zusammenfassung führt dieser Bereich einen
 * Dialog: Jede Antwort ist belegt, Schritte tragen Bilder aus iFixit,
 * und nach jeder Antwort entscheidet der Nutzer, ob das Problem gelöst
 * ist. Bei „nein“ wählt er einen Grund, der die nächste Anfrage steuert.
 *
 * Kosten: Das Kontext-Bundle wird serverseitig pro Gerät gecacht; nur
 * neue Intents lösen eine weitere Websuche aus. Der Verlauf liegt
 * ausschließlich im Browser (localStorage) — kein Konto, keine
 * serverseitige Speicherung.
 */

const MAX_TURNS = 10;
const STORAGE_PREFIX = 'mendoor.ai.v1.';
const MAX_SAVED = 24;

const SUGGESTIONS = [
  'Wie öffne ich das Gerät?',
  'Woran erkenne ich, ob ein Bauteil defekt ist?',
  'Lohnt sich eine Reparatur noch?',
];

const REASONS = [
  { id: 'step', label: 'Schritt hat nicht funktioniert', text: 'Der beschriebene Schritt hat bei mir nicht funktioniert. Was kann ich stattdessen tun?' },
  { id: 'part', label: 'Teil nicht gefunden', text: 'Ich finde das benötigte Teil nicht. Wo bekomme ich es her und worauf muss ich beim Kauf achten?' },
  { id: 'tool', label: 'Werkzeug / traue mich nicht', text: 'Ich habe nicht das richtige Werkzeug oder traue mir den Schritt nicht zu. Welche Alternativen gibt es?' },
  { id: 'symptom', label: 'Symptom ist anders', text: 'Das Symptom ist anders als beschrieben: ' },
];

const SOURCE_LABELS = { ifixit: 'iFixit', archive: 'Archiv' };
const WEB_KIND_LABELS = { manual: 'Handbuch', repair: 'Reparatur', article: 'Web' };

function sourceLabel(source) {
  if (source.type === 'web') return WEB_KIND_LABELS[source.kind] || 'Web';
  return SOURCE_LABELS[source.type] || source.type;
}

function errorText(error) {
  if (!error) return 'Der Reparaturassistent ist gerade nicht erreichbar.';
  if (error.code === 'AI_BINDING_MISSING') {
    return 'Die KI ist in dieser Umgebung noch nicht konfiguriert. Quellenlisten und Anleitungen bleiben nutzbar.';
  }
  if (error.code === 'AI_TIMEOUT') {
    return 'Die Antwort hat zu lange gedauert. Bitte erneut versuchen — die Frage bleibt gespeichert.';
  }
  if (error.code === 'RATE_LIMITED' || error.httpStatus === 429) {
    return 'Zu viele Anfragen in kurzer Zeit. Bitte in einigen Minuten erneut versuchen.';
  }
  return 'Der Reparaturassistent ist gerade nicht erreichbar. Anleitungen und Quellen bleiben nutzbar.';
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function storageKey(device) {
  return `${STORAGE_PREFIX}${device}`;
}

function loadMessages(device) {
  try {
    const raw = localStorage.getItem(storageKey(device));
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveMessages(device, messages) {
  try {
    if (!messages.length) localStorage.removeItem(storageKey(device));
    else localStorage.setItem(storageKey(device), JSON.stringify(messages.slice(-MAX_SAVED)));
  } catch {
    /* localStorage kann blockiert sein (Privatmodus) — Verlauf ist optional. */
  }
}

export function AiPanel({ device }) {
  const { deviceContext, updateDevice, showToast } = useApp();

  const [messages, setMessages] = useState(() => loadMessages(device));
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | answer | error | resolved
  const [error, setError] = useState(null);
  const [showReasons, setShowReasons] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  const abortRef = useRef(null);

  /* Gerätewechsel: Verlauf des jeweiligen Geräts laden. */
  useEffect(() => {
    const stored = loadMessages(device);
    setMessages(stored);
    setStatus(stored.length ? 'answer' : 'idle');
    setError(null);
    setShowReasons(false);
    setHintDismissed(false);
    setInput('');
  }, [device]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const commit = useCallback((next) => {
    setMessages(next);
    saveMessages(device, next);
  }, [device]);

  const rawText = deviceContext?.name === device ? deviceContext.rawText : '';
  const turns = messages.filter((message) => message.role === 'user').length;
  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant') || null;
  const limitReached = turns >= MAX_TURNS;
  const loading = status === 'loading';

  const request = useCallback(async (question, baseMessages) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);
    setShowReasons(false);

    /* Verlauf mitschicken: letzte 6 Beiträge VOR der aktuellen Frage,
       Assistent nur als Fließtext (Schritte/Quellen würden das
       Kontextfenster ohne Nutzen füllen). */
    const history = baseMessages
      .slice(0, -1)
      .slice(-6)
      .map((message) => ({
        role: message.role,
        content: message.role === 'user' ? message.text : message.answer || '',
      }))
      .filter((entry) => entry.content.trim().length > 0);

    try {
      const data = await askAi({ device, question, rawText, history, signal: controller.signal });
      if (controller.signal.aborted) return;
      commit([...baseMessages, { id: newId(), role: 'assistant', ...data }]);
      setStatus('answer');
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err);
      setStatus('error');
    }
  }, [commit, device, rawText]);

  const send = useCallback((text) => {
    const value = String(text || '').trim();
    if (!value || status === 'loading') return;

    const userMessage = { id: newId(), role: 'user', text: value };
    const next = [...messages, userMessage];
    commit(next);
    setInput('');
    request(value, next);
  }, [commit, messages, request, status]);

  const retry = () => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    if (lastUser) request(lastUser.text, messages);
  };

  const acceptHint = (suggestedDevice) => {
    updateDevice(suggestedDevice);
    commit([]);
    setStatus('idle');
    setHintDismissed(true);
    showToast(`Gerät auf „${suggestedDevice}“ geändert`);
  };

  const startNewSession = () => {
    /* Zusammenfassung statt Abbruch (ADR D9): Der Kern der letzten Antwort
       bleibt als Kontext erhalten, das Turn-Budget startet neu. */
    if (lastAssistant?.answer) {
      commit([{ id: newId(), role: 'user', text: `Bisheriger Stand: ${String(lastAssistant.answer).replace(/\s+/g, ' ').slice(0, 400)}` }]);
      setStatus('idle');
    } else {
      commit([]);
      setStatus('idle');
    }
    setShowReasons(false);
  };

  const clearHistory = () => {
    commit([]);
    setStatus('idle');
    setShowReasons(false);
    showToast('Verlauf gelöscht');
  };

  const deviceHint = !hintDismissed && lastAssistant?.deviceHint ? lastAssistant.deviceHint : null;

  return (
    <div className="ai-panel" aria-live="polite">
      <p className="ai-panel__note">
        Frag konkret nach deinem Problem — der Assistent antwortet schrittweise und nur mit belegten
        Quellen. Bilder stammen aus den verlinkten Anleitungen.
      </p>

      {messages.length === 0 && (
        <div className="ai-chat__intro">
          <p className="ai-chat__intro-title">Was möchtest du wissen?</p>
          <div className="ai-chat__suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} className="ai-chip" onClick={() => send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="ai-chat">
          {messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="ai-msg ai-msg--user">
                {message.text}
              </div>
            ) : (
              <article key={message.id} className="ai-msg ai-msg--assistant">
                <AssistantBody data={message} />
              </article>
            )
          )}

          {loading && (
            <div className="ai-panel__loading">
              <span className="ai-panel__spinner" aria-hidden="true" />
              <div>
                <strong>Quellen werden ausgewertet …</strong>
                <p>Anleitungen, Handbuchauszüge und Websuche werden auf die Frage bezogen.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="ai-panel__error">
              <Icon name="wifiOff" size={20} />
              <p>{errorText(error)}</p>
              <button className="btn btn--ghost" onClick={retry}>
                Erneut versuchen
              </button>
            </div>
          )}

          {deviceHint && (
            <div className="ai-hint">
              <Icon name="info" size={18} />
              <div>
                <p className="ai-hint__title">Passt das Gerät?</p>
                <p className="ai-hint__text">
                  {deviceHint.reason} Vorschlag: <strong>{deviceHint.suggestedDevice}</strong>
                </p>
                {deviceHint.evidence?.length > 0 && (
                  <ul className="ai-hint__evidence">
                    {deviceHint.evidence.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ul>
                )}
                <div className="ai-hint__actions">
                  <button className="btn btn--primary" onClick={() => acceptHint(deviceHint.suggestedDevice)}>
                    Gerät ändern
                  </button>
                  <button className="btn btn--ghost" onClick={() => setHintDismissed(true)}>
                    Beim aktuellen bleiben
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === 'answer' && !loading && !limitReached && (
            <div className="ai-gate">
              <p className="ai-gate__question">Hat dir das geholfen?</p>
              <div className="ai-gate__actions">
                <button className="btn btn--primary" onClick={() => setStatus('resolved')}>
                  Ja, gelöst
                </button>
                <button className="btn btn--ghost" onClick={() => setShowReasons((open) => !open)}>
                  Nein, es klemmt noch
                </button>
              </div>

              {showReasons && (
                <div className="ai-gate__reasons">
                  {REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      className="ai-chip"
                      onClick={() => {
                        if (reason.id === 'symptom') {
                          setInput(reason.text);
                          setShowReasons(false);
                          return;
                        }
                        send(reason.text);
                      }}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {status === 'resolved' && (
            <div className="ai-gate ai-gate--done">
              <p className="ai-gate__question">Freut mich — dann ist der Fall abgeschlossen.</p>
              <div className="ai-gate__actions">
                <button className="btn btn--ghost" onClick={() => setStatus('idle')}>
                  Weitere Frage stellen
                </button>
                <button className="btn btn--ghost" onClick={clearHistory}>
                  Verlauf löschen
                </button>
              </div>
            </div>
          )}

          {limitReached && status !== 'resolved' && (
            <div className="ai-gate ai-gate--limit">
              <p className="ai-gate__question">Für diese Sitzung ist das Gesprächsbudget erreicht.</p>
              <p className="ai-gate__text">
                Du kannst mit einer Zusammenfassung weiterarbeiten — der bisherige Stand bleibt erhalten.
              </p>
              <div className="ai-gate__actions">
                <button className="btn btn--primary" onClick={startNewSession}>
                  Neue Sitzung mit Zusammenfassung
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status !== 'resolved' && !limitReached && (
        <form
          className="ai-input"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <input
            className="ai-input__field"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={lastAssistant?.followUp || 'Deine Frage zum Gerät …'}
            autoComplete="off"
            maxLength={600}
            disabled={loading}
            aria-label="Frage an den Reparaturassistenten"
          />
          <button className="btn btn--primary ai-input__send" type="submit" disabled={loading || !input.trim()}>
            Fragen
          </button>
        </form>
      )}

      {turns > 0 && (
        <div className="ai-panel__footer">
          <span className="ai-panel__counter">{turns}/{MAX_TURNS} Fragen in dieser Sitzung</span>
          <button className="ai-panel__link" onClick={clearHistory}>
            Verlauf löschen
          </button>
        </div>
      )}

      <p className="ai-panel__disclaimer">
        KI-generiert auf Basis der verlinkten Quellen. Keine Garantie auf Vollständigkeit; bei Akku,
        Netzspannung oder Unsicherheit eine Fachperson hinzuziehen.
      </p>
    </div>
  );
}

/* ── Antwortdarstellung: Einordnung, Schritte mit Bildern, Quellen ── */
function AssistantBody({ data }) {
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const sources = Array.isArray(data.sources) ? data.sources : [];

  const notice =
    data.status === 'not_covered' || (!data.answer && steps.length === 0)
      ? 'Für diese Frage gibt es in den gefundenen Quellen keine belastbare Antwort. Formuliere sie bitte genauer oder prüfe die Gerätebezeichnung.'
      : null;

  return (
    <div className="ai-answer">
      {notice && <p className="ai-answer__notice">{notice}</p>}

      {data.answer && (
        <div className="ai-panel__answer">
          <FormattedText value={data.answer} block />
        </div>
      )}

      {data.followUp && (
        <div className="ai-answer__followup">
          <Icon name="info" size={16} />
          <p>{data.followUp}</p>
        </div>
      )}

      {steps.length > 0 && (
        <ol className="ai-steps">
          {steps.map((step, index) => (
            <li key={`${step.title}-${index}`} className="ai-step">
              <div className="ai-step__head">
                <span className="ai-step__num">{index + 1}</span>
                <h4 className="ai-step__title">
                  <FormattedText value={step.title} links={false} />
                </h4>
              </div>

              {step.image && (
                <figure className="ai-step__figure">
                  <img src={step.image.url} alt={step.image.alt || step.title} loading="lazy" />
                  <figcaption>
                    {step.image.attribution || 'iFixit'}
                    {step.image.license ? ` · ${step.image.license}` : ''}
                    {' · '}
                    {(() => {
                      const source = sources.find((entry) => entry.id === step.image.sourceId);
                      return source?.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          Quelle
                        </a>
                      ) : (
                        <span>Quelle</span>
                      );
                    })()}
                  </figcaption>
                </figure>
              )}

              <div className="ai-step__text">
                <FormattedText value={step.text} block />
              </div>

              {step.sources?.length > 0 && (
                <div className="ai-step__sources">
                  {step.sources.map((number) => (
                    <span key={number} className="ai-step__badge">[{number}]</span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {sources.length > 0 && (
        <div className="ai-panel__sources">
          <h3>Verwendete Quellen</h3>
          <ul>
            {sources.map((source) => (
              <li key={`${source.id}-${source.number}`}>
                <span className="ai-panel__source-id">[{source.number}]</span>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
                <span className={`ai-panel__source-type ai-panel__source-type--${source.kind || source.type}`}>
                  {sourceLabel(source)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
