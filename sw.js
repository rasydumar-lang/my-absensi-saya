const CACHE_NAME = 'absensi-cache-v1';
// This list should include all the static assets your app needs to run offline.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // The browser will request this file
  '/vite.svg',  // The icon used in index.html and manifest
  '/manifest.json'
  // External assets are harder to cache reliably due to CORS,
  // so we'll let the browser handle them, and they'll be fetched from network.
  // The app will work offline as long as these scripts are cached by the browser's standard HTTP cache.
  // For a true offline experience, these would need to be served from our own domain or have CORS headers.
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response from cache
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
