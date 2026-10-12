import { useEffect, useRef, useState } from 'react';

/*
 * Kleiner Daten-Lade-Hook für alle externen Quellen.
 * `enabled` erlaubt Lazy-Loading: Archive/Websuche laden erst beim ersten
 * Öffnen des Disclosure-Bereichs. Einmal gestartet, wird bei erneutem
 * Öffnen **nicht** neu geladen (schont das Tavily-Kontingent); ein
 * Wechsel der Abhängigkeiten (z. B. anderes Gerät) lädt neu.
 * `reload` erzwingt einen erneuten Versuch.
 */
export function useAsyncData(loader, deps, enabled = true) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [started, setStarted] = useState(enabled);
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState({ status: 'idle', data: [], error: null });

  // Einmaliges „Anlaufen", sobald der Bereich zum ersten Mal aktiv wird.
  useEffect(() => {
    if (enabled) setStarted(true);
  }, [enabled]);

  useEffect(() => {
    if (!started) return undefined;
    let cancelled = false;
    setState({ status: 'loading', data: [], error: null });
    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', data: [], error });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, started, nonce]);

  const reload = () => setNonce((n) => n + 1);
  return { ...state, reload };
}
