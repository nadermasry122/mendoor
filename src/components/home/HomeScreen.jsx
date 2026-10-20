import { useApp } from '../../context/AppContext.jsx';
import { INSPIRATION } from '../../constants/content.js';
import { BottomNav } from '../ui/BottomNav.jsx';
import { HeroBanner } from './HeroBanner.jsx';
import { CategoryChips } from './CategoryChips.jsx';
import { ScannerBox } from './ScannerBox.jsx';
import { RecentScans } from './RecentScans.jsx';
import { InspirationRow } from './InspirationRow.jsx';
import { Icon } from '../ui/Icon.jsx';
import { formatSavedDate, loadSavedAi } from '../../lib/savedAi.js';

export function HomeScreen() {
  const { navigate, openDevice, recentScans, showToast } = useApp();
  const savedAi = loadSavedAi();

  const openScanner = () => navigate('scanner');

  const handleOpenRecent = (item) => {
    if (item?.name) openDevice(item.name, item.source || 'ocr');
    navigate('result');
  };

  const handleNav = (target) => {
    if (target === 'home') navigate('home');
    else showToast('Profil – coming soon');
  };

  /*
   * Inspirationen haben ein eigenes Ziel. Insbesondere darf hier niemals
   * der Ergebnis-Screen geöffnet werden: Der zeigt `currentDevice` und
   * würde die zuletzt gescannte Geräteansicht unterschieben.
   */
  const handleInspiration = (item) => {
    if (item.kind === 'guide') {
      navigate('inspirationDetail', { inspirationId: item.id });
    } else if (item.kind === 'external' && item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else if (item.kind === 'assistant') {
      // Der KI-Assistent ist noch nicht implementiert (siehe ADR D6).
      showToast('KI-Hilfe folgt bald');
    } else {
      showToast('Guide folgt bald');
    }
  };

  return (
    <div className="screen">
      <div className="scroll">
        <HeroBanner />

        <ScannerBox onClick={openScanner} />

        <section className="sec-block">
          <h2 className="section-label">Kategorien</h2>
          <CategoryChips />
        </section>

        <section className="sec-block">
          <h2 className="section-title">Zuletzt verwendet</h2>
          <RecentScans items={recentScans} onOpen={handleOpenRecent} />
        </section>

        {savedAi.length > 0 && (
          <section className="sec-block">
            <h2 className="section-title">Gespeicherte KI-Einschätzungen</h2>
            <div>
              {savedAi.map((item) => (
                <button
                  key={item.id}
                  className="recent-item"
                  onClick={() => navigate('savedAiDetail', { savedId: item.id })}
                >
                  <span className="recent-item__icon" aria-hidden="true">
                    <Icon name="sparkle" size={20} />
                  </span>
                  <span className="recent-item__body">
                    <strong>{item.device}</strong>
                    <span>{formatSavedDate(item.savedAt)}</span>
                  </span>
                  <Icon name="chevronRight" size={16} weight="bold" className="recent-item__chevron" />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="sec-block">
          <h2 className="section-title">Inspiration</h2>
          <InspirationRow items={INSPIRATION} onSelect={handleInspiration} />
        </section>

        <div style={{ height: 'var(--gap)' }} />
      </div>

      <BottomNav active="home" onNavigate={handleNav} onScan={openScanner} />
    </div>
  );
}
