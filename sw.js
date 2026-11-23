// Service worker приложения «Планы»: офлайн и слабый интернет
const CACHE = 'pln-v5';
const CORE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return; // погода и прочие API — без кэша

  // Страница: сеть не дольше 3,5 с, иначе мгновенно из кэша (слабый интернет / офлайн)
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const net = fetch(req).then(r => { if (r && r.ok) cache.put('./index.html', r.clone()); return r; });
      net.catch(() => {});
      try {
        return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3500))]);
      } catch (err) {
        return (await cache.match('./index.html')) || (await cache.match('./')) ||
               new Response('Нет сети и нет сохранённой копии', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  // Остальное (шрифты, иконки): из кэша сразу, в фоне обновляем
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }).catch(() => null);
    return cached || (await net) || new Response('', { status: 504 });
  })());
});
