import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DEMO_DEVICE } from '../constants/content.js';

const AppContext = createContext(null);

/*
 * Zentraler App-Zustand: Navigation (screenzustandsbasiert — keine
 * URL-Routen, damit das bestehende Worker-Deployment unverändert bleibt),
 * das aktuell gewählte Gerät, die letzten Scans und der Toast.
 */
export function AppProvider({ children }) {
  const [screen, setScreen] = useState('home');
  const [params, setParams] = useState({});
  /* Gerätekontext (ADR D9): Name ist maßgeblich, dazu kommt der bereinigte
     Typenschild-Text aus dem Scan — nur im Speicher, nicht persistiert. */
  const [deviceContext, setDeviceContext] = useState({
    name: DEMO_DEVICE,
    rawText: '',
    candidates: [],
  });
  const currentDevice = deviceContext.name;
  const [recentScans, setRecentScans] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const navigate = useCallback((next, nextParams = {}) => {
    setParams(nextParams);
    setScreen(next);
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  /*
   * Bestätigtes Gerät übernehmen (aus OCR oder manueller Eingabe).
   * Das Gerät wird als letzter Scan gemerkt; Duplikate werden nach oben
   * gezogen statt mehrfach gelistet.
   *
   * `meta.rawText` ist der bereinigte Typenschild-Text (ADR D9); er bleibt
   * bewusst nur im Speicher, damit keine Seriennummern persistiert werden.
   */
  const openDevice = useCallback((name, meta = {}) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;

    setDeviceContext({
      name: trimmed,
      rawText: String(meta.rawText || '').slice(0, 2000),
      candidates: Array.isArray(meta.candidates) ? meta.candidates.slice(0, 8) : [],
    });
    setRecentScans((prev) => {
      const entry = { id: `${trimmed}-${Date.now()}`, name: trimmed, icon: 'smartphone', meta: 'Erkannt via Scan' };
      const withoutDupe = prev.filter((r) => r.name !== trimmed);
      return [entry, ...withoutDupe].slice(0, 5);
    });
  }, []);

  /* Nachträgliche Korrektur (ADR D9, Geräte-Gegenprobe): übernimmt den
     vom Assistenten vorgeschlagenen Namen und behält den Typenschild-Text. */
  const updateDevice = useCallback((name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    setDeviceContext((prev) => ({ ...prev, name: trimmed }));
    setRecentScans((prev) => {
      const entry = { id: `${trimmed}-${Date.now()}`, name: trimmed, icon: 'smartphone', meta: 'Korrigiert' };
      const withoutDupe = prev.filter((r) => r.name !== trimmed);
      return [entry, ...withoutDupe].slice(0, 5);
    });
  }, []);

  const value = useMemo(
    () => ({
      screen,
      params,
      navigate,
      currentDevice,
      deviceContext,
      openDevice,
      updateDevice,
      recentScans,
      toast,
      showToast,
    }),
    [screen, params, navigate, currentDevice, deviceContext, openDevice, updateDevice, recentScans, toast, showToast]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
