/* Remi Premium: cache da interface para utilização offline.
   Os resultados são guardados pela aplicação em localStorage, não nesta cache. */
const CACHE_NAME = 'remi-premium-shell-2026-10-02-v1';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('remi-premium-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request=event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  // Network-first: atualizações online, com fallback offline.
  event.respondWith(
    fetch(request).then(response => {
      if(response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request,copy)));
      }
      return response;
    }).catch(async () => {
      const hit=await caches.match(request);
      if(hit) return hit;
      if(request.mode === 'navigate') {
        const fallback=await caches.match('./index.html');
        if(fallback) return fallback;
      }
      return Response.error();
    })
  );
});
