const CACHE_NAME = 'lumina-study-cache-v2';
const DYNAMIC_CACHE_NAME = 'lumina-study-dynamic-cache-v2';

const PRECACHE_ASSETS = [
  '/',
  '/logo.svg',
  '/favicon.ico',
  '/globe.svg',
  '/file.svg',
  '/window.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching shell...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Bypass check: Skip non-GET, WebSockets, Firebase, Firestore, Google APIs, and backend endpoints
  if (
    request.method !== 'GET' ||
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('hf.space') ||
    url.pathname.startsWith('/__/')
  ) {
    return;
  }

  // 2. Navigation Requests (HTML pages): Network-First, fallback to Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // 3. Static Assets: Cache-First with background Stale-While-Revalidate
  const isStaticAsset = 
    url.pathname.startsWith('/_next/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve immediately, update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const contentType = networkResponse.headers.get('content-type');
                // Guard: Do not cache index.html redirects for missing scripts/styles
                const isHtmlRedirect = contentType && contentType.includes('text/html');
                const isJsOrCss = request.url.endsWith('.js') || request.url.endsWith('.css');
                
                if (!(isJsOrCss && isHtmlRedirect)) {
                  caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse);
                  });
                }
              }
            })
            .catch(() => {
              // Ignore background sync network failures
            });
          return cachedResponse;
        }

        // Fetch from network if missing in cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const contentType = networkResponse.headers.get('content-type');
            const isHtmlRedirect = contentType && contentType.includes('text/html');
            const isJsOrCss = request.url.endsWith('.js') || request.url.endsWith('.css');
            
            if (!(isJsOrCss && isHtmlRedirect)) {
              const responseToCache = networkResponse.clone();
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
          }
          return networkResponse;
        });
      })
    );
  }
});
