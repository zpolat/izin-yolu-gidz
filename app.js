/* İzin Yolu Live — reclamevrije grenspost-webcams op de route naar Turkije.
 *
 * Twee soorten camera's:
 *  - 'img'  Turkse posten (Kapıkule e.a.): losse JPG's van trakya.iscoz.com.
 *           Die bron zit achter Cloudflare (blokkeert directe hotlinks), dus we
 *           laden ze via de gratis image-proxy wsrv.nl, met een cache-buster.
 *  - 'hls'  Servische posten (Gradina, Batrovci): échte live-videostreams (m3u8)
 *           van AMSS/MUP, met CORS toegestaan → direct in de browser via hls.js.
 */

'use strict';

const ORIGIN = 'trakya.iscoz.com';
const PROXY = 'https://wsrv.nl/?url=';

// Landenvlaggen per grenspost (paar landen die de post verbindt).
const FLAGS = {
  horgos: '🇭🇺🇷🇸', kelebija: '🇭🇺🇷🇸', nadlac: '🇭🇺🇷🇴',
  batrovci: '🇭🇷🇷🇸', ilok: '🇭🇷🇷🇸', gradina: '🇷🇸🇧🇬', kapikule: '🇧🇬🇹🇷',
  hamzabeyli: '🇧🇬🇹🇷', derekoy: '🇧🇬🇹🇷', ipsala: '🇬🇷🇹🇷', pazarkule: '🇬🇷🇹🇷',
};
const gateFlag = (g) => FLAGS[g.id] || '';

// Coördinaten per grenspost (voor het weer via Open-Meteo).
const COORDS = {
  horgos: [46.16, 19.99], kelebija: [46.15, 19.60], batrovci: [45.05, 19.09],
  ilok: [45.22, 19.38], gradina: [43.00, 22.83], kapikule: [41.72, 26.33], hamzabeyli: [41.98, 26.53],
  derekoy: [41.97, 27.30], nadlac: [46.17, 20.74], ipsala: [40.92, 26.34], pazarkule: [41.68, 26.53],
};

// WMO-weercodes → emoji + Turkse omschrijving.
const WMO = {
  0: ['☀️', 'açık'], 1: ['🌤️', 'az bulutlu'], 2: ['⛅', 'parçalı bulutlu'], 3: ['☁️', 'kapalı'],
  45: ['🌫️', 'sisli'], 48: ['🌫️', 'kırağılı sis'],
  51: ['🌦️', 'çisenti'], 53: ['🌦️', 'çisenti'], 55: ['🌦️', 'yoğun çisenti'],
  56: ['🌧️', 'dondurucu çisenti'], 57: ['🌧️', 'dondurucu çisenti'],
  61: ['🌧️', 'hafif yağmur'], 63: ['🌧️', 'yağmurlu'], 65: ['🌧️', 'şiddetli yağmur'],
  66: ['🌧️', 'dondurucu yağmur'], 67: ['🌧️', 'dondurucu yağmur'],
  71: ['🌨️', 'hafif kar'], 73: ['🌨️', 'kar'], 75: ['❄️', 'yoğun kar'], 77: ['🌨️', 'kar taneleri'],
  80: ['🌦️', 'sağanak'], 81: ['🌧️', 'sağanak'], 82: ['⛈️', 'şiddetli sağanak'],
  85: ['🌨️', 'kar sağanağı'], 86: ['❄️', 'yoğun kar sağanağı'],
  95: ['⛈️', 'gök gürültülü'], 96: ['⛈️', 'dolu fırtınası'], 99: ['⛈️', 'şiddetli dolu'],
};
const wmo = (c) => WMO[c] || ['🌡️', '—'];

