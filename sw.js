// Shopping Man — offline support
// Keeps a copy of the app on the phone so it opens in a store with no signal.
// The list data itself is kept offline by Firebase; this only handles the app files.

const VERSION = 'sm-v2-2';
const FB = 'https://www.gstatic.com/firebasejs/10.14.1/';
const APP_FILES = [
  './', './index.html', './store.js', './firebase-config.js', './manifest.json',
  './Shopping_Man.jpg', './yummy.m4a', './yuck.m4a', './output.mp3',
  './icon-192.png', './icon-512.png',
];
const SDK_FILES = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => FB + f);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Cache what we can; one missing file shouldn't block the rest.
    await Promise.all([...APP_FILES, ...SDK_FILES].map(u => cache.add(u).catch(e => console.warn('SW skip', u, e))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Firebase SDK files never change for a given version: cache first.
  if (url.href.startsWith(FB)) {
    event.respondWith(caches.match(req).then(hit => hit || fetchAndKeep(req)));
    return;
  }

  // Only our own files from here on. Leave Firestore/Auth traffic and video alone.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('.mp4') || req.headers.has('range')) return;

  // Our files: try the network (so updates arrive), fall back to the saved copy quickly.
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
    const network = fetchAndKeep(req);
    if (!cached) return network.catch(() => caches.match('./index.html'));
    const timeout = new Promise(resolve => setTimeout(() => resolve(cached), 2500));
    return Promise.race([network.catch(() => cached), timeout]);
  })());
});

async function fetchAndKeep(req) {
  const res = await fetch(req);
  if (res.ok) {
    const copy = res.clone();
    caches.open(VERSION).then(c => c.put(req, copy));
  }
  return res;
}
