/* ── Clock ── */
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  document.getElementById('clock').textContent = h + ':' + m;
}
updateClock();
setInterval(updateClock, 10000);

/* ── Navigation ── */
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ── Toast ── */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ── Category select ── */
function selectCat(el) {
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

/* ── Camera state ── */
let stream = null;
let facingMode = 'environment';

async function startCamera() {
  const video = document.getElementById('cam-video');
  const errBox = document.getElementById('cam-error');
  errBox.classList.remove('show');

  // Stop any existing stream
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = stream;
    video.play();
  } catch(err) {
    let msg = 'Kamera konnte nicht gestartet werden.';
    if (err.name === 'NotAllowedError')
      msg = 'Kamerazugriff verweigert.\nBitte Berechtigung in den Browser-Einstellungen erlauben.';
    else if (err.name === 'NotFoundError')
      msg = 'Keine Kamera gefunden.\nStelle sicher, dass dein Gerät eine Kamera hat.';
    else if (err.name === 'NotReadableError')
      msg = 'Kamera wird von einer anderen App verwendet.';
    document.getElementById('cam-error-msg').textContent = msg;
    errBox.classList.add('show');
  }
}

function closeCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  document.getElementById('cam-video').srcObject = null;
  document.getElementById('cam-error').classList.remove('show');
  document.getElementById('scan-overlay').classList.remove('show');
  goTo('s-home');
}

function flipCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  if (stream) startCamera();
  showToast(facingMode === 'user' ? 'Frontkamera' : 'Rückkamera');
}

function openScanner() {
  goTo('s-scanner');
  startCamera();
}

/* ── Scan trigger ── */
/* ── Real OCR scan ── */
let ocrCandidates = [];

async function triggerScan() {
  const video = document.getElementById('cam-video');
  if (!video || !video.videoWidth) {
    showToast('Kamera noch nicht bereit');
    return;
  }

  const overlay = document.getElementById('scan-overlay');
  const statusEl = document.getElementById('scan-status');
  const progEl = document.getElementById('scan-progress');
  statusEl.textContent = 'Text wird erkannt …';
  progEl.textContent = '0 %';
  overlay.classList.add('show');

  // Capture the current frame, cropped to the scan-frame region (center square)
  const canvas = document.getElementById('capture-canvas');
  const vw = video.videoWidth, vh = video.videoHeight;
  const side = Math.min(vw, vh) * 0.7;          // center 70% square ≈ scan frame
  const sx = (vw - side) / 2, sy = (vh - side) / 2;
  canvas.width = side; canvas.height = side;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side);

  // Light pre-processing: grayscale + contrast boost helps OCR on labels
  try {
    const img = ctx.getImageData(0, 0, side, side);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
      const c = g > 140 ? 255 : (g < 90 ? 0 : g); // simple threshold-ish
      d[i] = d[i+1] = d[i+2] = c;
    }
    ctx.putImageData(img, 0, 0);
  } catch(_) { /* tainted canvas unlikely here; ignore */ }

  try {
    if (typeof Tesseract === 'undefined') throw new Error('OCR lib not loaded');

    const { data } = await Tesseract.recognize(canvas, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          progEl.textContent = Math.round(m.progress * 100) + ' %';
        } else if (m.status) {
          statusEl.textContent = 'Verarbeite …';
        }
      }
    });

    overlay.classList.remove('show');
    const rawText = (data && data.text) ? data.text.trim() : '';
    ocrCandidates = extractCandidates(rawText);
    showOcrSheet(rawText, ocrCandidates);

  } catch (err) {
    overlay.classList.remove('show');
    // OCR failed → still let the user type the model manually
    ocrCandidates = [];
    showOcrSheet('', []);
    showToast('Texterkennung nicht verfügbar – bitte manuell eingeben');
  }
}