// Grensposten in reisvolgorde richting Turkije. Een camera met een `hls`-lijst
// is een videostream (eerste URL = primair, rest = fallback); anders een foto.
const GATES = [
  {
    id: 'horgos',
    name: 'Horgoš',
    sub: 'Macaristan ↔ Sırbistan',
    cams: [
      { hls: ['https://kamere.amss.org.rs/horgos1/horgos1.m3u8', 'https://kamere.mup.gov.rs:4443/Horgos/horgos1.m3u8'], label: 'Giriş (Macaristan → Sırbistan)', tr: 'giriş' },
      { hls: ['https://kamere.amss.org.rs/horgos2/horgos2.m3u8', 'https://kamere.mup.gov.rs:4443/Horgos/horgos2.m3u8'], label: 'Çıkış (Sırbistan → Macaristan)', tr: 'çıkış' },
    ],
  },
  {
    id: 'kelebija',
    name: 'Kelebija',
    sub: 'Macaristan ↔ Sırbistan',
    cams: [
      { hls: ['https://kamere.mup.gov.rs:4443/Kelebija/kelebija1.m3u8'], label: 'Giriş (Macaristan → Sırbistan)', tr: 'giriş' },
      { hls: ['https://kamere.mup.gov.rs:4443/Kelebija/kelebija2.m3u8'], label: 'Çıkış (Sırbistan → Macaristan)', tr: 'çıkış' },
    ],
  },
  {
    id: 'batrovci',
    name: 'Batrovci',
    sub: 'Hırvatistan ↔ Sırbistan',
    cams: [
      { hls: ['https://kamere.amss.org.rs/batrovci1/batrovci1.m3u8', 'https://kamere.mup.gov.rs:4443/Batrovci/batrovci1.m3u8'], label: 'Giriş (Hırvatistan → Sırbistan)', tr: 'giriş' },
      { hls: ['https://kamere.amss.org.rs/batrovci2/batrovci2.m3u8', 'https://kamere.mup.gov.rs:4443/Batrovci/batrovci2.m3u8'], label: 'Çıkış (Sırbistan → Hırvatistan)', tr: 'çıkış' },
    ],
  },
  {
    id: 'ilok',
    name: 'İlok',
    sub: 'Hırvatistan ↔ Sırbistan',
    cams: [
      { src: 'www.hak.hr/info/kamere/417.jpg', label: 'Genel görünüm (HR/SRB)', tr: 'genel' },
      { src: 'www.hak.hr/info/kamere/418.jpg', label: 'Kamyon & araç şeridi', tr: 'şerit' },
    ],
  },
  {
    id: 'gradina',
    name: 'Gradina',
    sub: 'Sırbistan ↔ Bulgaristan',
    cams: [
      { hls: ['https://kamere.amss.org.rs/gradina2/gradina2.m3u8', 'https://kamere.mup.gov.rs:4443/Gradina/gradina2.m3u8'], label: 'Çıkış (Sırbistan → Bulgaristan)', tr: 'çıkış' },
      { hls: ['https://kamere.amss.org.rs/gradina1/gradina1.m3u8', 'https://kamere.mup.gov.rs:4443/Gradina/gradina1.m3u8'], label: 'Giriş (Bulgaristan → Sırbistan)', tr: 'giriş' },
    ],
  },
  {
    id: 'kapikule',
    name: 'Kapıkule',
    sub: 'Bulgaristan ↔ Türkiye',
    cams: [
      { file: 'kapikule/yolcugiris.jpg',  label: 'Yolcu Girişi', tr: 'giriş' },
      { file: 'kapikule/yolcucikis.jpg',  label: 'Yolcu Çıkışı – Peronlar', tr: 'çıkış' },
      { file: 'kapikule/yolcucikis1.jpg', label: 'Yolcu Çıkışı – Hudut', tr: 'çıkış' },
      { file: 'kapikule/edirnekapi.jpg',  label: 'Edirne Kapı yönü', tr: 'çıkış' },
    ],
  },
  {
    id: 'hamzabeyli',
    name: 'Hamzabeyli',
    sub: 'Bulgaristan ↔ Türkiye',
    cams: [
      { file: 'hamzabeyli/yolcugiris.jpg', label: 'Yolcu Girişi', tr: 'giriş' },
      { file: 'hamzabeyli/yolcucikis.jpg', label: 'Yolcu Çıkışı', tr: 'çıkış' },
      { file: 'hamzabeyli/turkiyeyolu.jpg', label: 'Türkiye Yolu', tr: 'yol' },
    ],
  },
  {
    id: 'derekoy',
    name: 'Dereköy',
    sub: 'Bulgaristan ↔ Türkiye',
    cams: [
      { file: 'derekoy/hudutkapi.jpg', label: 'Hudut Kapısı', tr: 'sınır' },
      { file: 'derekoy/turkiyekapi.jpg', label: 'Türkiye Kapısı', tr: 'giriş' },
    ],
  },
  {
    id: 'nadlac',
    name: 'Nădlac',
    sub: 'Macaristan ↔ Romanya',
    cams: [],
    info: {
      text: 'Bu kapı için canlı kamera yok. Güncel bekleme süresini Romanya Sınır Polisi’nden görebilirsin:',
      linkLabel: 'Trafic Online (Sınır Polisi)',
      url: 'https://www.politiadefrontiera.ro/en/traficonline',
    },
  },
  {
    id: 'ipsala',
    name: 'İpsala',
    sub: 'Yunanistan ↔ Türkiye',
    cams: [
      { file: 'ipsala/GirisPeronlar.jpg', label: 'Giriş – Peronlar', tr: 'giriş' },
      { file: 'ipsala/Turkiye-Cikis-TurkiyeTarafi.jpg', label: 'Çıkış – Türkiye tarafı', tr: 'çıkış' },
      { file: 'ipsala/Turkiye-Giris-YunanTarafi.jpg', label: 'Giriş – Yunan tarafı', tr: 'giriş' },
    ],
  },
  {
    id: 'pazarkule',
    name: 'Pazarkule',
    sub: 'Yunanistan ↔ Türkiye',
    cams: [
      { file: 'pazarkule/yolcugiris.jpg', label: 'Yolcu Girişi', tr: 'giriş' },
      { file: 'pazarkule/yolcucikis.jpg', label: 'Yolcu Çıkışı', tr: 'çıkış' },
    ],
  },
];

