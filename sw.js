/* vivMorph service worker — vanilla, dependency-free, buildless.
 *
 * Strategy
 *   - Venice proxies (/.netlify/functions/*, /api/*) and every non-GET request:
 *     never intercepted, never cached. They always hit the network.
 *   - Navigations: stale-while-revalidate against the cached shell (/index.html),
 *     with an inline offline page if nothing is cached yet.
 *   - Same-origin static files (CSS, JS, manifest, icons, logo): stale-while-revalidate.
 *   - A small allow-list of third-party CDNs (fonts, heic2any): cache-first.
 *
 * Every cache operation is wrapped so a failure (quota, private mode, a missing
 * file) degrades to plain network behaviour instead of breaking the app.
 */
const VERSION = 'v4';
const CACHE_NAME = 'vivmorph-' + VERSION;            // precached shell
const RUNTIME_CACHE = 'vivmorph-runtime-' + VERSION; // other same-origin + CDN files
const RUNTIME_MAX_ENTRIES = 60;

const SHELL_URL = '/index.html';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/assets/logo.svg',
  '/assets/logo.webp',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/favicon-32.png',
  '/assets/apple-touch-icon.png',
];

// Paths that must ALWAYS go to the network (the Venice API proxies).
const NETWORK_ONLY_PREFIXES = ['/.netlify/functions/', '/.netlify/', '/api/'];

// Third-party origins worth caching (static, versioned files only).
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

const OFFLINE_HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<meta name="theme-color" content="#0b0d10"><title>vivMorph \u2014 offline</title>' +
  '<style>html,body{height:100%;margin:0}body{display:flex;align-items:center;' +
  'justify-content:center;background:#0b0d10;color:#f2f0ec;font:16px/1.5 -apple-system,' +
  'BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;text-align:center;padding:24px}' +
  'p{color:#8b9199;margin:.5em 0 1.5em}button{background:#e8722f;color:#0b0d10;border:0;' +
  'border-radius:12px;padding:12px 22px;font-weight:600;font-size:15px;cursor:pointer}</style>' +
  '</head><body><main><h1>You\u2019re offline</h1>' +
  '<p>vivMorph needs a connection to reach the image models.<br>' +
  'Images you already made are still saved on this device.</p>' +
  '<button onclick="location.reload()">Try again</button></main></body></html>';

// ---------------------------------------------------------------- helpers

function isNetworkOnly(url) {
  return NETWORK_ONLY_PREFIXES.some((p) => url.pathname.startsWith(p));
}

function isHtmlPath(pathname) {
  return pathname === '/' || pathname.endsWith('.html');
}

// Netlify rewrites unknown paths to /index.html with a 200 (SPA redirect), so a
// missing asset would come back as HTML. Only cache HTML where HTML is expected.
function isCacheable(request, response) {
  if (!response || response.status !== 200 || response.type === 'error') return false;
  if (response.type === 'opaque' || response.redirected) return false;
  const type = response.headers.get('content-type') || '';
  if (type.includes('text/html')) {
    const path = new URL(request.url).pathname;
    return request.mode === 'navigate' || isHtmlPath(path);
  }
  return true;
}

async function trimCache(cache, max) {
  try {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
  } catch (_) { /* ignore */ }
}

async function safePut(cacheName, key, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(key, response);
    if (cacheName === RUNTIME_CACHE) await trimCache(cache, RUNTIME_MAX_ENTRIES);
  } catch (_) {
    /* quota / private mode: ignore — the network response was already served */
  }
}

async function safeMatch(key, options) {
  try {
    return await caches.match(key, options);
  } catch (_) {
    return undefined;
  }
}

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    statusText: 'Offline',
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// ---------------------------------------------------------------- lifecycle

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        // One by one, so a single missing/failed file never aborts the install
        // (cache.addAll is all-or-nothing).
        await Promise.allSettled(
          PRECACHE_URLS.map(async (url) => {
            const req = new Request(url, { cache: 'reload' });
            const res = await fetch(req);
            if (isCacheable(req, res)) await cache.put(url, res);
          })
        );
      } catch (_) { /* caching unavailable: the app still works online */ }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keep = new Set([CACHE_NAME, RUNTIME_CACHE]);
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((k) => k.startsWith('vivmorph') && !keep.has(k)).map((k) => caches.delete(k))
        );
      } catch (_) { /* ignore */ }
      try {
        if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      } catch (_) { /* ignore */ }
      await self.clients.claim();
    })()
  );
});

// Lets the page force an update: registration.waiting.postMessage('SKIP_WAITING')
self.addEventListener('message', (event) => {
  const d = event.data;
  if (d === 'SKIP_WAITING' || (d && d.type === 'SKIP_WAITING')) self.skipWaiting();
});

// ---------------------------------------------------------------- strategies

// Navigations: the app is a single document, so every navigation is served the
// cached shell instantly and the shell is refreshed in the background.
async function handleNavigation(event) {
  const { request } = event;
  const network = (async () => {
    try {
      const preloaded = await event.preloadResponse;
      const res = preloaded || (await fetch(request));
      if (isCacheable(request, res)) await safePut(CACHE_NAME, SHELL_URL, res.clone());
      return res;
    } catch (_) {
      return undefined;
    }
  })();

  const cached = (await safeMatch(SHELL_URL)) || (await safeMatch('/'));
  if (cached) {
    event.waitUntil(network); // revalidate in the background
    return cached;
  }
  return (await network) || offlineResponse();
}

// Same-origin static files: stale-while-revalidate.
async function staleWhileRevalidate(event) {
  const { request } = event;
  const path = new URL(request.url).pathname;
  const target = PRECACHE_URLS.includes(path) ? CACHE_NAME : RUNTIME_CACHE;

  const cached = await safeMatch(request, { ignoreSearch: target === CACHE_NAME });
  const network = fetch(request)
    .then(async (res) => {
      if (isCacheable(request, res)) await safePut(target, request, res.clone());
      return res;
    })
    .catch(() => undefined);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  const res = await network;
  if (res) return res;
  if (request.destination === 'document') return (await safeMatch(SHELL_URL)) || offlineResponse();
  return Response.error();
}

// Allow-listed CDN files: cache-first (versioned URLs, safe to keep).
async function cacheFirst(request) {
  const cached = await safeMatch(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && (res.ok || res.type === 'opaque')) safePut(RUNTIME_CACHE, request, res.clone());
  return res;
}

// ---------------------------------------------------------------- router

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GETs are cacheable; every Venice call is a POST and goes straight out.
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (_) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Range requests can't be answered from a full cached body.
  if (request.headers.has('range')) return;

  if (url.origin === self.location.origin) {
    // Venice proxies: never intercepted, never cached — always the network.
    if (isNetworkOnly(url)) return;
    // Never serve the worker script itself from cache.
    if (url.pathname === '/sw.js') return;

    if (request.mode === 'navigate') {
      event.respondWith(handleNavigation(event));
      return;
    }
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request).catch(() => Response.error()));
  }
  // Any other cross-origin request: browser default (network).
});
