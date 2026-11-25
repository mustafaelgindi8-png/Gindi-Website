// Gindi Studio service worker: keeps the app working offline.
// Bump VERSION whenever you change files in app/ so phones pick up the update.
const VERSION = 'gindi-studio-v8';
const XLSX_JS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.svg',
  SUPABASE_JS,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The app's own files: network first so updates arrive, cached copy when offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req.mode === 'navigate' ? './index.html' : req, copy)); }
          return res;
        })
        .catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req, { ignoreSearch: true }))
    );
    return;
  }

  // Fonts and the pinned libraries never change: cache first (the Excel library is cached on first export).
  const cacheable = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || req.url === SUPABASE_JS || req.url === XLSX_JS;
  if (!cacheable) return; // Supabase API calls always go to the network.
  event.respondWith(
    caches.open(VERSION).then((cache) =>
      cache.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }))
    )
  );
});
