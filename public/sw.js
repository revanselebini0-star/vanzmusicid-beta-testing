const CACHE_NAME = 'vanz-music-bg-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Keep background audio alive via periodic message ping when requested
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KEEP_ALIVE_PING') {
    if (event.source && typeof event.source.postMessage === 'function') {
      event.source.postMessage({ type: 'KEEP_ALIVE_PONG', timestamp: Date.now() });
    }
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Bypass streaming / API / hot-update requests so audio streams never stall
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('@vite') ||
    url.hostname.includes('googlevideo.com') ||
    url.hostname.includes('youtube.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
