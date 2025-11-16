// Service Worker cho Panacea PWA
// Version: 1.0.1

const CACHE_NAME = 'panacea-v1.0.1';
const RUNTIME_CACHE = 'panacea-runtime-v1.0.1';

// Assets cần cache ngay khi install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico'
  // Chỉ cache các file chắc chắn tồn tại, các file khác sẽ được cache runtime
];

// Install event - Cache assets khi service worker được cài đặt
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        // Cache từng file một để tránh lỗi nếu một file không tồn tại
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, err);
              return null; // Bỏ qua lỗi và tiếp tục
            })
          )
        );
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Install error:', error);
        // Vẫn skip waiting ngay cả khi có lỗi cache
        return self.skipWaiting();
      })
  );
});

// Activate event - Xóa cache cũ khi service worker được kích hoạt
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Xóa cache cũ nếu không phải cache hiện tại
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - Xử lý các request
self.addEventListener('fetch', (event) => {
  // Bỏ qua các request không phải HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Bỏ qua các request từ extension hoặc chrome-extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Network-first strategy cho HTML files để luôn có bản mới nhất
  const isHtmlRequest = event.request.headers.get('accept')?.includes('text/html');
  
  if (isHtmlRequest) {
    // Cho HTML: Network first, fallback to cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                console.log('[Service Worker] Caching HTML:', event.request.url);
                cache.put(event.request, responseToCache);
              });
            return response;
          }
          throw new Error('Network response was not ok');
        })
        .catch(() => {
          // Fallback to cache nếu network fail
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[Service Worker] Serving HTML from cache:', event.request.url);
                return cachedResponse;
              }
              return caches.match('/index.html');
            });
        })
    );
  } else {
    // Cho assets khác: Cache first, fallback to network
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', event.request.url);
            return cachedResponse;
          }

          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  console.log('[Service Worker] Caching new resource:', event.request.url);
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch((error) => {
              console.error('[Service Worker] Fetch failed:', error);
              return new Response('Offline - Không thể kết nối', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  }
});

// Message event - Xử lý message từ client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
    );
  }
});

// Background sync (nếu cần)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Thực hiện sync data ở đây
      Promise.resolve()
    );
  }
});

// Push notification (nếu cần)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Bạn có thông báo mới từ Panacea',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: 'panacea-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('Panacea', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

