/* Gafit service worker: makes the app installable and keeps static assets + exercise GIFs
   available on weak gym Wi-Fi. API calls always go to the network (data must be fresh). */
const STATIC = "gafit-static-v1";
const MEDIA = "gafit-media-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(["/catalog.json", "/icons/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, MEDIA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Exercise demonstrations: cache-first, they never change.
  if (url.hostname === "static.exercisedb.dev") {
    e.respondWith(
      caches.open(MEDIA).then(async (c) => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok || res.type === "opaque") c.put(e.request, res.clone());
        return res;
      }),
    );
    return;
  }
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  // Build assets and the catalog: stale-while-revalidate.
  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/catalog.json" || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.open(STATIC).then(async (c) => {
        const hit = await c.match(e.request);
        const net = fetch(e.request)
          .then((res) => {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || net;
      }),
    );
  }
});
