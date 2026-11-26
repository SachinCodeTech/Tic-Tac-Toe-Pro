const CACHE_NAME = 'tic-tac-toe-pro-v2.13.0';
const ASSETS = [
  '/',
  '/index.html',
  '/privacy.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/apple-touch-icon.png',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/pwa-maskable-512x512.png'
];

async function precacheFresh() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    ASSETS.map(async (assetUrl) => {
      const response = await fetch(new Request(assetUrl, { cache: 'reload' }));
      if (response && response.ok) {
        await cache.put(assetUrl, response.clone());
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheFresh()
      .catch(() => caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'CLEAR_AND_RECACHE') {
    const port = event.ports && event.ports[0];
    event.waitUntil(
      (async () => {
        try {
          // Verify network reachability before wiping active offline bundle
          const probe = await fetch(new Request('/index.html', { cache: 'reload' }));
          if (probe && probe.ok) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
            await precacheFresh();
            if (port) port.postMessage({ ok: true, mode: 'refreshed' });
            return;
          }
        } catch {
          // Offline fallback: clear only stale caches and keep core offline bundle intact
        }

        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
        if (port) port.postMessage({ ok: true, mode: 'offline-safe' });
      })()
    );
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isHtmlOrNav =
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.webmanifest');

  // Network-first for HTML & manifest so updates appear immediately online, with full offline fallback
  if (isHtmlOrNav) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const exact = await caches.match(event.request, { ignoreSearch: true });
          if (exact) return exact;
          if (url.pathname.endsWith('privacy.html')) {
            const privacy = await caches.match('/privacy.html');
            if (privacy) return privacy;
          }
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Cache-first for static icons & assets with network fill
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
