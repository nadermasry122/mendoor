import { useCallback, useEffect, useRef, useState } from 'react';

const CAMERA_ERRORS = {
  NotAllowedError:
    'Kamerazugriff verweigert.\nBitte Berechtigung in den Browser-Einstellungen erlauben.',
  NotFoundError: 'Keine Kamera gefunden.\nStelle sicher, dass dein Gerät eine Kamera hat.',
  NotReadableError: 'Kamera wird von einer anderen App verwendet.',
};

/*
 * useCamera — kapselt Medienstream, Gerätewechsel, Zoom, Torch und Fokus.
 *
 * Capability Detection (ADR C1): Nach dem Start wird `getCapabilities()`
 * des aktiven Video-Tracks abgefragt. Die UI blendet nur ein, was das
 * Gerät tatsächlich unterstützt. Der Stream startet beim Mounten und
 * wird beim Unmounten zuverlässig gestoppt.
 */
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const trackRef = useRef(null);
  const facingRef = useRef('environment');
  const deviceIdRef = useRef(null);
  const torchRef = useRef(false);

  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [capabilities, setCapabilities] = useState({ zoom: null, torch: false, lens: false });
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(1);

  const stop = useCallback(() => {
    const stream = streamRef.current;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    trackRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    torchRef.current = false;
    setTorchOn(false);
    setReady(false);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Dieser Browser unterstützt keinen Kamerazugriff.');
      return;
    }

    // Vorherigen Stream sicher beenden
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      trackRef.current = null;
    }
    setError(null);

    const videoConstraints = deviceIdRef.current
      ? { deviceId: { exact: deviceIdRef.current }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      : { facingMode: facingRef.current, width: { ideal: 1920 }, height: { ideal: 1080 } };

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
    } catch (err) {
      // Veraltete deviceId → auf facingMode zurückfallen
      if (err.name === 'OverconstrainedError') {
        deviceIdRef.current = null;
        return start();
      }
      setError(CAMERA_ERRORS[err.name] || 'Kamera konnte nicht gestartet werden.');
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        /* Autoplay kann eine Nutzergeste erfordern */
      }
    }

    const track = stream.getVideoTracks()[0] || null;
    trackRef.current = track;
    torchRef.current = false;
    setTorchOn(false);

    // Geräte auflisten (für Objektivwechsel; Labels erst mit aktivem Stream)
    let devices = [];
    try {
      devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    } catch {
      devices = [];
    }

    // Fähigkeiten des Tracks ermitteln
    let caps = {};
    try {
      caps = track && typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
    } catch {
      caps = {};
    }
    let settings = {};
    try {
      settings = track ? track.getSettings() : {};
    } catch {
      settings = {};
    }

    const zoomCap = caps.zoom
      ? { min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1 }
      : null;
    setCapabilities({ zoom: zoomCap, torch: !!caps.torch, lens: devices.length > 2 });
    setZoom(zoomCap ? settings.zoom ?? zoomCap.min : 1);
    setReady(true);
  }, []);

  // Stream an den Lebenszyklus des Screens binden
  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flip = useCallback(() => {
    deviceIdRef.current = null;
    facingRef.current = facingRef.current === 'environment' ? 'user' : 'environment';
    start();
    return facingRef.current === 'user' ? 'Frontkamera' : 'Rückkamera';
  }, [start]);

  const cycleLens = useCallback(async () => {
    let devices = [];
    try {
      devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    } catch {
      devices = [];
    }
    if (devices.length < 2) return 'Keine weiteren Objektive';

    let currentId = deviceIdRef.current;
    if (!currentId && trackRef.current) {
      try {
        currentId = trackRef.current.getSettings().deviceId;
      } catch {
        /* ignorieren */
      }
    }
    let idx = devices.findIndex((d) => d.deviceId === currentId);
    idx = (idx + 1) % devices.length;
    deviceIdRef.current = devices[idx].deviceId;

    await start();

    const label = (devices[idx].label || '').toLowerCase();
    if (label.includes('ultra') || label.includes('wide angle')) return 'Ultraweitwinkel';
    if (label.includes('tele')) return 'Teleobjektiv';
    if (label.includes('wide')) return 'Weitwinkel';
    return `Objektiv ${idx + 1}`;
  }, [start]);

  const applyZoom = useCallback((value) => {
    const v = parseFloat(value);
    setZoom(v);
    const track = trackRef.current;
    if (!track) return;
    try {
      track.applyConstraints({ advanced: [{ zoom: v }] });
    } catch {
      /* manche Browser lehnen Mid-Stream-Änderungen ab */
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = trackRef.current;
    if (!track) return false;
    const next = !torchRef.current;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      torchRef.current = next;
      setTorchOn(next);
      return true;
    } catch {
      torchRef.current = false;
      setTorchOn(false);
      return false;
    }
  }, []);

  const focusAt = useCallback(async (nx, ny) => {
    const track = trackRef.current;
    if (!track || typeof track.getCapabilities !== 'function') return;
    let caps = {};
    try {
      caps = track.getCapabilities();
    } catch {
      return;
    }
    if (!caps.focusMode?.includes('manual') && !caps.pointsOfInterest) return;
    try {
      const advanced = {};
      if (caps.pointsOfInterest) advanced.pointsOfInterest = [{ x: nx, y: ny }];
      if (caps.focusMode?.includes('single-shot')) advanced.focusMode = 'single-shot';
      await track.applyConstraints({ advanced: [advanced] });
    } catch {
      /* Fokus nicht anwendbar — Ring zeigt trotzdem Rückmeldung */
    }
  }, []);

  return {
    videoRef,
    error,
    ready,
    capabilities,
    torchOn,
    zoom,
    restart: start,
    stop,
    flip,
    cycleLens,
    applyZoom,
    toggleTorch,
    focusAt,
  };
}
