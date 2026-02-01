/**
 * BoncukJS Service Worker
 * Story 3.1: Offline-first caching strategy
 * 
 * Strategy:
 * - App shell (HTML, CSS, JS): Cache-first, update in background
 * - Model files: Cache-first (large files, rarely change)
 * - API/Dynamic: Network-first with fallback
 */

const CACHE_NAME = 'boncukjs-v1';
const MODEL_CACHE = 'boncukjs-models-v1';

// App shell files to pre-cache
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Model file patterns (cached on-demand)
const MODEL_PATTERNS = [
    /\.onnx$/,
    /\.bin$/,
    /vocab\.txt$/,
    /tokenizer\.json$/,
];

// Install event - pre-cache app shell
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-caching app shell');
                return cache.addAll(APP_SHELL);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== MODEL_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Check if this is a model file
    const isModelFile = MODEL_PATTERNS.some((pattern) => pattern.test(url.pathname));

    if (isModelFile) {
        // Model files: Cache-first (they're large and rarely change)
        event.respondWith(
            caches.open(MODEL_CACHE)
                .then((cache) => {
                    return cache.match(event.request)
                        .then((cached) => {
                            if (cached) {
                                console.log('[SW] Model from cache:', url.pathname);
                                return cached;
                            }
                            console.log('[SW] Fetching model:', url.pathname);
                            return fetch(event.request)
                                .then((response) => {
                                    if (response.ok) {
                                        cache.put(event.request, response.clone());
                                    }
                                    return response;
                                });
                        });
                })
        );
        return;
    }

    // App shell: Cache-first with network fallback
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request)
                .then((cached) => {
                    const fetchPromise = fetch(event.request)
                        .then((response) => {
                            if (response.ok) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => cache.put(event.request, responseClone));
                            }
                            return response;
                        })
                        .catch(() => cached);

                    return cached || fetchPromise;
                })
        );
        return;
    }

    // External resources: Network-first
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CLEAR_MODEL_CACHE') {
        caches.delete(MODEL_CACHE)
            .then(() => {
                console.log('[SW] Model cache cleared');
                event.ports[0].postMessage({ success: true });
            });
    }
});