/* Pull likely device identifiers out of raw OCR text */
function extractCandidates(text) {
  if (!text) return [];
  const brands = ['iphone','ipad','macbook','imac','galaxy','redmi','pixel','thinkpad','surface',
    'oneplus','huawei','xiaomi','motorola','nokia','playstation','xbox','nintendo','gopro',
    'kindle','fairphone','poco','realme','honor'];
  // Lines that are pure marketing/safety noise — only skipped if no model token is present
  const noise = /designed by|california|made in|caution|do not open|user serviceable|warning|assembled in|this device complies/i;

  const lines = text.split(/\n+/).map(l => l.replace(/\s+/g,' ').trim()).filter(Boolean);
  const scored = [];

  const push = (t, s) => {
    let v = (t || '').trim().replace(/[.,;:]+$/,'');   // strip trailing punctuation
    if (v && v.length >= 2 && v.length <= 40) scored.push({ text: v, score: s });
  };

  // Model-number patterns (run on the ORIGINAL line, case-sensitive where it helps)
  const modelPatterns = [
    /\bModel(?:\s*(?:No|Nr|Number|Name))?\.?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9\-\/ ]{2,28})/i, // "Model: A2890", "Model No. SM-G991B"
    /\bA\d{4}\b/g,                       // Apple style: A2890
    /\b[A-Z]{2}-?[A-Z]?\d{3,5}[A-Z]{0,4}\b/g,   // SM-G991B, GA01234
    /\b\d{2}[A-Z]{2}\d{3,5}[A-Z]{0,3}\b/g,      // Lenovo 20XW0041
    /\b[A-Z]{1,4}\d{3,6}[A-Z]{0,3}\b/g,         // generic XYZ1234
    /\bMTM[:\s]*([A-Z0-9\-]{4,20})/i            // Lenovo MTM
  ];

  lines.forEach(line => {
    const lower = line.toLowerCase();
    const isNoise = noise.test(line);

    // 1) Brand/product family line (iPhone 14 Pro, Galaxy S21) — strongest
    if (!isNoise && brands.some(b => lower.includes(b))) push(line, 4);

    // 2) Explicit "Model: ..." label — very strong
    const labelMatch = line.match(modelPatterns[0]);
    if (labelMatch && labelMatch[1]) push(labelMatch[1], 3);

    // 3) Model-number tokens anywhere in the line (works even on "noise" lines)
    for (let i = 1; i < modelPatterns.length; i++) {
      const m = line.match(modelPatterns[i]);
      if (m) {
        // global patterns return array of matches; labelled ones return capture groups
        if (modelPatterns[i].global) m.forEach(tok => push(tok, 2));
        else if (m[1]) push(m[1], 2);
      }
    }
  });

  // De-dup keeping highest score, then sort by score desc
  const map = new Map();
  scored.forEach(({text, score}) => {
    const key = text.toLowerCase();
    if (!map.has(key) || map.get(key).score < score) map.set(key, { text, score });
  });
  return Array.from(map.values()).sort((a,b) => b.score - a.score).map(o => o.text).slice(0, 8);
}

/* Show the confirm sheet with raw text + tappable candidates */
function showOcrSheet(rawText, candidates) {
  const raw = document.getElementById('ocr-raw');
  const chips = document.getElementById('ocr-chips');
  const input = document.getElementById('ocr-input');
  const sub = document.getElementById('ocr-sheet-sub');
  const title = document.getElementById('ocr-sheet-title');

  if (rawText) {
    raw.textContent = rawText.slice(0, 300);
    raw.classList.remove('empty');
  } else {
    raw.textContent = 'Kein Text erkannt. Tippe das Modell unten ein.';
    raw.classList.add('empty');
  }

  chips.innerHTML = '';
  if (candidates.length) {
    title.textContent = 'Gerät erkannt?';
    sub.textContent = 'Tippe einen Vorschlag an oder korrigiere das Modell, bevor wir nach Anleitungen suchen.';
    candidates.forEach(c => {
      const chip = document.createElement('button');
      chip.className = 'ocr-chip';
      chip.textContent = c;
      chip.onclick = () => { input.value = c; };
      chips.appendChild(chip);
    });
    input.value = candidates[0];
  } else {
    title.textContent = 'Modell eingeben';
    sub.textContent = 'Es wurde kein eindeutiges Modell gefunden. Gib Marke und Modell manuell ein.';
    input.value = '';
  }

  document.getElementById('ocr-sheet').classList.add('show');
}

function hideOcrSheet() {
  document.getElementById('ocr-sheet').classList.remove('show');
}

