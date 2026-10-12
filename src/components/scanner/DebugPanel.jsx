import { Icon } from '../ui/Icon.jsx';

/*
 * Debug-Panel (nur bei ?debug=1). Zeigt das exakt gesendete Bild und die
 * exakte Vision-Antwort, um Fehler zwischen Client, Transport und API
 * einzugrenzen.
 */
export function DebugPanel({ data, image, onClose }) {
  const isVision = Boolean(data && data.debug);

  return (
    <div className="debug-panel">
      <div className="debug-panel__head">
        <strong>
          <Icon name="bug" size={16} /> Debug: Vision Response
        </strong>
        <button className="btn btn--primary" onClick={onClose}>
          Schließen
        </button>
      </div>

      <p style={{ color: 'var(--c-muted)', fontSize: 11, marginBottom: 12 }}>
        Gesendetes Bild (Vorschau):
      </p>
      {image ? (
        <img src={image} alt="Gesendetes Bild" />
      ) : (
        <p style={{ color: 'var(--c-muted)', marginBottom: 12 }}>(kein Bild verfügbar)</p>
      )}

      {isVision ? (
        <>
          <div className="debug-block">
            <h4>Vision Summary</h4>
            <div>Bild-Bytes gesendet: <b>{data.imageBytes}</b></div>
            <div>hasFullTextAnnotation: <b>{String(data.hasFullTextAnnotation)}</b></div>
            <div>hasTextAnnotations: <b>{String(data.hasTextAnnotations)}</b></div>
          </div>
          <div className="debug-block">
            <h4>fullText</h4>
            <pre>{data.fullText || '(null)'}</pre>
          </div>
          <div className="debug-block">
            <h4>textAnnotations (top 20)</h4>
            <pre>{JSON.stringify(data.textAnnotations, null, 2)}</pre>
          </div>
        </>
      ) : (
        <div className="debug-block debug-block--error">
          <h4>Response</h4>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      <details>
        <summary>Vollständige Antwort anzeigen</summary>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </details>

      <div style={{ height: 40 }} />
    </div>
  );
}
