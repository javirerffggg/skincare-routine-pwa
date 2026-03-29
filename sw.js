// === The Glow PWA — Service Worker v3 ===
// Strategy:
//   - App shell (HTML/CSS/JS/icons): Cache-first, update in background
//   - Google Fonts CSS: Stale-while-revalidate
//   - Google Fonts woff2: Cache-first, long-lived (immutable)
//   - Other requests: Network-first with cache fallback

const CACHE_SHELL   = 'tg-shell-v3';
const CACHE_FONTS   = 'tg-fonts-v3';
const CACHE_DYNAMIC = 'tg-dynamic-v3';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
];

// === INSTALL: pre-cache shell ===
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_SHELL)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Shell cache failed:', err))
  );
});

// === ACTIVATE: clean old caches ===
self.addEventListener('activate', e => {
  const VALID = [CACHE_SHELL, CACHE_FONTS, CACHE_DYNAMIC];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !VALID.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// === FETCH: routing strategies ===
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // 1. Google Fonts CSS — stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com') {
    e.respondWith(staleWhileRevalidate(request, CACHE_FONTS));
    return;
  }

  // 2. Google Fonts woff2 files — cache-first (immutable)
  if (url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(request, CACHE_FONTS));
    return;
  }

  // 3. App shell assets — cache-first
  if (SHELL_ASSETS.some(a => url.pathname === a || url.pathname.endsWith(a.replace('/', '')))) {
    e.respondWith(cacheFirst(request, CACHE_SHELL));
    return;
  }

  // 4. Same-origin navigations — network-first, fallback to shell
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 5. Everything else — network-first with dynamic cache
  e.respondWith(networkFirst(request, CACHE_DYNAMIC));
});

// === STRATEGIES ===

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (response && response.status === 200)
        cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || await fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