const isHls = (c) => Array.isArray(c.hls);
const gateIsHls = (g) => g.cams.length > 0 && isHls(g.cams[0]);
const gateIsInfo = (g) => !!g.info; // grenspost zonder camera, alleen een link

const $ = (s, r = document) => r.querySelector(s);
const els = {
  tabs: $('#tabs'),
  grid: $('#grid'),
  weatherBar: $('#weatherBar'),
  infoView: $('#infoView'),
  footer: $('.footer'),
  status: $('#status'),
  refresh: $('#refreshBtn'),
  nightBtn: $('#nightBtn'),
  interval: $('#interval'),
  intervalRow: $('#intervalRow'),
  dataNote: $('#dataNote'),
  navLive: $('#navLive'),
  navOverview: $('#navOverview'),
  navHistory: $('#navHistory'),
  navInfo: $('#navInfo'),
  overviewView: $('#overviewView'),
  historyView: $('#historyView'),
  viewer: $('#viewer'),
  viewerImg: $('#viewerImg'),
  viewerVideo: $('#viewerVideo'),
  viewerTitle: $('#viewerTitle'),
  viewerSub: $('#viewerSub'),
  viewerClose: $('#viewerClose'),
  viewerShare: $('#viewerShare'),
  toast: $('#toast'),
};

const store = {
  get gate() { return localStorage.getItem('gate') || 'kapikule'; },
  set gate(v) { localStorage.setItem('gate', v); },
  get mode() { return localStorage.getItem('mode') || 'live'; },
  set mode(v) { localStorage.setItem('mode', v); },
  get night() { return localStorage.getItem('night') === '1'; },
  set night(v) { localStorage.setItem('night', v ? '1' : '0'); },
  get histGate() { return localStorage.getItem('histGate') || ''; },
  set histGate(v) { localStorage.setItem('histGate', v); },
  get interval() {
    const v = localStorage.getItem('interval');
    return v === null ? 20 : parseInt(v, 10);
  },
  set interval(v) { localStorage.setItem('interval', String(v)); },
};

let timer = null;
let lastUpdate = 0;
let viewerCam = null;
let viewerGate = null;
let viewerTimer = null;
let toastTimer = null;

function camUrl(cam) {
  // Bron: cam.src (volledig host/pad, bv. HAK) of cam.file (relatief t.o.v.
  // trakya.iscoz.com). Cache-buster (%3F_%3D) zodat proxy én browser telkens
  // een vers beeld ophalen.
  const source = cam.src || `${ORIGIN}/${cam.file}`;
  return `${PROXY}${source}%3F_%3D${Date.now()}`;
}

function currentGate() {
  return GATES.find((g) => g.id === store.gate) || GATES[0];
}

/* ---------- HLS-streams ---------- */

function stopWatchdog(video) {
  if (video && video._wd) { clearInterval(video._wd); video._wd = null; }
}

function destroyHls(video) {
  if (!video) return;
  stopWatchdog(video);
  if (video._hls) { try { video._hls.destroy(); } catch (e) {} video._hls = null; }
  try { video.pause(); } catch (e) {}
}

// Duwt een vastgelopen live-video terug naar de live-rand en hervat afspelen.
function nudgeLive(video) {
  try {
    const b = video.buffered;
    if (b && b.length) {
      const end = b.end(b.length - 1);
      if (end - video.currentTime > 4) video.currentTime = end - 0.5;
    }
    if (video.paused) video.play().catch(() => {});
  } catch (e) { /* ignore */ }
}

// Controleert elke paar seconden of de video nog vooruit loopt; zo niet -> herstel.
function startWatchdog(video) {
  stopWatchdog(video);
  video._lastT = -1;
  video._stuck = 0;
  video._wd = setInterval(() => {
    if (!video._hls && !video.src) return;
    const advancing = video.currentTime !== video._lastT;
    video._lastT = video.currentTime;
    if (video.paused) { video.play().catch(() => {}); return; }
    if (advancing) { video._stuck = 0; return; }
    video._stuck += 1;
    if (video._stuck < 3) { nudgeLive(video); return; }
    // Langdurig vast: stream opnieuw opzetten (pakt een vers venster als de bron
    // weer loopt). Hooguit 1x per 30s, tegen dataverspilling bij dode bron.
    const now = Date.now();
    if (video._cam && now - (video._lastReattach || 0) > 30000) {
      video._lastReattach = now;
      video._stuck = 0;
      attachStream(video, video._cam, () => {});
    } else {
      nudgeLive(video);
    }
  }, 4000);
}

