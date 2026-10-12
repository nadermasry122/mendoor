/* ══════════════════════════════════════════════════════════════
   Bildaufnahme und -aufbereitung (OCR-Eingang)
   Herkunft: test/app.js (ADR B1), portiert.
   ══════════════════════════════════════════════════════════════ */

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
 * Laplace-Varianz ≈ Schärfe eines ImageData.
 * Stichprobe mit Schrittweite 2: Schärfe ist eine großflächige
 * Eigenschaft, das spart ~75 % Rechenzeit ohne messbaren Verlust.
 */
export function laplacianVariance(imgData, w) {
  const d = imgData.data;
  const h = imgData.height;
  let sum = 0;
  let sum2 = 0;
  let n = 0;
  const STEP = 2;

  for (let y = 1; y < h - 1; y += STEP) {
    for (let x = 1; x < w - 1; x += STEP) {
      const idx = (y * w + x) * 4;
      const gray = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
      const lap =
        4 * gray -
        (0.299 * d[idx - 4] + 0.587 * d[idx - 3] + 0.114 * d[idx - 2]) -
        (0.299 * d[idx + 4] + 0.587 * d[idx + 5] + 0.114 * d[idx + 6]) -
        (0.299 * d[idx - w * 4] + 0.587 * d[idx - w * 4 + 1] + 0.114 * d[idx - w * 4 + 2]) -
        (0.299 * d[idx + w * 4] + 0.587 * d[idx + w * 4 + 1] + 0.114 * d[idx + w * 4 + 2]);
      sum += lap;
      sum2 += lap * lap;
      n++;
    }
  }

  const mean = sum / n;
  return sum2 / n - mean * mean;
}

/* Canvas → Base64-JPEG (ohne data:-Präfix). */
export function canvasToBase64Jpeg(canvas, quality = 0.85) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Blob failed'));
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          const idx = dataUrl.indexOf(',');
          resolve(idx > -1 ? dataUrl.slice(idx + 1) : dataUrl);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

/*
 * Nimmt mehrere Einzelbilder auf, wählt das schärfste und zeichnet es
 * auf den übergebenen Canvas (dieser wird dann nach Base64 kodiert).
 */
export async function captureSharpestFrame(video, canvas, { frames = 2, interval = 120 } = {}) {
  const ctx = canvas.getContext('2d');
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  // Mittiges Quadrat passend zum Scan-Rahmen (≈ 72 % der kürzeren Seite).
  const side = Math.min(vw, vh) * 0.72;
  const sx = (vw - side) / 2;
  const sy = (vh - side) / 2;

  canvas.width = side;
  canvas.height = side;

  const captured = [];
  for (let i = 0; i < frames; i++) {
    ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side);
    const img = ctx.getImageData(0, 0, side, side);
    captured.push({ img, sharpness: laplacianVariance(img, side) });
    if (i < frames - 1) await delay(interval);
  }

  const best = captured.reduce((a, b) => (b.sharpness > a.sharpness ? b : a));
  ctx.putImageData(best.img, 0, 0);
  return best;
}
