const CACHE = 'sirleo-v19';
const ASSETS = [
  '/',
  '/index.html',
  '/config.js',
  '/css/style.css',
  '/js/app.js',
  '/calendar.html',
  '/contact.html',
  '/text.html',
  '/book.html',
  '/follow.html',
  '/admin.html',
  '/images/logo.jpeg',
  '/images/hero.jpeg',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;600&family=Raleway:wght@200;300;400&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
