const CACHE_NAME = 'ecotrack-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/calculator.html',
    '/css/style.css',
    '/js/app.js',
    '/assets/icon-192.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