// Koppelt een videostream aan een <video>; probeert de fallback-URL's op volgorde.
// cb(true) = speelt, cb(false) = mislukt.
function attachStream(video, cam, cb) {
  destroyHls(video);
  video._cam = cam;
  const urls = cam.hls;
  let idx = 0;
  let recoveries = 0;

  function tryUrl() {
    const url = urls[idx];
    if (!url) { cb(false); return; }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 20, liveSyncDurationCount: 3, backBufferLength: 10 });
      video._hls = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { cb(true); video.play().catch(() => {}); startWatchdog(video); });
      hls.on(Hls.Events.ERROR, (evt, data) => {
        if (!data) return;
        if (!data.fatal) {
          if (data.details === 'bufferStalledError') nudgeLive(video);
          return;
        }
        // Fatale fout: eerst proberen te herstellen (max 2x), anders fallback-URL.
        if (recoveries < 2 && data.type === 'networkError') { recoveries += 1; try { hls.startLoad(); return; } catch (e) {} }
        if (recoveries < 2 && data.type === 'mediaError') { recoveries += 1; try { hls.recoverMediaError(); return; } catch (e) {} }
        destroyHls(video);
        idx += 1;
        (idx < urls.length) ? tryUrl() : cb(false);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS speelt HLS zelf af.
      video.src = url;
      video.onloadeddata = () => { cb(true); startWatchdog(video); };
      video.onerror = () => { idx += 1; (idx < urls.length) ? tryUrl() : cb(false); };
      video.play().catch(() => {});
    } else {
      cb(false);
    }
  }
  tryUrl();
}

/* ---------- Rendering ---------- */