/* User confirmed a device → close camera, set device, go to result */
function confirmOcr() {
  const input = document.getElementById('ocr-input');
  const device = input.value.trim();
  if (!device) { showToast('Bitte ein Modell eingeben'); return; }

  hideOcrSheet();
  closeCamera();

  currentDevice = device;
  setProduct(device);
  addRecent(device, '📱', 'Erkannt via Scan');
  goTo('s-result');
}

/* Update the result screen product card with the recognized device */
function setProduct(name) {
  const titleEl = document.getElementById('product-name');
  const modelEl = document.getElementById('product-model');
  if (titleEl) titleEl.textContent = name;
  if (modelEl) modelEl.textContent = 'Erkannt via OCR-Scan';
}

/* ── Recent scans ── */
function addRecent(name, icon, cat) {
  const box = document.getElementById('recent-box');
  box.innerHTML = '';
  box.style.background = 'transparent';
  box.style.padding = '0';

  const item = document.createElement('div');
  item.style.cssText = `
    display:flex; align-items:center; gap:12px;
    background:var(--bg2); border-radius:var(--radius);
    padding:clamp(10px,2.5vh,14px) clamp(12px,3vw,16px);
    cursor:pointer;
  `;
  item.innerHTML = `
    <div style="width:clamp(36px,9vw,44px);height:clamp(36px,9vw,44px);border-radius:12px;background:var(--green-dim);display:flex;align-items:center;justify-content:center;font-size:clamp(18px,5vw,24px);flex-shrink:0;">${icon}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:clamp(12px,3.2vw,15px);font-weight:600;color:var(--text);">${name}</div>
      <div style="font-size:clamp(10px,2.5vw,12px);color:var(--text3);margin-top:2px;">${cat} · Gerade gescannt</div>
    </div>
    <div style="font-size:clamp(9px,2.2vw,11px);padding:3px 8px;border-radius:20px;background:var(--green-dim);color:var(--green);font-weight:600;white-space:nowrap;">Reuse</div>
  `;
  item.onclick = () => goTo('s-result');
  box.appendChild(item);
}

/* ── External sources ── */
function openSource(url) {
  window.open(url, '_blank', 'noopener');
}

/* ══════════════════════════════════════
   iFixit API INTEGRATION
══════════════════════════════════════ */
const IFIXIT_API = 'https://www.ifixit.com/api/2.0';

// The currently scanned device — set this after a real scan/OCR result.
let currentDevice = 'iPhone 14 Pro';

// Map iFixit difficulty (string OR {name,...} object) → German label + css class
function mapDifficulty(diff) {
  if (!diff) return null;
  // Guide-detail endpoint returns an object {name, description}; search returns a string
  const raw = (typeof diff === 'object') ? (diff.name || '') : diff;
  if (!raw) return null;
  const d = raw.toLowerCase();
  if (d.includes('very') || d.includes('hard') || d.includes('difficult')) return 'Sehr schwierig';
  if (d.includes('moderate') || d.includes('medium')) return 'Mittel';
  if (d.includes('easy')) return 'Einfach';
  return raw; // fallback to raw label
}

/* Open the guides screen and kick off the search */
function openGuides() {
  document.getElementById('guides-device-label').textContent = currentDevice;
  goTo('s-guides');
  loadGuides(currentDevice);
}

/* Render loading skeletons */
function renderSkeletons() {
  const list = document.getElementById('guides-list');
  let html = '';
  for (let i = 0; i < 4; i++) {
    html += `
      <div class="skeleton-card">
        <div class="skel-img shimmer"></div>
        <div class="skel-lines">
          <div class="skel-line shimmer"></div>
          <div class="skel-line short shimmer"></div>
        </div>
      </div>`;
  }
  list.innerHTML = html;
}

/* Fetch guides — tries German results first, then any language */
async function loadGuides(device) {
  renderSkeletons();
  const badge = document.getElementById('guides-lang-badge');
  badge.style.display = 'none';

  try {
    // Primary search (language-neutral — widest coverage)
    let results = await searchGuides(device);

    if (!results || results.length === 0) {
      renderNoGuides(device);
      return;
    }

    // Guides are loaded in German (machine-translated) on open,
    // so we surface a DE badge to signal the preferred language.
    badge.textContent = 'DE';
    badge.style.display = 'block';
    renderGuides(results);

  } catch (err) {
    renderGuidesError();
  }
}

