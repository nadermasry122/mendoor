import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { BottomNav } from '../ui/BottomNav.jsx';
import { BackButton } from '../ui/ScreenHeader.jsx';
import { Disclosure } from '../ui/Disclosure.jsx';
import { MenuItem } from '../ui/MenuItem.jsx';
import { ProductCard } from './ProductCard.jsx';
import { ScoreRow } from './ScoreRow.jsx';
import { AiPanel } from './AiPanel.jsx';
import { CommunityPanel } from './CommunityPanel.jsx';
import { ArchivePanel } from './ArchivePanel.jsx';
import { WebSearchPanel } from './WebSearchPanel.jsx';

export function ResultScreen() {
  const { currentDevice, navigate, showToast } = useApp();
  // Immer nur ein Disclosure-Bereich zugleich geöffnet (Apple-HIG-Muster).
  const [openPanel, setOpenPanel] = useState(null);
  const toggle = (id) => setOpenPanel((cur) => (cur === id ? null : id));

  const handleNav = (target) => {
    if (target === 'home') navigate('home');
    else showToast('Profil – coming soon');
  };

  return (
    <div className="screen">
      <header className="result-header">
        <BackButton onClick={() => navigate('home')} />
        <div>
          <h1>mendooR</h1>
          <p>Aus alt mach neu – keine Wissenschaft</p>
        </div>
      </header>

      <div className="scroll">
        <ProductCard device={currentDevice} />
        <ScoreRow />
        <AiPanel device={currentDevice} />

        <div className="section-label">Produktbeschreibung</div>

        <div className="menu-list">
          <MenuItem
            icon="clipboard"
            title="Einzelheiten"
            subtitle="Technische Spezifikationen anzeigen"
            onClick={() => showToast('Technische Daten – coming soon')}
          />
          <MenuItem
            icon="flask"
            title="Zusammensetzung"
            subtitle="Verbaute Materialien & Rohstoffe"
            onClick={() => showToast('Materialdaten – coming soon')}
          />
          <MenuItem
            icon="wrench"
            title="Repairguides"
            subtitle="Community-Anleitungen von iFixit"
            onClick={() => navigate('guides')}
          />

          <Disclosure
            id="community"
            icon="message"
            title="Community & Foren"
            subtitle="Reparatur-Subreddits durchsuchen"
            open={openPanel === 'community'}
            onToggle={toggle}
          >
            <CommunityPanel device={currentDevice} />
          </Disclosure>

          <Disclosure
            id="archive"
            icon="file"
            title="Anleitungen im Archiv"
            subtitle="Alte Bedienungsanleitungen finden"
            open={openPanel === 'archive'}
            onToggle={toggle}
          >
            <ArchivePanel device={currentDevice} active={openPanel === 'archive'} />
          </Disclosure>

          <Disclosure
            id="websearch"
            icon="globe"
            title="Web-Suche"
            subtitle="Fachartikel auf vertrauenswürdigen Seiten"
            open={openPanel === 'websearch'}
            onToggle={toggle}
          >
            <WebSearchPanel device={currentDevice} active={openPanel === 'websearch'} />
          </Disclosure>

          <MenuItem
            icon="recycle"
            title="Gerät kaputt?"
            subtitle="Richtig recyceln oder neu verwenden"
            onClick={() => showToast('Recyclinghöfe in der Nähe – coming soon')}
          />
        </div>

        <div style={{ height: 'var(--gap)' }} />
      </div>

      <BottomNav active="result" onNavigate={handleNav} onScan={() => navigate('scanner')} />
    </div>
  );
}
