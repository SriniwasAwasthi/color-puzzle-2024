const CACHE_NAME = "puzzle-2024-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request).then((res) => {
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((cache) => {
        if (e.request.method === "GET" && e.request.url.startsWith("http")) {
          cache.put(e.request, resClone);
        }
      });
      return res;
    }).catch(() => {
      return caches.match(e.request);
    })
  );
});
