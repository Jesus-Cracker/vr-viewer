// VR Viewer offline support: keeps the viewer itself (not your videos) so it opens without the PC / internet.
const CACHE = "vr-viewer-v11";
const ASSETS = ["./", "index.html", "three.min.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "test_360_TB.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.includes("/files/")) return;   // PC files: never stored
  const page = e.request.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith(".html");
  if (page) {                                   // newest version when online, stored copy when offline
    e.respondWith(fetch(e.request).then((r) => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put("index.html", c)); }
      return r;
    }).catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
