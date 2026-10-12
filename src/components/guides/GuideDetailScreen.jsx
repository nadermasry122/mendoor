import { useApp } from '../../context/AppContext.jsx';
import { fetchGuideDetail } from '../../lib/api.js';
import { mapDifficulty } from '../../lib/search.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { ScreenHeader } from '../ui/ScreenHeader.jsx';
import { SmartImage } from '../ui/SmartImage.jsx';
import { FormattedText } from '../ui/FormattedText.jsx';
import { StateBox } from '../ui/StateBox.jsx';
import { Icon } from '../ui/Icon.jsx';
import { stripIfixitMarkup } from '../../lib/guides.js';

/* Werkzeugliste einer Anleitung. */
function ToolList({ tools }) {
  if (!tools || tools.length === 0) return null;
  return (
    <section className="detail-section">
      <h2>Benötigtes Werkzeug</h2>
      {tools.map((tool, i) => (
        <div className="step__line" key={i}>
          <span className="step__bullet">•</span>
          <FormattedText value={tool.text_rendered || tool.text || tool.name || ''} />
        </div>
      ))}
    </section>
  );
}

/* Arbeitsschritte inkl. optionaler Bilder. */
function StepList({ steps }) {
  if (!steps || steps.length === 0) return null;
  return (
    <section className="detail-section">
      <h2>Schritte ({steps.length})</h2>
      <div className="detail-steps">
        {steps.map((step, idx) => {
          const media = step.media?.data?.[0];
          const imgSrc = media && (media.standard || media.medium || media.thumbnail);
          const lines = (step.lines || [])
            .map((l) => l.text_rendered || l.text || stripIfixitMarkup(l.text_raw || ''))
            .filter((txt) => txt && txt.trim());

          return (
            <div className="step" key={idx}>
              <span className="step__num">{idx + 1}</span>
              <div className="step__body">
                {imgSrc && <img src={imgSrc} alt="" loading="lazy" />}
                {lines.length > 0 ? (
                  lines.map((l, i) => (
                    <div className="step__line" key={i}>
                      <span className="step__bullet">•</span>
                      {<FormattedText value={l} />}
                    </div>
                  ))
                ) : (
                  <div className="step__line">
                    <span>—</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function GuideDetailScreen({ guideId }) {
  const { navigate } = useApp();
  const { status, data: guide, reload } = useAsyncData(() => fetchGuideDetail(guideId), [guideId]);

  const heroImage =
    guide?.image && (guide.image.large || guide.image.standard || guide.image.medium);
  const diff = guide ? mapDifficulty(guide.difficulty) : null;

  return (
    <div className="screen">
      <ScreenHeader
        onBack={() => navigate('guides')}
        title={<FormattedText value={guide?.title || 'Anleitung'} links={false} />}
        subtitle="via iFixit"
      />

      <div className="scroll">
        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 0' }}>
            <div className="spinner" />
            <p style={{ color: 'var(--c-muted)' }}>Anleitung wird geladen …</p>
          </div>
        )}

        {status === 'error' && (
          <StateBox
            icon="wifiOff"
            title="Anleitung nicht ladbar"
            actions={
              <button className="btn btn--primary" onClick={reload}>
                Erneut versuchen
              </button>
            }
          >
            Die Anleitung konnte nicht geladen werden.
          </StateBox>
        )}

        {status === 'ready' && guide && (
          <>
            <div className="detail-hero">
              {heroImage ? (
                <SmartImage src={heroImage} className="detail-hero__img" fallbackIcon="wrench" fallbackSize={56} alt="" />
              ) : (
                <div className="detail-hero__fallback" aria-hidden="true">
                  <Icon name="wrench" size={48} weight="light" />
                </div>
              )}
              <div className="detail-hero__grad" />
            </div>

            <div className="detail-title">
              <h1><FormattedText value={guide.title || 'Anleitung'} links={false} /></h1>
              <div className="detail-meta">
                {diff && <span className={`pill pill--${diff.level}`}>{diff.label}</span>}
                {guide.time_required && (
                  <span className="pill">
                    <Icon name="clock" size={12} />
                    <FormattedText value={guide.time_required} links={false} />
                  </span>
                )}
                {guide.category && (
                  <span className="pill">
                    <FormattedText value={guide.category} links={false} />
                  </span>
                )}
              </div>
            </div>

            {(guide.introduction_rendered || guide.introduction_raw)?.trim() && (
              <section className="detail-section">
                <h2>Einleitung</h2>
                <FormattedText
                  block
                  value={guide.introduction_rendered || stripIfixitMarkup(guide.introduction_raw || '')}
                />
              </section>
            )}

            <ToolList tools={guide.tools} />
            <StepList steps={guide.steps} />

            <div style={{ height: 'var(--gap)' }} />
          </>
        )}
      </div>

      {status === 'ready' && guide && (
        <div className="detail-cta">
          <a href={guide.url || 'https://www.ifixit.com'} target="_blank" rel="noopener noreferrer">
            Vollständige Anleitung auf iFixit
            <Icon name="external" size={16} />
          </a>
        </div>
      )}
    </div>
  );
}
