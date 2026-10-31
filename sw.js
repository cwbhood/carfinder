/* CarFinder service worker (built into sw.js by src/build.js, which stamps the version from the page's content hash).
   The app is one HTML file with its data inlined, so offline is simple: the page and the fonts are cached on install,
   HTML is fetched network-first (so a deploy shows up on the next online visit) with the cache as the offline fallback,
   and fonts and emblem images are cache-first. Vehicle photos live on Wikimedia Commons and are never cached. */
const V = 'cf-1.4.0-8878ab5367';
const PRECACHE = ['carfinder.html', 'manifest.webmanifest', 'brand/fonts/fonts.css', 'brand/emblem/favicon.svg', 'brand/emblem/emblem-256.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('cf-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;                       // photos and anything external: straight to the network
  const isHTML = req.mode === 'navigate' || /\.html$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isHTML){
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('carfinder.html'))));
    return;
  }
  if (/\.(woff2?|css|svg|png|jpg|webp|webmanifest)$/.test(url.pathname)){
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)); return res; })));
  }
});
