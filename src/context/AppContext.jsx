import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DEMO_DEVICE } from '../constants/content.js';
import { deviceSourceLabel, guessDeviceCategory } from '../lib/device.js';

const AppContext = createContext(null);

/*
 * Zentraler App-Zustand: Navigation (screenzustandsbasiert — keine
 * URL-Routen, damit das bestehende Worker-Deployment unverändert bleibt),
 * das aktuell gewählte Gerät, die letzten Scans und der Toast.
 */
export function AppProvider({ children }) {
  const [screen, setScreen] = useState('home');
  const [params, setParams] = useState({});
  const [currentDevice, setCurrentDevice] = useState(DEMO_DEVICE);
  const [currentDeviceSource, setCurrentDeviceSource] = useState('demo');
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
   */
  const openDevice = useCallback((name, source = 'ocr') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const category = guessDeviceCategory(trimmed);
    setCurrentDevice(trimmed);
    setCurrentDeviceSource(source);
    setRecentScans((prev) => {
      const entry = {
        id: `${trimmed}-${Date.now()}`,
        name: trimmed,
        icon: category.icon,
        meta: deviceSourceLabel(source),
        source,
      };
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
      currentDeviceSource,
      openDevice,
      recentScans,
      toast,
      showToast,
    }),
    [
      screen,
      params,
      navigate,
      currentDevice,
      currentDeviceSource,
      openDevice,
      recentScans,
      toast,
      showToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
