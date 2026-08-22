/* Service Worker · 韩男养成中心
   缓存所有页面，装一次之后断网/不开 VPN 也能用 */
const CACHE_NAME = "skincare-site-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./checkin.html",
  "./wiki.html",
  "./diary.html",
  "./achievements.html",
  "./quotes.html",
  "./style.css",
  "./common.js",
  "./manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
