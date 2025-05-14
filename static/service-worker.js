// Service Worker for LanguagePal app

const CACHE_NAME = 'languagepal-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/offline',
  '/static/css/style.css',
  '/static/icons/apple-touch-icon.png',
  '/static/icons/icon-192x192.png',
  '/static/icons/icon-512x512.png',
  'https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network, and show offline page if needed
self.addEventListener('fetch', event => {
  // Skip caching for all JavaScript files to prevent stale UI issues
  if (event.request.url.match(/\.js($|\?)/)) {
    return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();

        // For HTML pages (except API requests), handle offline fallback
        const isHTMLPage = fetchRequest.headers.get('Accept')?.includes('text/html');
        const isAPIRequest = fetchRequest.url.includes('/api/');
        
        if (isHTMLPage && !isAPIRequest) {
          return fetch(fetchRequest)
            .then(response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Cache the fetched response
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // If the network is unavailable, show the offline page
              return caches.match('/offline');
            });
        }
        
        // For other assets and API requests, try network
        return fetch(fetchRequest)
          .catch(error => {
            console.error('Fetch failed:', error);
            
            // For images, show a placeholder
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
                '<rect width="200" height="200" fill="#212529"/>' +
                '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6c757d">' +
                'Offline' +
                '</text>' +
                '</svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            // For API requests that fail, return a JSON error
            if (isAPIRequest) {
              return new Response(
                JSON.stringify({
                  error: 'You are offline. Please check your connection and try again.'
                }),
                { headers: { 'Content-Type': 'application/json' } }
              );
            }
            
            // For HTML pages, show the offline page
            if (isHTMLPage) {
              return caches.match('/offline');
            }
            
            // For other resources, just fail
            throw error;
          });
      })
  );
});