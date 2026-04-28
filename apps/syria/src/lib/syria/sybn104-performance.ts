/**
 * ORDER SYBNB-104 — Syria CDN + ISR + browse bandwidth (single source of constants).
 *
 * - Next.js `revalidate` + `unstable_cache` fall in the **30–60s** band for homepage/browse shells.
 * - Vercel edge serves HTML/static; Cloudinary hosts listing media (`next.config` remotePatterns).
 * - Cards use **one** thumbnail; full gallery loads only on `/listing/[id]`.
 */

/**
 * Segment `revalidate` export — Next.js accepts **numeric literals only** on route modules.
 * **`export const revalidate = 45`** on `[locale]/page`, `/buy`, `/rent`, `/sybnb`, `/bnhub/stays` must match this value.
 */
export const SYRIA_PUBLIC_SEGMENT_REVALIDATE_SECONDS = 45;

/** `unstable_cache` TTL for DB-backed feed fragments (aligned with segment ISR band). */
export const SYRIA_HOME_FEED_CACHE_SECONDS = 45;

/** Browse search SSR cache — anonymous `/buy` `/rent` `/sybnb` grids. */
export const SYRIA_BROWSE_SEARCH_CACHE_SECONDS = 45;

/** Verified HOTEL strip cache — same band so cron/tag bust stays predictable. */
export const SYRIA_SYBNB_HOTEL_STRIP_CACHE_SECONDS = 45;

/** CDN hint for `GET /api/feed` — shared caches (s-maxage in band; browser still revalidates). */
export const SYRIA_FEED_API_S_MAXAGE_SECONDS = 45;

/** Only first N listing-card thumbnails request `priority`/`eager` — rest lazy-load in viewport. */
export const SYRIA_CARD_PRIORITY_FIRST_COUNT = 2;

/** ORDER SYBNB-129 — profile cold `/buy` or `/sybnb` in DevTools → Network; aim ~500KB first load & minimal parallel requests on DSL emulation. */

/** Default `/buy` `/rent` page size (ORDER SYBNB-88 / SYBNB-104). */
export const SYRIA_BROWSE_PAGE_SIZE_DEFAULT = 10;

/** @deprecated SYBNB-129 — same as {@link SYRIA_BROWSE_PAGE_SIZE_DEFAULT} (data saver no longer shrinks page size). */
export const SYRIA_DATA_SAVER_BROWSE_PAGE_SIZE = SYRIA_BROWSE_PAGE_SIZE_DEFAULT;
