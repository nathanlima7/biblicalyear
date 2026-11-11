const CACHE_NAME = 'biblia-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/data.js',
  '/data/plano-2027.json',
  '/data/biblia.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/data/') || e.request.destination === 'script' || e.request.destination === 'style') {
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
  }
});