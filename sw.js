// Offline play, latest version when online: network first, cache as fallback.
// Requests skip the browser's HTTP cache (GitHub Pages sends max-age=600) and revalidate
// with the server, so a deploy shows up on the next launch. Offline, or when no response arrives within 3 s, the
// cached copy is used.
const CACHE = 'override-3';   // a new name drops the old cache, see activate; only override- caches, the origin is shared with Kiln and Splice
const SHELL = ['./', 'index.html', 'style.css', 'fonts/barlow-semi-condensed-latin-400.woff2', 'fonts/barlow-semi-condensed-latin-600.woff2',
  'fonts/share-tech-mono-latin-400.woff2',
  'src/core.js', 'src/levels.js', 'src/bot.js', 'src/worker.js', 'src/ui.js', 'manifest.webmanifest',
  'lang/languages.json', 'lang/en.json',
  'art/deck.webp', 'art/key-l.webp', 'art/key-r.webp', 'art/lock-closed.webp', 'art/lock-open.webp', 'art/plug.webp', 'art/sticker-42.webp', 'art/sticker-eye.webp', 'art/sticker-skull.webp', 'art/sticker-voidwalk.webp',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'no-cache' })))));
  self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('override-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const key = url.origin + url.pathname;   // one cache entry per file, whatever the query string
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 3000);   // bounds the wait for headers only
      let r;
      try { r = await fetch(e.request.url, { cache: 'no-cache', signal: ac.signal }) }   // by URL: navigation requests cannot take options
      finally { clearTimeout(timer) }
      if (r.ok) c.put(key, r.clone());
      return r;
    } catch {
      return (await c.match(key)) || Response.error();
    }
  })());
});
