const CACHE_NAME = 'infusion-tracker-v1';

// On install: pre-cache the app shell (index.html at the app root)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([self.location.pathname.replace(/\/service-worker\.js$/, '/') || '/']);
    })
  );
  // Take over immediately rather than waiting for old SW to be released
  self.skipWaiting();
});

// On activate: delete any old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // Claim all open clients so the SW starts controlling them without a reload
  self.clients.claim();
});

// On fetch: serve from cache, populate cache on success (cache-first for
// same-origin assets; network-only for cross-origin requests)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests to the same origin
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Only cache valid, successful, basic (same-origin) responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        return response;
      });
    })
  );
});
