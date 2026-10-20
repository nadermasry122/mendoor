import { useCallback, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useCamera } from '../../hooks/useCamera.js';
import { DEBUG_MODE, recognizeImage } from '../../lib/api.js';
import { canvasToBase64Jpeg, captureSharpestFrame } from '../../lib/capture.js';
import { extractCandidates, filterToTypePlate, isRealText } from '../../lib/classify.js';
import { Icon } from '../ui/Icon.jsx';
import { OcrSheet } from './OcrSheet.jsx';
import { DebugPanel } from './DebugPanel.jsx';

export function ScannerScreen() {
  const { navigate, openDevice, showToast } = useApp();
  const camera = useCamera();
  const { videoRef, error, ready, capabilities, torchOn, zoom } = camera;

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [sheet, setSheet] = useState(null); // { raw, candidates } | { manual } | null
  const [debug, setDebug] = useState(null); // { data, image } | null
  const [focusRing, setFocusRing] = useState(null); // { x, y, key }

  /* Tap-to-Focus: Fokuspunkt setzen und visuell quittieren. */
  const handleVideoTap = (event) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = video.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setFocusRing({ x, y, key: Date.now() });
    camera.focusAt(x / rect.width, y / rect.height);
  };

  /* OCR-Ergebnis in UI-Zustand übersetzen. */
  const presentResult = useCallback((data) => {
    const words = Array.isArray(data.words) ? data.words : [];
    const text = data.text || '';

    if (!isRealText(words)) {
      setSheet({ raw: null, candidates: [] });
      return;
    }

    const plateText = filterToTypePlate(text);
    const candidates = extractCandidates(text);

    if (!plateText && candidates.length === 0) {
      setSheet({ raw: '', candidates: [] });
    } else {
      setSheet({ raw: plateText || text, candidates });
    }
  }, []);

  const handleScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      showToast('Kamera noch nicht bereit');
      return;
    }

    setBusy(true);
    setStatus('Aufnahme …');
    const canvas = document.createElement('canvas');

    try {
      await captureSharpestFrame(video, canvas);
      setStatus('Bild wird gesendet …');
      const base64 = await canvasToBase64Jpeg(canvas, 0.85);

      setStatus('Text wird erkannt …');
      const data = await recognizeImage(base64, DEBUG_MODE);
      setBusy(false);

      if (DEBUG_MODE) {
        setDebug({ data, image: canvas.toDataURL('image/jpeg', 0.6) });
        return;
      }
      presentResult(data);
    } catch (err) {
      setBusy(false);
      if (DEBUG_MODE) {
        setDebug({
          data: { jsError: err.message, detail: err.detail || null },
          image: canvas.toDataURL('image/jpeg', 0.6),
        });
        return;
      }
      showToast('Erkennung fehlgeschlagen – bitte manuell eingeben');
      setSheet({ raw: '', candidates: [] });
    }
  }, [videoRef, showToast, presentResult]);

  const handleConfirm = (device) => {
    if (!device || !device.trim()) {
      showToast('Bitte ein Modell eingeben');
      return;
    }
    setSheet(null);
    openDevice(device);
    navigate('result');
  };

  /* Manuelle Eingabe ist jederzeit erreichbar — auch ohne Kameraberechtigung. */
  const openManual = () => setSheet({ manual: true, raw: '', candidates: [] });

  const onFlip = () => showToast(camera.flip());
  const onLens = async () => showToast(await camera.cycleLens());
  const onTorch = async () => {
    const ok = await camera.toggleTorch();
    if (!ok) showToast('Blitz nicht verfügbar');
  };

  return (
    <div className="screen scanner-screen">
      <video
        ref={videoRef}
        className="cam-video"
        autoPlay
        playsInline
        muted
        onClick={handleVideoTap}
      />

      {/* Bühne: Rahmen + Hinweis, zentriert im verbleibenden Raum. Pointer-Events
          sind aus, damit Tippen weiterhin den Fokus auf das Video setzt. */}
      <div className="cam-stage">
        <div className="scan-frame">
          <span className="c-br" />
          <span className="c-bl" />
        </div>
        <p className="cam-hint">Gerät in den Rahmen halten</p>
      </div>

      {error && (
        <div className="cam-error">
          <Icon name="info" size={40} weight="light" />
          <p>{error}</p>
          <button className="btn btn--primary" onClick={camera.restart}>
            Erneut versuchen
          </button>
        </div>
      )}

      <div className="cam-topbar">
        <button className="icon-btn" onClick={() => navigate('home')} aria-label="Zurück">
          <Icon name="arrowLeft" size={18} weight="bold" />
        </button>
        <div className="cam-topbar__right">
          {capabilities.torch && (
            <button
              className={`icon-btn ${torchOn ? 'active' : ''}`}
              onClick={onTorch}
              aria-label="Blitz"
              aria-pressed={torchOn}
            >
              <Icon name="flash" size={20} />
            </button>
          )}
          {capabilities.lens && (
            <button className="icon-btn" onClick={onLens} aria-label="Objektiv wechseln">
              <Icon name="lens" size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Unterer Bereich als Flex-Stack: Zoom, manuelle Eingabe und Steuerleiste
          können sich so nie überlagern. */}
      <div className="cam-bottom">
        {!error && capabilities.zoom && (
          <div className="cam-zoom">
            <span>{Number(zoom).toFixed(1)}×</span>
            <input
              type="range"
              min={capabilities.zoom.min}
              max={capabilities.zoom.max}
              step={capabilities.zoom.step}
              value={zoom}
              onChange={(e) => camera.applyZoom(e.target.value)}
              aria-label="Zoom"
            />
          </div>
        )}

        <button className="cam-manual" onClick={openManual}>
          <Icon name="keyboard" size={18} weight="bold" />
          Modell manuell eingeben
        </button>

        {!error && (
          <div className="cam-controls">
            <button
              className="btn-gallery"
              onClick={() => showToast('Galerie – coming soon')}
              aria-label="Aus Galerie wählen"
            >
              <Icon name="image" />
            </button>

            <button className="btn-shutter" onClick={handleScan} aria-label="Auslösen">
              <span className="btn-shutter__inner" />
            </button>

            <button className="btn-flip" onClick={onFlip} aria-label="Kamera wechseln">
              <Icon name="flip" />
            </button>
          </div>
        )}
      </div>

      {focusRing && (
        <span key={focusRing.key} className="focus-ring" style={{ left: focusRing.x, top: focusRing.y }} />
      )}

      {busy && (
        <div className="scan-overlay">
          <div className="spinner" />
          <p>{status}</p>
        </div>
      )}

      <OcrSheet
        open={Boolean(sheet)}
        manual={Boolean(sheet?.manual)}
        raw={sheet?.raw}
        candidates={sheet?.candidates || []}
        onCancel={() => setSheet(null)}
        onConfirm={handleConfirm}
      />

      {debug && (
        <DebugPanel
          data={debug.data}
          image={debug.image}
          onClose={() => {
            setDebug(null);
            navigate('home');
          }}
        />
      )}
    </div>
  );
}
