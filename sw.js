/* Minimal service worker: alleen de app-shell wordt gecachet zodat de app
 * installeerbaar is en snel opent. Camerabeelden worden NOOIT gecachet
 * (die moeten altijd vers zijn). */

const SHELL = 'kapikule-shell-v35';
const ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'app.js',
  'info.js',
  'vendor/hls.light.min.js',
  'manifest.webmanifest',
  'icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Camerabeelden en alles van een andere host: altijd rechtstreeks van het net.
  if (url.origin !== self.location.origin) return;

  // App-shell: network-first zodat updates meteen doorkomen; cache is alleen
  // de vangnet-kopie voor als je offline bent.
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