/* Call the iFixit search endpoint */
async function searchGuides(device) {
  const url = `${IFIXIT_API}/search/${encodeURIComponent(device)}`
            + `?doctypes=guide&limit=15`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('API ' + res.status);
  const data = await res.json();
  // search results live in data.results
  return (data.results || []).filter(r => r.dataType === 'guide');
}

/* Render the list of guide cards */
function renderGuides(guides) {
  const list = document.getElementById('guides-list');
  let html = '';

  guides.forEach(g => {
    const img = g.image && (g.image.standard || g.image.medium || g.image.thumbnail);
    const diff = mapDifficulty(g.difficulty);
    const type = g.type ? translateType(g.type) : null;

    const imgHtml = img
      ? `<img class="guide-card-img" src="${img}" alt="" loading="lazy" onerror="this.outerHTML='<div class=\\'guide-card-img placeholder\\'>🔧</div>'">`
      : `<div class="guide-card-img placeholder">🔧</div>`;

    let pills = '';
    if (diff)  pills += `<span class="guide-pill diff-${diff.replace(/\s/g,'.')}">${diff}</span>`;
    if (type)  pills += `<span class="guide-pill">${type}</span>`;
    if (g.category) pills += `<span class="guide-pill">${g.category}</span>`;

    html += `
      <div class="guide-card" onclick="openGuideDetail(${g.guideid})">
        ${imgHtml}
        <div class="guide-card-body">
          <h3>${escapeHtml(g.title || g.subject || 'Anleitung')}</h3>
          <div class="guide-meta">${pills}</div>
        </div>
      </div>`;
  });

  list.innerHTML = html;
}

function translateType(t) {
  const map = {
    'replacement': 'Austausch',
    'installation': 'Einbau',
    'repair': 'Reparatur',
    'disassembly': 'Zerlegung',
    'teardown': 'Teardown',
    'technique': 'Technik'
  };
  return map[t.toLowerCase()] || t;
}

/* No guides found */
function renderNoGuides(device) {
  document.getElementById('guides-list').innerHTML = `
    <div class="state-box">
      <div class="ico">🔍</div>
      <h3>Keine Anleitungen gefunden</h3>
      <p>Für „${escapeHtml(device)}" gibt es bei iFixit noch keine Reparaturanleitung. Versuche es mit einem anderen Gerät.</p>
      <button onclick="window.open('https://de.ifixit.com/Suche?query=${encodeURIComponent(device)}','_blank','noopener')">Auf iFixit.com suchen</button>
    </div>`;
}

/* API error */
function renderGuidesError() {
  document.getElementById('guides-list').innerHTML = `
    <div class="state-box">
      <div class="ico">📡</div>
      <h3>Verbindung fehlgeschlagen</h3>
      <p>Die iFixit-Datenbank ist gerade nicht erreichbar. Prüfe deine Internetverbindung und versuche es erneut.</p>
      <button onclick="loadGuides(currentDevice)">Erneut versuchen</button>
    </div>`;
}

