/**
 * ORDER SYBNB-82 — Listing/browse JSON cached briefly at the edge (CDN POP near Syria users).
 * `public` + `s-maxage` lets shared caches serve identical anonymous GETs; browsers revalidate via SWR.
 */
/** ORDER SYBNB-82 / SYBNB-104 — ~45s edge TTL band aligned with browse ISR. */
export const LISTING_EDGE_CACHE_CONTROL = "public, max-age=0, s-maxage=45, stale-while-revalidate=90";
