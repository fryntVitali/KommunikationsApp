const CACHE_NAME = 'tellpal-v4';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/i18n.js',
    './js/data.js',
    './js/storage.js',
    './js/app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Cache-first strategy: serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    event.respondWith(
        caches.match(request, { ignoreSearch: true }).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        }).catch(() => {
            // Offline fallback for navigation
            if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
                return caches.match('./index.html');
            }
        })
    );
});

// Respond to cache-status messages from the app
self.addEventListener('message', (event) => {
    if (event.data === 'CHECK_CACHE_STATUS') {
        caches.open(CACHE_NAME).then((cache) => {
            return cache.keys();
        }).then((keys) => {
            const allCached = ASSETS.length <= keys.length;
            event.source.postMessage({ type: 'CACHE_STATUS', ready: allCached });
        });
    }
});
