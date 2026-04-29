/* eslint-disable no-restricted-globals */
/**
 * SYBNB PWA — small footprint: minimal precache, cache-first static, lite API SWR,
 * navigation network-first with offline fallback. Compatible with Ultra‑lite routes.
 */
const VERSION = "syria-sw-v2";
const PRECACHE = `${VERSION}-precache`;
const RUNTIME = "lecipm-syria-swr-v1";
const API_CACHE = "lecipm-syria-api-swr-v1";
const NAV_RUNTIME = `${VERSION}-nav`;

const OFFLINE_FALLBACK_PATH = "/ar/offline";

const PRECACHE_PATHS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/ar/offline",
  "/en/offline",
  "/ar",
  "/en",
  "/ar/lite/listings",
  "/en/lite/listings",
];

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/_next/image") ||
    /\.(?:js|css|woff2?|png|jpe?g|gif|svg|ico|webp|avif)$/i.test(pathname)
  );
}

/**
 * @param {Request} request
 * @param {string} cacheName
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

/**
 * @param {Request} request
 * @param {string} cacheName
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  });
  return cached || networkFetch;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await Promise.all(
        PRECACHE_PATHS.map((path) => {
          const url = new URL(path, self.location.origin);
          return fetch(url, { credentials: "same-origin" })
            .then((res) => (res.ok ? cache.put(url.toString(), res) : null))
            .catch(() => {});
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    const allowApi =
      url.pathname.startsWith("/api/search") ||
      url.pathname.startsWith("/api/session/snapshot") ||
      url.pathname.startsWith("/api/lite/");
    if (!allowApi) return;

    event.respondWith(staleWhileRevalidate(req, API_CACHE));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(req, RUNTIME));
    return;
  }

  const acceptsHtml = req.headers.get("accept")?.includes("text/html");
  if (req.mode === "navigate" || acceptsHtml) {
    event.respondWith(navigateWithOfflineFallback(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req, RUNTIME));
});

/**
 * @param {Request} request
 */
async function navigateWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(NAV_RUNTIME);
      await cache.put(request.url, response.clone());
      await trimNavCache(cache, 12);
    }
    return response;
  } catch {
    /** offline — replay last known document if possible */
  }

  const cached = await caches.match(request.url);
  if (cached) return cached;

  const offlinePrecached = await caches.match(new URL(OFFLINE_FALLBACK_PATH, self.location.origin).toString());
  if (offlinePrecached) return offlinePrecached;

  /** Fallback fetch offline shell without relying on Request clone quirks */
  const fbUrl = new URL(OFFLINE_FALLBACK_PATH, self.location.origin).toString();
  const fbCached = await caches.match(fbUrl);
  if (fbCached) return fbCached;

  return fetch(new Request(fbUrl, { credentials: "same-origin" }));
}

/**
 * @param {Cache} cache
 * @param {number} maxEntries
 */
async function trimNavCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const stale = keys.slice(0, keys.length - maxEntries);
  await Promise.all(stale.map((k) => cache.delete(k)));
}
