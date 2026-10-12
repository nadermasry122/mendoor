import { useApp } from './context/AppContext.jsx';
import { Toast } from './components/ui/Toast.jsx';
import { HomeScreen } from './components/home/HomeScreen.jsx';
import { ScannerScreen } from './components/scanner/ScannerScreen.jsx';
import { ResultScreen } from './components/result/ResultScreen.jsx';
import { GuidesScreen } from './components/guides/GuidesScreen.jsx';
import { GuideDetailScreen } from './components/guides/GuideDetailScreen.jsx';

/*
 * App-Shell: Statusleiste bleibt über allen Screens sichtbar (wie im
 * bisherigen MVP); der Screen wird anhand des Navigationszustands
 * ausgetauscht. Die Navigation ist bewusst zustands- (nicht URL-)basiert,
 * damit das bestehende Worker-Asset-Deployment unverändert weiterläuft.
 */
export function App() {
  const { screen, params, toast } = useApp();

  return (
    <div className="app-shell">
      {screen === 'home' && <HomeScreen />}
      {screen === 'scanner' && <ScannerScreen />}
      {screen === 'result' && <ResultScreen />}
      {screen === 'guides' && <GuidesScreen />}
      {screen === 'guideDetail' && <GuideDetailScreen guideId={params.guideId} />}

      <Toast message={toast} />
    </div>
  );
}
