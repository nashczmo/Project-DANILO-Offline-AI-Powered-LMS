const CACHE_NAME = "danilo-static-v6";
const STATIC_FILES = [
  "/", "/offline.html", "/manifest.webmanifest",
  "/icons/icon-192.svg", "/icons/icon-512.svg",
  "/fonts/Inter-Regular.woff2", "/fonts/Inter-Medium.woff2",
  "/fonts/Inter-SemiBold.woff2", "/fonts/Inter-Bold.woff2",
];

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>DANILO — Offline</title>
<style>body{font-family:Inter,system-ui,sans-serif;background:#0F172A;color:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0}main{text-align:center;padding:2rem}h1{font-size:1.25rem;font-weight:600;margin-bottom:0.5rem}p{font-size:.875rem;color:#CBD5E1;margin:0}</style>
</head><body><main><h1>DANILO is offline</h1><p>The local portal could not be reached. Refresh after the gateway is back online.</p></main></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/ws")) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((network) => {
        if (network.ok) caches.open(CACHE_NAME).then((c) => c.put(request, network.clone()));
        return network;
      }).catch(() => cached);
      return cached || fetchPromise.catch(() => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html;charset=utf-8" }, status: 503 }));
    })
  );
});
