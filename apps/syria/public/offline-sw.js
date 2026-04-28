/* eslint-disable no-restricted-globals */
/**
 * Stale-while-revalidate for HTML, static assets, and safe GET API responses.
 * Does not replace auth — responses use default browser credentials when SW passes through.
 */
const RUNTIME_CACHE = "lecipm-syria-swr-v1";
const API_CACHE = "lecipm-syria-api-swr-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== RUNTIME_CACHE && k !== API_CACHE && k.startsWith("lecipm-syria-")).map((k) => caches.delete(k)),
      );
    })(),
  );
});

/**
 * @param {Request} request
 * @param {Cache} cache
 */
async function staleWhileRevalidate(request, cache) {
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then(async (response) => {
    if (response.ok) {
      const copy = response.clone();
      await cache.put(request, copy);
    }
    return response;
  });
  return cached || networkFetch;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    /** Keep API cache light — search + static JSON only */
    const allowApi =
      url.pathname.startsWith("/api/search") ||
      url.pathname.startsWith("/api/session/snapshot") ||
      url.pathname.startsWith("/api/lite/");

    if (!allowApi) return;

    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        return staleWhileRevalidate(req, cache);
      })(),
    );
    return;
  }

  /** HTML + Next static */
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      return staleWhileRevalidate(req, cache);
    })(),
  );
});
