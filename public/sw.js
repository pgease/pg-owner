/* PG Ease Service Worker — App Shell Precache + Safe StaleWhileRevalidate */
const CACHE_VERSION = "pgease-sw-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/offline.html",
  "/fonts/Poppins-Regular.ttf",
  "/fonts/Poppins-Medium.ttf",
  "/fonts/Poppins-SemiBold.ttf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("pgease-sw-") && k !== SHELL_CACHE && k !== API_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data?.type === "CLEAR_API_CACHE") {
    event.waitUntil(caches.delete(API_CACHE));
  }
});

function isNeverCacheApi(url) {
  const p = url.pathname;
  return (
    p.includes("/otp") ||
    p.includes("/auth") ||
    p.includes("/refresh-token") ||
    p.includes("/logout") ||
    p.includes("/record-payment") ||
    p.includes("/checkout")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Navigation requests: network-first, fallback to cached index.html, then offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put("/index.html", copy));
          }
          return res;
        })
        .catch(async () => {
          const cachedShell = await caches.match("/index.html");
          if (cachedShell) return cachedShell;
          const offlineFallback = await caches.match("/offline.html");
          return offlineFallback || new Response("Offline", { status: 503 });
        }),
    );
    return;
  }

  // Safe GET API reads: StaleWhileRevalidate
  if (url.pathname.startsWith("/api/") && !isNeverCacheApi(url)) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((res) => {
            if (res.ok) {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => null);
        return cached || (await networkPromise) || new Response(JSON.stringify({ offline: true }), { status: 503 });
      }),
    );
    return;
  }

  // Static assets (JS/CSS/fonts/images): cache-first / network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/fonts/"))) {
              const copy = res.clone();
              caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
  }
});
