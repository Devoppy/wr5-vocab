const CACHE_NAME = "wr5-vocab-cache-v2"; // bump version to force update

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
];

// INSTALL: cache app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ACTIVATE: delete old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

// FETCH:
// - NEVER cache-bypass icons/manifest: always go network (prevents stale PWA metadata)
// - Cache-first only for APP_SHELL
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Don’t mess with non-GET
  if (e.request.method !== "GET") return;

  // Always fetch fresh for manifest + icons (PWA metadata must not be stale)
  if (
    url.pathname.endsWith("/manifest.json") ||
    url.pathname.endsWith("icon-192.png") ||
    url.pathname.endsWith("icon-512.png")
  ) {
    e.respondWith(fetch(e.request, { cache: "no-store" }));
    return;
  }

  // Cache-first for app shell only
  if (APP_SHELL.some((p) => url.pathname.endsWith(p.replace("./", "")) || url.pathname.endsWith("/wr5-vocab/"))) {
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request))
    );
    return;
  }

  // Default: network
  e.respondWith(fetch(e.request));
});