/* ── Guide detail ── */
async function openGuideDetail(guideid) {
  goTo('s-guide-detail');
  const content = document.getElementById('detail-content');
  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;padding:60px 0;flex-direction:column;gap:16px;">
      <div class="spin-ring"></div>
      <p style="color:var(--text3);font-size:14px;">Anleitung wird geladen …</p>
    </div>`;

  try {
    let g = null;

    // 1) Try a real German version, machine-translated if needed
    try {
      const resDe = await fetch(`${IFIXIT_API}/guides/${guideid}?langid=de`, { headers: { 'Accept': 'application/json' } });
      if (resDe.ok) g = await resDe.json();
    } catch(_) { /* fall through */ }

    // 2) Fallback: source language (usually English) so we never 404 the user
    if (!g) {
      const resSrc = await fetch(`${IFIXIT_API}/guides/${guideid}?useSourceLang=1`, { headers: { 'Accept': 'application/json' } });
      if (!resSrc.ok) throw new Error('API ' + resSrc.status);
      g = await resSrc.json();
    }

    renderGuideDetail(g);
  } catch (err) {
    content.innerHTML = `
      <div class="state-box">
        <div class="ico">📡</div>
        <h3>Anleitung nicht ladbar</h3>
        <p>Die Anleitung konnte nicht geladen werden. Versuche es erneut.</p>
        <button onclick="openGuideDetail(${guideid})">Erneut versuchen</button>
      </div>`;
  }
}

function renderGuideDetail(g) {
  document.getElementById('detail-header-title').textContent = g.title || 'Anleitung';
  const content = document.getElementById('detail-content');

  const heroImg = g.image && (g.image.large || g.image.standard || g.image.medium);
  const heroHtml = heroImg
    ? `<div class="detail-hero"><img src="${heroImg}" alt="" onerror="this.parentNode.innerHTML='<div class=\\'detail-hero-fallback\\'>🔧</div>'"><div class="detail-hero-grad"></div></div>`
    : `<div class="detail-hero"><div class="detail-hero-fallback">🔧</div><div class="detail-hero-grad"></div></div>`;

  // Meta pills
  const diff = mapDifficulty(g.difficulty);
  let metaPills = '';
  if (diff) metaPills += `<span class="guide-pill diff-${diff.replace(/\s/g,'.')}">${diff}</span>`;
  if (g.time_required) metaPills += `<span class="guide-pill">⏱ ${escapeHtml(g.time_required)}</span>`;
  if (g.category) metaPills += `<span class="guide-pill">${escapeHtml(g.category)}</span>`;

  // Tools
  let toolsHtml = '';
  if (g.tools && g.tools.length) {
    toolsHtml = `<div class="detail-section"><h2>Benötigtes Werkzeug</h2>`;
    g.tools.forEach(t => {
      toolsHtml += `<div class="step-line"><span class="step-bullet">•</span><span>${escapeHtml(t.text || t.name || '')}</span></div>`;
    });
    toolsHtml += `</div>`;
  }

  // Steps
  let stepsHtml = '';
  if (g.steps && g.steps.length) {
    stepsHtml = `<div class="detail-section"><h2>Schritte (${g.steps.length})</h2>`;
    g.steps.forEach((step, idx) => {
      let stepImg = '';
      if (step.media && step.media.data && step.media.data[0]) {
        const m = step.media.data[0];
        const src = m.standard || m.medium || m.thumbnail;
        if (src) stepImg = `<img src="${src}" alt="" loading="lazy" onerror="this.style.display='none'">`;
      }
      let lines = '';
      if (step.lines && step.lines.length) {
        step.lines.forEach(line => {
          const txt = (line.text_raw || '').trim();
          if (txt) lines += `<div class="step-line"><span class="step-bullet">•</span><span>${escapeHtml(txt)}</span></div>`;
        });
      }
      stepsHtml += `
        <div class="step">
          <div class="step-num">${idx + 1}</div>
          <div class="step-body">
            ${stepImg}
            ${lines || '<div class="step-line"><span>—</span></div>'}
          </div>
        </div>`;
    });
    stepsHtml += `</div>`;
  }

  // Intro
  let introHtml = '';
  if (g.introduction_raw && g.introduction_raw.trim()) {
    introHtml = `<div class="detail-section"><h2>Einleitung</h2><p>${escapeHtml(g.introduction_raw.trim())}</p></div>`;
  }

  content.innerHTML = `
    ${heroHtml}
    <div class="detail-title-block">
      <h1>${escapeHtml(g.title || 'Anleitung')}</h1>
      <div class="detail-meta-row">${metaPills}</div>
    </div>
    ${introHtml}
    ${toolsHtml}
    ${stepsHtml}
    <div style="height: var(--gap);"></div>
    <div class="detail-cta">
      <a href="${g.url || 'https://www.ifixit.com'}" target="_blank" rel="noopener">
        Vollständige Anleitung auf iFixit
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>
      </a>
    </div>`;

  content.scrollTop = 0;
}

/* Escape HTML to prevent injection from API content */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
