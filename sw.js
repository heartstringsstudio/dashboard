const CACHE = 'heartstrings-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './qrcode.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.origin === location.origin) {
    if (e.request.mode === 'navigate') {
      // Always check for the latest page, falling back to the offline shell.
      e.respondWith(
        fetch(e.request).then((res) => {
          if (!res.ok) return res;
          const copy = res.clone();
          return caches.open(CACHE)
            .then((c) => c.put('./index.html', copy))
            .then(() => res);
        }).catch(() => caches.match('./index.html'))
      );
    } else {
      // Show cached assets immediately, then refresh them for the next request.
      const cached = caches.match(e.request);
      const refreshed = fetch(e.request).then((res) => {
        if (!res.ok) return res;
        const copy = res.clone();
        return caches.open(CACHE)
          .then((c) => c.put(e.request, copy))
          .then(() => res);
      });
      e.waitUntil(refreshed.catch(() => undefined));
      e.respondWith(cached.then((hit) => hit || refreshed));
    }
  } else if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    // Fonts: stale-while-revalidate so offline keeps the brand typefaces
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const net = fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
