/* Service Worker der Denk-Werkstatt: alles offline aus dem Cache.
   Relative Pfade (die Seite liegt unter /<repo>/). Der Cache-Name enthält die
   Build-Version (setzt werkzeuge/web-bauen.mjs ein), alte Caches werden beim
   Aktivieren gelöscht. So kommen nach einem Update sicher die neuen Levels. */
'use strict';

const VERSION = '__VERSION__';
const PRAEFIX = 'denk-werkstatt-';
const CACHE = PRAEFIX + VERSION;
const DATEIEN = __DATEIEN__;

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE)
      // cache: 'reload' umgeht den HTTP-Cache, damit wirklich die Dateien dieser Version im Cache landen
      .then((c) => c.addAll(DATEIEN.map((d) => new Request(d, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n.startsWith(PRAEFIX) && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // Jede Seite der App ist index.html (Routen stehen nach dem #)
    ev.respondWith(
      caches.open(CACHE)
        .then((c) => c.match('./index.html'))
        .then((r) => r || fetch(req))
    );
    return;
  }
  ev.respondWith(
    caches.open(CACHE)
      .then((c) => c.match(req, { ignoreSearch: true }))
      .then((r) => r || fetch(req))
  );
});
