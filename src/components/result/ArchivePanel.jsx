import { searchArchive } from '../../lib/api.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { SkeletonCard } from '../ui/Skeleton.jsx';
import { StateBox } from '../ui/StateBox.jsx';
import { RowItem } from '../ui/RowItem.jsx';
import { FormattedText } from '../ui/FormattedText.jsx';

/*
 * Internet-Archive-Panel. Lädt erst beim ersten Öffnen (`active`), um
 * unnötige Anfragen zu vermeiden.
 */
export function ArchivePanel({ device, active }) {
  const { status, data: items, reload } = useAsyncData(() => searchArchive(device), [device], active);

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
          <button className="btn btn--primary" onClick={reload}>
            Erneut versuchen
          </button>
        }
      >
        Das Archiv ist gerade nicht erreichbar.
      </StateBox>
    );
  }

  if (items.length === 0) {
    return (
      <StateBox
        icon="file"
        title="Keine Dokumente gefunden"
        actions={
          <button
            className="btn btn--primary"
            onClick={() =>
              window.open(
                `https://archive.org/search?query=${encodeURIComponent(device)}`,
                '_blank',
                'noopener'
              )
            }
          >
            Auf archive.org suchen
          </button>
        }
      >
        Im Internet Archive gibt es zu „{device}“ aktuell keine passenden Anleitungen.
      </StateBox>
    );
  }

  return items.map((item) => (
    <RowItem
      key={item.identifier}
      icon="file"
      title={<FormattedText value={item.title} links={false} />}
      subtitle={item.year || 'Internet Archive'}
      onClick={() => window.open(item.url, '_blank', 'noopener')}
    />
  ));
}
