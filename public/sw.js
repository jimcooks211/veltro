// Service Worker for Veltro PWA
const CACHE_NAME = 'veltro-v1'
const STATIC_CACHE = 'veltro-static-v1'
const DYNAMIC_CACHE = 'veltro-dynamic-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/pwa-64x64.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/maskable-icon-512x512.png',
  '/apple-touch-icon-180x180.png',
  '/favicon.ico',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
})

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip API calls and external resources
  if (url.pathname.startsWith('/api/') ||
      url.origin !== self.location.origin ||
      url.protocol === 'data:') {
    return
  }

  // Network first strategy for HTML pages
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the response
          const clone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone)
          })
          return response
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request)
        })
    )
    return
  }

  // Cache first strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone)
          })
        }
        return response
      })
    })
  )
})

// Background sync for offline actions (optional)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  // Handle background sync events here
})

// Push notification support (optional)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event.data)
  // Handle push notifications here
})

console.log('[SW] Service worker loaded')
