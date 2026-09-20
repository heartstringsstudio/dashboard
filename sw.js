const CACHE_PREFIX = "heartstrings-dashboard-";
const CACHE = `${CACHE_PREFIX}v16`;
const SHELL = [
  "./",
  "./index.html",
  "./studio.css?v=13",
  "./studio.js?v=13",
  "./card.html",
  "./card.css?v=2",
  "./card.js?v=3",
  "./manifest.json",
  "./logo.png",
  "./assets/control-room.webp",
  "./assets/studio-card-banner.webp",
  "./icon-192.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./qrcode.min.js",
  "./fonts/dm-sans-latin.woff2",
  "./fonts/libre-caslon-display-400-latin.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  if (url.origin === location.origin) {
    if (e.request.mode === "navigate") {
      // Always check for the latest page, falling back to the offline shell.
      e.respondWith(
        fetch(e.request)
          .then((res) => {
            if (!res.ok) return res;
            const copy = res.clone();
            return caches
              .open(CACHE)
              .then((c) => c.put(e.request, copy))
              .then(() => res);
          })
          .catch(() =>
            caches
              .match(e.request)
              .then((hit) => hit || caches.match("./index.html")),
          ),
      );
    } else {
      // Show cached assets immediately, then refresh them for the next request.
      const cached = caches.match(e.request);
      const refreshed = fetch(e.request).then((res) => {
        if (!res.ok) return res;
        const copy = res.clone();
        return caches
          .open(CACHE)
          .then((c) => c.put(e.request, copy))
          .then(() => res);
      });
      e.waitUntil(refreshed.catch(() => undefined));
      e.respondWith(cached.then((hit) => hit || refreshed));
    }
  }
});
