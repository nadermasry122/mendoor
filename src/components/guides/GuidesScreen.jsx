import { useApp } from '../../context/AppContext.jsx';
import { searchGuidesForDevice } from '../../lib/api.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { ScreenHeader } from '../ui/ScreenHeader.jsx';
import { SkeletonList } from '../ui/Skeleton.jsx';
import { StateBox } from '../ui/StateBox.jsx';
import { GuideCard } from './GuideCard.jsx';

export function GuidesScreen() {
  const { currentDevice, navigate } = useApp();
  const { status, data: guides, reload } = useAsyncData(
    () => searchGuidesForDevice(currentDevice),
    [currentDevice]
  );

  const openGuide = (id) => navigate('guideDetail', { guideId: id });

  return (
    <div className="screen">
      <ScreenHeader
        onBack={() => navigate('result')}
        title="Repairguides"
        subtitle={currentDevice}
        badge={status === 'ready' && guides.length > 0 ? 'iFixit' : null}
      />

      <div className="scroll guides-list">
        {status === 'loading' && <SkeletonList count={4} />}

        {status === 'error' && (
          <StateBox
            icon="wifiOff"
            title="Verbindung fehlgeschlagen"
            actions={
              <button className="btn btn--primary" onClick={reload}>
                Erneut versuchen
              </button>
            }
          >
            Die iFixit-Datenbank ist gerade nicht erreichbar. Prüfe deine Internetverbindung und
            versuche es erneut.
          </StateBox>
        )}

        {status === 'ready' && guides.length === 0 && (
          <StateBox
            icon="search"
            title="Keine Anleitungen gefunden"
            actions={
              <button
                className="btn btn--primary"
                onClick={() =>
                  window.open(
                    `https://de.ifixit.com/Suche?query=${encodeURIComponent(currentDevice)}`,
                    '_blank',
                    'noopener'
                  )
                }
              >
                Auf iFixit.com suchen
              </button>
            }
          >
            Für „{currentDevice}“ gibt es bei iFixit noch keine Reparaturanleitung. Versuche es mit
            einem anderen Gerät.
          </StateBox>
        )}

        {status === 'ready' &&
          guides.map((guide) => (
            <GuideCard key={guide.guideid} guide={guide} onOpen={() => openGuide(guide.guideid)} />
          ))}
      </div>
    </div>
  );
}
