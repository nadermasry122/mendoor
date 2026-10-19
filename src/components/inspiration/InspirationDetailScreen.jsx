import { useApp } from '../../context/AppContext.jsx';
import { INSPIRATION } from '../../constants/content.js';
import { ScreenHeader } from '../ui/ScreenHeader.jsx';
import { Icon } from '../ui/Icon.jsx';
import { StateBox } from '../ui/StateBox.jsx';

/*
 * Detailseite einer kuratierten Reuse-Idee.
 *
 * Bewusst unabhängig vom Scan-Zustand: Die Seite liest ausschließlich über
 * `inspirationId` aus den statischen Inhalten. `currentDevice` wird hier
 * nicht verwendet, damit nie versehentlich das zuletzt gescannte Gerät
 * angezeigt wird.
 */
export function InspirationDetailScreen({ inspirationId }) {
  const { navigate } = useApp();
  const item = INSPIRATION.find((entry) => entry.id === inspirationId);

  if (!item) {
    return (
      <div className="screen">
        <ScreenHeader onBack={() => navigate('home')} title="Inspiration" />
        <div className="scroll">
          <StateBox
            icon="search"
            title="Idee nicht gefunden"
            actions={
              <button className="btn btn--primary" onClick={() => navigate('home')}>
                Zur Startseite
              </button>
            }
          >
            Diese Inspiration gibt es nicht mehr. Auf der Startseite findest du alle aktuellen
            Reuse-Ideen.
          </StateBox>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <ScreenHeader
        onBack={() => navigate('home')}
        title={item.title}
        subtitle="Inspiration · Wiederverwendung"
        badge="Reuse"
      />

      <div className="scroll">
        <section className="detail-section insp-intro">
          <span className="insp-intro__icon" aria-hidden="true">
            <Icon name={item.icon} size={26} weight="light" />
          </span>
          <p>{item.summary}</p>
        </section>

        {item.needs?.length > 0 && (
          <section className="detail-section">
            <h2>Das brauchst du</h2>
            <ul className="insp-list">
              {item.needs.map((need) => (
                <li key={need}>{need}</li>
              ))}
            </ul>
          </section>
        )}

        {item.steps?.length > 0 && (
          <section className="detail-section">
            <h2>So geht&apos;s ({item.steps.length} Schritte)</h2>
            <div className="detail-steps">
              {item.steps.map((step, idx) => (
                <div className="step" key={step.title}>
                  <span className="step__num">{idx + 1}</span>
                  <div className="step__body">
                    <strong className="step__title">{step.title}</strong>
                    <div className="step__line">
                      <span className="step__bullet">•</span>
                      <span>{step.text}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {item.safety?.length > 0 && (
          <section className="detail-section">
            <div className="insp-notice">
              <span className="insp-notice__icon" aria-hidden="true">
                <Icon name="info" size={20} weight="bold" />
              </span>
              <div>
                <h2>Sicherheit &amp; Recht</h2>
                <ul className="insp-list insp-list--compact">
                  {item.safety.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {item.sources?.length > 0 && (
          <section className="detail-section">
            <h2>Quellen</h2>
            <div className="insp-sources">
              {item.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="external" size={14} />
                  <span>{source.label}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <p className="insp-note">
          Kuratiert von mendooR · Stand 19.10.2026. Diese Seite ist ein Einstieg, keine
          vollständige Reparaturanleitung.
        </p>

        <div style={{ height: 'var(--gap)' }} />
      </div>
    </div>
  );
}
