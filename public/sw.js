self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open('aquaponics-shell-v1').then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/manifest.webmanifest',
    ]))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  // Cache-first for same-origin GETs
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          const copy = response.clone()
          caches.open('aquaponics-shell-v1').then((cache) => cache.put(event.request, copy))
          return response
        })
        return cached || fetchPromise
      })
    )
  }
})
