import { buildSiteRestrictedSearchUrl, searchWeb } from '../../lib/api.js';
import { TRUSTED_WEB_DOMAINS } from '../../constants/content.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { SkeletonCard } from '../ui/Skeleton.jsx';
import { StateBox } from '../ui/StateBox.jsx';
import { RowItem } from '../ui/RowItem.jsx';
import { FormattedText } from '../ui/FormattedText.jsx';

/*
 * Web-Suche-Panel (Tavily über Worker). Lädt erst beim ersten Öffnen.
 * Fällt bei leerem Ergebnis oder Fehler auf eine site-beschränkte
 * Google-Suche zurück (Link-out-Muster).
 */
export function WebSearchPanel({ device, active }) {
  const { status, data: items, reload } = useAsyncData(() => searchWeb(device), [device], active);
  const fallbackUrl = buildSiteRestrictedSearchUrl(device, TRUSTED_WEB_DOMAINS);

  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <>
        <SkeletonCard />
        <SkeletonCard />
      </>
    );
  }

  if (status === 'error') {
    return (
      <StateBox
        icon="wifiOff"
        title="Verbindung fehlgeschlagen"
        actions={
          <>
            <button className="btn btn--primary" onClick={reload}>
              Erneut versuchen
            </button>
            <button className="btn btn--ghost" onClick={() => window.open(fallbackUrl, '_blank', 'noopener')}>
              Stattdessen auf Google suchen
            </button>
          </>
        }
      >
        Die Websuche ist gerade nicht erreichbar.
      </StateBox>
    );
  }

  if (items.length === 0) {
    return (
      <StateBox
        icon="globe"
        title="Keine Artikel gefunden"
        actions={
          <button className="btn btn--primary" onClick={() => window.open(fallbackUrl, '_blank', 'noopener')}>
            Auf Google suchen
          </button>
        }
      >
        Zu „{device}“ gibt es auf den durchsuchten Seiten aktuell keine passenden Artikel.
      </StateBox>
    );
  }

  return items.map((item) => (
    <RowItem
      key={item.url}
      icon="globe"
      title={<FormattedText value={item.title} links={false} />}
      subtitle={<FormattedText value={item.snippet} links={false} />}
      onClick={() => window.open(item.url, '_blank', 'noopener')}
    />
  ));
}
