// TULA service worker: lets field officers open the app and work with no network.
// - On install it caches the app shell and every /assets file referenced by index.html.
// - Page navigations: network first, cached shell when offline (all routes are client-side).
// - Static assets: cache first.
// - /api calls are never cached. The app queues work while offline and syncs later.

const VERSION = 'tula-shell-v4';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/logo/tula-logo-badge.png', '/favicon.ico', '/icons/favicon-32.png', '/icons/icon-192.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL).catch(() => {});
    try {
      const html = await (await fetch('/index.html', { cache: 'no-store' })).text();
      const assets = new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => m[1]));
      // Page chunks are loaded lazily; find them inside the entry scripts so they work offline too.
      for (const a of [...assets].filter(x => x.endsWith('.js'))) {
        try {
          const js = await (await fetch(a)).text();
          for (const m of js.matchAll(/assets\/[\w.-]+\.(?:js|css)/g)) assets.add('/' + m[0]);
        } catch { /* skip */ }
      }
      await cache.addAll([...assets]);
      await cache.put('/index.html', new Response(html, { headers: { 'Content-Type': 'text/html' } }));
    } catch {
      /* first install while offline: runtime caching fills in later */
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put('/index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        return (await caches.match('/index.html')) || (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/logo/'))) {
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch {
      return Response.error();
    }
  })());
});