function renderTabs() {
  els.tabs.innerHTML = '';
  GATES.forEach((g) => {
    const b = document.createElement('button');
    b.className = 'tab';
    b.innerHTML = `<span class="tab-flag">${gateFlag(g)}</span> ${g.name}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(g.id === store.gate));
    b.addEventListener('click', () => {
      store.gate = g.id;
      renderTabs();
      renderGrid();
      scheduleTimer();
      tickStatus();
    });
    els.tabs.appendChild(b);
  });
}

function cleanupGrid() {
  els.grid.querySelectorAll('video').forEach(destroyHls);
}

function setCardState(card, state) {
  card.classList.remove('loaded', 'error');
  if (state === 'ok') card.classList.add('loaded');
  else if (state === 'err') card.classList.add('error');
}

function renderGrid() {
  const gate = currentGate();
  cleanupGrid();
  loadWeather(gate);
  els.grid.innerHTML = '';

  // Grenspost zonder camera (bv. Nădlac): toon een kaart met wachttijd-link.
  if (gateIsInfo(gate)) {
    els.grid.innerHTML = `
      <article class="cam cam-info">
        <span class="ci-icon">🛂</span>
        <p class="ci-text">${gate.info.text}</p>
        <a class="ci-cta" href="${gate.info.url}" target="_blank" rel="noopener">${gate.info.linkLabel} ↗</a>
      </article>`;
    els.intervalRow.style.display = 'none';
    els.dataNote.hidden = true;
    lastUpdate = Date.now();
    return;
  }

  gate.cams.forEach((cam) => {
    const hls = isHls(cam);
    const card = document.createElement('article');
    card.className = 'cam';
    card.innerHTML = `
      <div class="cam-media">
        <div class="cam-skeleton"></div>
        <div class="cam-error">
          <svg viewBox="0 0 24 24" width="30" height="30"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
          <small>${hls ? 'Yayın şu anda kullanılamıyor.' : 'Görüntü şu anda kullanılamıyor.'} Lütfen tekrar deneyin.</small>
          <button class="cam-retry" type="button">Tekrar dene</button>
        </div>
        ${hls
          ? `<video muted playsinline autoplay preload="none"></video>`
          : `<img alt="${cam.label} — ${gate.name}" referrerpolicy="no-referrer" decoding="async" />`}
        <div class="cam-overlay">
          <span class="cam-live${hls ? ' live-video' : ''}"><span class="live-dot"></span>CANLI</span>
          <button class="cam-share" type="button" aria-label="Paylaş" title="Paylaş">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.66 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
          </button>
          <div class="cam-label">
            <strong>${cam.label}</strong>
            <small>${gate.name} · ${cam.tr}</small>
          </div>
          <span class="cam-clock" aria-hidden="true"></span>
        </div>
      </div>`;

    if (hls) {
      const video = $('video', card);
      setCardState(card, 'loading');
      attachStream(video, cam, (ok) => setCardState(card, ok ? 'ok' : 'err'));
      $('.cam-retry', card).addEventListener('click', (e) => {
        e.stopPropagation();
        setCardState(card, 'loading');
        attachStream(video, cam, (ok) => setCardState(card, ok ? 'ok' : 'err'));
      });
    } else {
      const img = $('img', card);
      img.addEventListener('load', () => setCardState(card, 'ok'));
      img.addEventListener('error', () => setCardState(card, 'err'));
      $('.cam-retry', card).addEventListener('click', (e) => {
        e.stopPropagation();
        loadImg(card, cam);
      });
      loadImg(card, cam);
    }

    $('.cam-share', card).addEventListener('click', (e) => {
      e.stopPropagation();
      shareCam(gate, cam, hls ? $('video', card) : null);
    });
    card.addEventListener('click', () => openViewer(gate, cam));
    card._cam = cam;
    els.grid.appendChild(card);
  });

  // Voettekst: interval-keuze alleen voor fotocamera's; datawaarschuwing voor video.
  const hlsGate = gateIsHls(gate);
  els.intervalRow.style.display = hlsGate ? 'none' : '';
  els.dataNote.hidden = !hlsGate;

  updateClocks();
  lastUpdate = Date.now();
}

// CCTV-stijl klok rechtsonder op elk beeld (huidige tijd).
function updateClocks() {
  const t = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  els.grid.querySelectorAll('.cam-clock').forEach((el) => { el.textContent = t; });
}

function loadImg(card, cam) {
  setCardState(card, 'loading');
  $('img', card).src = camUrl(cam);
}

/* ---------- Verversen (alleen fotocamera's) ---------- */

function refreshAll() {
  els.grid.querySelectorAll('.cam').forEach((card) => {
    const cam = card._cam;
    if (!cam) return;
    if (isHls(cam)) attachStream($('video', card), cam, (ok) => setCardState(card, ok ? 'ok' : 'err'));
    else loadImg(card, cam);
  });
  lastUpdate = Date.now();
  els.refresh.classList.remove('spin');
  void els.refresh.offsetWidth;
  els.refresh.classList.add('spin');
}

function scheduleTimer() {
  if (timer) { clearInterval(timer); timer = null; }
  const g = currentGate();
  if (gateIsHls(g) || gateIsInfo(g)) return; // live video of link-post: geen interval
  const secs = store.interval;
  if (secs > 0) timer = setInterval(refreshAll, secs * 1000);
}

function tickStatus() {
  if (store.mode !== 'live') return;
  if (gateIsInfo(currentGate())) {
    els.status.textContent = 'Canlı kamera yok · bekleme süresi linki';
    return;
  }
  if (gateIsHls(currentGate())) {
    els.status.textContent = '🔴 canlı yayın';
    return;
  }
  if (!lastUpdate) return;
  const s = Math.round((Date.now() - lastUpdate) / 1000);
  let txt;
  if (s < 3) txt = 'az önce güncellendi';
  else if (s < 60) txt = `${s} sn önce güncellendi`;
  else txt = `${Math.floor(s / 60)} dk önce güncellendi`;
  const mode = store.interval > 0 ? `· her ${store.interval} sn'de yenilenir` : '· elle';
  els.status.textContent = `${txt} ${mode}`;
}

/* ---------- Fullscreen viewer ---------- */

function openViewer(gate, cam) {
  viewerCam = cam;
  viewerGate = gate;
  els.viewerTitle.textContent = cam.label;
  els.viewerSub.textContent = `${gate.name} · ${cam.tr}`;
  const hls = isHls(cam);
  els.viewerImg.hidden = hls;
  els.viewerVideo.hidden = !hls;
  if (viewerTimer) { clearInterval(viewerTimer); viewerTimer = null; }

  if (hls) {
    attachStream(els.viewerVideo, cam, () => {});
  } else {
    els.viewerImg.src = camUrl(cam);
    viewerTimer = setInterval(() => {
      if (viewerCam) els.viewerImg.src = camUrl(viewerCam);
    }, Math.max(5, store.interval || 15) * 1000);
  }

  els.viewer.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeViewer() {
  els.viewer.hidden = true;
  document.body.style.overflow = '';
  viewerCam = null;
  if (viewerTimer) { clearInterval(viewerTimer); viewerTimer = null; }
  destroyHls(els.viewerVideo);
  els.viewerVideo.removeAttribute('src');
}

/* ---------- Bilgi (info) sekmesi ---------- */

function valueHtml(v, kind) {
  if (!v) return '';
  if (kind === 'tel') {
    const num = v.replace(/[^+0-9]/g, '');
    return `<a href="tel:${num}">${v}</a>`;
  }
  if (kind === 'web') {
    const url = /^https?:/.test(v) ? v : `https://${v}`;
    return `<a href="${url}" target="_blank" rel="noopener">${v}</a>`;
  }
  return v;
}

function renderInfo() {
  const cats = (window.INFO || []).map((cat, i) => `
    <details class="info-cat"${i === 0 ? ' open' : ''}>
      <summary><span class="ic">${cat.icon}</span>${cat.title}</summary>
      <div class="info-body">
        ${cat.intro ? `<p class="info-intro">${cat.intro}</p>` : ''}
        ${cat.items ? `<ul class="info-list">${cat.items.map((it) => `<li>${it}</li>`).join('')}</ul>` : ''}
        ${cat.groups ? cat.groups.map((g) => `
          <div class="info-group">
            <h4>${g.name}</h4>
            ${g.rows.map((r) => `<div class="info-row"><span class="k">${r[0]}</span><span class="v">${valueHtml(r[1], r[2])}</span></div>`).join('')}
            ${g.note ? `<p class="info-note">${g.note}</p>` : ''}
          </div>`).join('') : ''}
      </div>
    </details>`).join('');
  els.infoView.innerHTML = cats +
    `<p class="info-disclaimer">Bilgiler resmi kaynaklardan derlenmiştir (Temmuz 2026) ancak değişebilir. Şüphede resmi siteyi/numarayı kullanın.</p>`;
}

/* ---------- Özet / Genel bakış (overview) ---------- */

async function renderOverview() {
  // Voor video-gates gebruiken we de laatst vastgelegde frame uit de history-index.
  if (!historyIndex) {
    try {
      const r = await fetch(`${HISTORY_BASE}/history/index.json?t=${Date.now()}`);
      if (r.ok) historyIndex = await r.json();
    } catch { /* geen frames = placeholder */ }
  }
  if (store.mode !== 'overview') return;

  const hgates = (historyIndex && historyIndex.gates) || {};
  const cards = GATES.map((gate) => {
    if (gateIsInfo(gate)) {
      return `<button class="ov-card" data-gate="${gate.id}">
        <div class="ov-thumb"><div class="ov-noimg">🛂</div></div>
        <div class="ov-cap">${gateFlag(gate)} ${gate.name}</div></button>`;
    }
    const cam0 = gate.cams[0];
    let thumb; let badge;
    if (isHls(cam0)) {
      const list = hgates[gate.id] || [];
      const last = list.length ? list[list.length - 1].url : null;
      thumb = last ? `<img src="${last}" loading="lazy" alt="" />` : `<div class="ov-noimg">🎥</div>`;
      badge = last ? '~son kare' : 'canlı';
    } else {
      thumb = `<img src="${camUrl(cam0)}&w=400" loading="lazy" referrerpolicy="no-referrer" alt="" />`;
      badge = 'canlı';
    }
    return `<button class="ov-card" data-gate="${gate.id}">
      <div class="ov-thumb">${thumb}<span class="ov-type">${badge}</span></div>
      <div class="ov-cap">${gateFlag(gate)} ${gate.name}</div></button>`;
  }).join('');

  els.overviewView.innerHTML = `<div class="ov-grid">${cards}</div>`;
  els.overviewView.querySelectorAll('[data-gate]').forEach((b) => {
    b.addEventListener('click', () => { store.gate = b.dataset.gate; setMode('live'); });
  });
}

/* ---------- Geçmiş (history) ---------- */

const HISTORY_BASE = 'https://kaimajvv9hct8hsj.public.blob.vercel-storage.com';
// Kapılar die worden vastgelegd (met tijdzone voor lokale uur-weergave).
const HGATES = [
  { id: 'horgos', name: 'Horgoš', tz: 'Europe/Belgrade' },
  { id: 'batrovci', name: 'Batrovci', tz: 'Europe/Belgrade' },
  { id: 'gradina', name: 'Gradina', tz: 'Europe/Belgrade' },
  { id: 'kapikule', name: 'Kapıkule', tz: 'Europe/Istanbul' },
];

let historyIndex = null;
let historyLoadedAt = 0;
let histDay = null;

function localParts(ts, tz) {
  const d = new Date(ts * 1000);
  return {
    dayKey: d.toLocaleDateString('en-CA', { timeZone: tz }),
    dayLabel: d.toLocaleDateString('tr-TR', { timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit' }),
    hour: d.toLocaleTimeString('tr-TR', { timeZone: tz, hour: '2-digit', minute: '2-digit' }),
  };
}

async function renderHistory() {
  els.historyView.innerHTML = '<div class="hist-msg">Geçmiş yükleniyor…</div>';
  if (!historyIndex || Date.now() - historyLoadedAt > 120000) {
    try {
      const r = await fetch(`${HISTORY_BASE}/history/index.json?t=${Date.now()}`);
      if (!r.ok) throw new Error('http');
      historyIndex = await r.json();
      historyLoadedAt = Date.now();
    } catch (e) {
      els.historyView.innerHTML = '<div class="hist-msg">Geçmiş verisi alınamadı. Bağlantını kontrol et.</div>';
      return;
    }
  }
  if (store.mode !== 'history') return;

  const gates = (historyIndex && historyIndex.gates) || {};
  const avail = HGATES.filter((g) => gates[g.id] && gates[g.id].length);
  if (!avail.length) {
    els.historyView.innerHTML = '<div class="hist-msg">Henüz kayıtlı görüntü yok.<br>Sistem her saat kare biriktirir; birkaç saat sonra burada belirir.</div>';
    return;
  }
  let sel = store.histGate;
  if (!sel || !avail.some((g) => g.id === sel)) sel = avail[0].id;
  store.histGate = sel;
  const gate = HGATES.find((g) => g.id === sel);

  // Groepeer entries per lokale dag.
  const entries = gates[sel].slice().sort((a, b) => a.ts - b.ts);
  const byDay = {};
  const days = [];
  for (const e of entries) {
    const p = localParts(e.ts, gate.tz);
    if (!byDay[p.dayKey]) { byDay[p.dayKey] = { key: p.dayKey, label: p.dayLabel, items: [] }; days.push(byDay[p.dayKey]); }
    byDay[p.dayKey].items.push({ url: e.url, hour: p.hour });
  }
  days.sort((a, b) => b.key.localeCompare(a.key)); // nieuwste dag eerst
  if (!histDay || !byDay[histDay]) histDay = days[0].key;

  els.historyView.innerHTML = `
    <div class="hist-row">${avail.map((g) => `<button class="hpill${g.id === sel ? ' on' : ''}" data-g="${g.id}">${FLAGS[g.id] || ''} ${g.name}</button>`).join('')}</div>
    <div class="hist-row">${days.map((d) => `<button class="hpill${d.key === histDay ? ' on' : ''}" data-d="${d.key}">${d.label}</button>`).join('')}</div>
    <div class="hist-grid">${byDay[histDay].items.map((it) => `
      <button class="hist-cell" data-url="${it.url}" data-h="${it.hour}">
        <img src="${it.url}" loading="lazy" alt="${gate.name} ${it.hour}" />
        <span class="hc-hour">${it.hour}</span>
      </button>`).join('')}</div>`;

  els.historyView.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { store.histGate = b.dataset.g; histDay = null; renderHistory(); }));
  els.historyView.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { histDay = b.dataset.d; renderHistory(); }));
  els.historyView.querySelectorAll('.hist-cell').forEach((b) => b.addEventListener('click', () => openHistoryImage(b.dataset.url, `${gate.name} · ${b.dataset.h}`, byDay[histDay].label)));
}

function openHistoryImage(url, title, sub) {
  viewerCam = null; viewerGate = null;
  if (viewerTimer) { clearInterval(viewerTimer); viewerTimer = null; }
  destroyHls(els.viewerVideo);
  els.viewerVideo.hidden = true;
  els.viewerImg.hidden = false;
  els.viewerImg.src = url;
  els.viewerTitle.textContent = title;
  els.viewerSub.textContent = sub;
  els.viewer.hidden = false;
  document.body.style.overflow = 'hidden';
}

/* ---------- Modus: Canlı / Geçmiş / Bilgi ---------- */

function setMode(mode) {
  store.mode = mode;
  const live = mode === 'live';
  const overview = mode === 'overview';
  const history = mode === 'history';
  const info = mode === 'info';

  els.tabs.hidden = !live;
  els.weatherBar.hidden = !live;
  els.grid.hidden = !live;
  els.footer.hidden = !live;
  els.refresh.style.display = live ? '' : 'none';
  els.overviewView.hidden = !overview;
  els.infoView.hidden = !info;
  els.historyView.hidden = !history;
  els.navLive.setAttribute('aria-selected', String(live));
  els.navOverview.setAttribute('aria-selected', String(overview));
  els.navHistory.setAttribute('aria-selected', String(history));
  els.navInfo.setAttribute('aria-selected', String(info));

  if (live) {
    renderGrid();
    scheduleTimer();
    tickStatus();
    return;
  }

  if (timer) { clearInterval(timer); timer = null; }
  cleanupGrid();
  window.scrollTo(0, 0);

  if (overview) {
    els.status.textContent = 'Genel bakış · tüm kapılar';
    renderOverview();
  } else if (history) {
    els.status.textContent = 'Geçmiş · saatlik kareler';
    renderHistory();
  } else {
    els.status.textContent = 'Yol bilgileri & numaralar';
    if (!els.infoView._built) { renderInfo(); els.infoView._built = true; }
  }
}

/* ---------- Gece netleştir ---------- */

function applyNight() {
  const on = store.night;
  document.body.classList.toggle('night', on);
  els.nightBtn.classList.toggle('on', on);
  els.nightBtn.setAttribute('aria-pressed', String(on));
}

/* ---------- Weer (hava durumu) ---------- */

const weatherCache = {}; // gate.id -> { t, data }
let weatherOpen = false; // 3-daagse uitklap open/dicht

function loadWeather(gate) {
  const c = COORDS[gate.id];
  if (!c) { els.weatherBar.hidden = true; return; }
  els.weatherBar.hidden = false;

  const cached = weatherCache[gate.id];
  if (cached && Date.now() - cached.t < 15 * 60 * 1000) {
    renderWeather(gate, cached.data);
    return;
  }
  els.weatherBar.innerHTML = '<div class="wb-msg">🌡️ hava yükleniyor…</div>';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c[0]}&longitude=${c[1]}`
    + '&current=temperature_2m,weather_code,wind_speed_10m'
    + '&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=3&timezone=auto';

  fetch(url).then((r) => {
    if (!r.ok) throw new Error('weer');
    return r.json();
  }).then((data) => {
    weatherCache[gate.id] = { t: Date.now(), data };
    if (currentGate().id === gate.id) renderWeather(gate, data);
  }).catch(() => {
    if (currentGate().id === gate.id) {
      els.weatherBar.innerHTML = '<div class="wb-msg">hava durumu alınamadı</div>';
    }
  });
}

function renderWeather(gate, data) {
  const cur = data.current;
  const d = data.daily;
  const [ic, label] = wmo(cur.weather_code);
  const names = ['Bugün', 'Yarın'];
  let detail = '';
  for (let i = 0; i < d.time.length; i++) {
    const [di] = wmo(d.weather_code[i]);
    const name = names[i] || new Date(d.time[i]).toLocaleDateString('tr-TR', { weekday: 'short' });
    detail += `<span class="wd"><b>${name}</b> ${di} ${Math.round(d.temperature_2m_max[i])}°/${Math.round(d.temperature_2m_min[i])}°</span>`;
  }
  els.weatherBar.innerHTML = `
    <button class="wb-main" type="button" aria-expanded="${weatherOpen}">
      <span class="wb-cur">${ic} ${Math.round(cur.temperature_2m)}° · ${label}</span>
      <span class="wb-wind">rüzgâr ${Math.round(cur.wind_speed_10m)} km/s</span>
      <span class="wb-caret">${weatherOpen ? '⌄' : '›'}</span>
    </button>
    <div class="wb-detail"${weatherOpen ? '' : ' hidden'}>${detail}</div>`;

  els.weatherBar.querySelector('.wb-main').addEventListener('click', () => {
    weatherOpen = !weatherOpen;
    els.weatherBar.querySelector('.wb-detail').hidden = !weatherOpen;
    els.weatherBar.querySelector('.wb-caret').textContent = weatherOpen ? '⌄' : '›';
    els.weatherBar.querySelector('.wb-main').setAttribute('aria-expanded', String(weatherOpen));
  });
}

/* ---------- Delen (share) ---------- */

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

// Probeer het huidige beeld als JPEG-bestand te maken (voor foto's én video's).
// Mislukt dit (CORS/taint/support), dan valt shareCam terug op alleen de link.
async function frameBlob(cam, mediaEl) {
  if (isHls(cam)) {
    const v = mediaEl;
    if (!v || !v.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    return await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
  }
  const resp = await fetch(camUrl(cam.file), { mode: 'cors' });
  if (!resp.ok) return null;
  return await resp.blob();
}

async function shareCam(gate, cam, mediaEl) {
  const url = `${location.origin}${location.pathname}?gate=${gate.id}`;
  const title = 'İzin Yolu Gidz';
  const text = `${gate.name} sınır kapısı — canlı kamera 👇`;

  let file = null;
  try {
    const blob = await frameBlob(cam, mediaEl);
    if (blob) file = new File([blob], `${gate.id}.jpg`, { type: 'image/jpeg' });
  } catch (e) { /* beeld kon niet, we delen alleen de link */ }

  try {
    if (navigator.canShare && file && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: `${text}\n${url}` });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return; // gebruiker annuleerde
  }

  // Terugval: kopieer de link
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    toast('Bağlantı kopyalandı 📋');
  } catch (e) {
    toast('Paylaşım bu cihazda desteklenmiyor');
  }
}

/* ---------- Wiring ---------- */

function init() {
  // Gedeelde link (?gate=<id>) opent meteen de juiste grenspost in live-modus.
  const wanted = new URLSearchParams(location.search).get('gate');
  if (wanted && GATES.some((g) => g.id === wanted)) {
    store.gate = wanted;
    store.mode = 'live';
  }

  renderTabs();

  els.interval.value = String(store.interval);
  els.interval.addEventListener('change', () => {
    store.interval = parseInt(els.interval.value, 10);
    scheduleTimer();
    tickStatus();
  });

  els.refresh.addEventListener('click', refreshAll);
  els.nightBtn.addEventListener('click', () => { store.night = !store.night; applyNight(); });
  applyNight();
  els.navLive.addEventListener('click', () => setMode('live'));
  els.navOverview.addEventListener('click', () => setMode('overview'));
  els.navHistory.addEventListener('click', () => setMode('history'));
  els.navInfo.addEventListener('click', () => setMode('info'));
  els.viewerShare.addEventListener('click', () => {
    if (viewerGate && viewerCam) {
      shareCam(viewerGate, viewerCam, isHls(viewerCam) ? els.viewerVideo : null);
    }
  });
  els.viewerClose.addEventListener('click', closeViewer);
  els.viewer.addEventListener('click', (e) => { if (e.target === els.viewer) closeViewer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeViewer(); });

  setMode(store.mode);
  setInterval(() => { tickStatus(); updateClocks(); }, 1000);

  // Bij onzichtbaar tabblad: stop verversen én streams (bespaart data/accu).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (timer) { clearInterval(timer); timer = null; }
      cleanupGrid();
      destroyHls(els.viewerVideo);
    } else if (store.mode === 'live') {
      renderGrid();
      scheduleTimer();
      if (!els.viewer.hidden && viewerCam && isHls(viewerCam)) {
        attachStream(els.viewerVideo, viewerCam, () => {});
      }
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
