const CACHE = 'mera-vyapaar-v1'
const ASSETS = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
})

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request).catch(() => caches.match('/index.html'))
    })
  )
})
