// service-worker.js
const CACHE_NAME = 'ewidencja-v1-2024-06-21';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/favicon.svg',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
  'https://unpkg.com/feather-icons'
];

// Install SW and cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(urlsToCache)
    )
  );
  self.skipWaiting();
});

// Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Serve cache-first for own files, fallback to network
self.addEventListener('fetch', event => {
  // Don't intercept API requests (like NBP API)
  if (event.request.url.startsWith('https://api.nbp.pl')) return;
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request).then(fetchRes => {
        // Optionally: cache new requests
        return fetchRes;
      })
    ).catch(() =>
      // Fallback: show offline page, or a simple message for HTML requests
      event.request.mode === 'navigate'
        ? new Response('<h2 style="text-align:center;margin-top:40px;">Jesteś offline.<br>Brak połączenia z internetem.</h2>', {
            headers: {'Content-Type': 'text/html'}
          })
        : undefined
    )
  );
});
