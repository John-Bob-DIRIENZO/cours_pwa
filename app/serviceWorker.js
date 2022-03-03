const CACHE_VERSION = "V4";

const CACHED_FILES = [
    "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
    "http://localhost:1234/images/dog.png",
    "http://localhost:1234/favicon.ico"
];

self.addEventListener('install', event => {
    self.skipWaiting()

    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_VERSION);
        await Promise.all([...CACHED_FILES, '/offline.html'].map(path => {
            return cache.add(path);
        }))
    })());
})

self.addEventListener('activate', event => {
    self.clients.claim();

    event.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.map(key => {
            if (!key.includes(CACHE_VERSION)) {
                return caches.delete(key);
            }
        })))
    )
})

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const preloadResponse = await event.preloadResponse;
                if (preloadResponse) {
                    return preloadResponse;
                }
                return await fetch(event.request);
            } catch (e) {
                return caches.match('/offline.html');
            }
        })());
    } else if (CACHED_FILES.includes(event.request.url)) {
        event.respondWith(caches.match(event.request));
    }
})



