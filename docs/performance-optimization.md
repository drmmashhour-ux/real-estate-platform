# Performance optimization (BNHub + LECIPM)

This document records the performance inventory, changes shipped in-repo, caching notes, and follow-ups. It complements CI behavior (`pnpm run build:ci`, pnpm store cache in GitHub Actions).

---

## 1. Performance inventory (surfaces)

| Surface | Role | Known pressure |
|--------|------|----------------|
| `apps/web` | Next.js App Router, Prisma, APIs | Large listing payloads, global layout client JS, search without pagination on some paths |
| `apps/admin` | Admin dashboard | Many parallel widgets (follow-up: lazy sections) |
| `apps/mobile` | Expo + TanStack Query | Guest search refetch cadence, list screens without virtualization where lists grow |
| `packages/*` | Shared UI/utils | Import paths affect bundle duplication (follow-up: `package.json` `sideEffects`, barrel audits) |
| `services/*` | Node services | Not on critical web path for every page; profile per deploy |
| `supabase/*` / Prisma | Data layer | `ShortTermListing` already has useful composite indexes (`city+listingStatus`, `city+verificationStatus`, etc.) |
| Edge / server routes | `app/api/**` | Redis-backed BNHub search cache when configured |
| Maps | `ListingMap`, search client | Map chunk is already dynamically imported (`ssr: false`); marker count / bbox debounce are follow-ups |
| Calendar | Host/admin/mobile | Range-based fetch is the main lever (follow-up per route) |
| Listing search | `lib/bnhub/listings.ts`, `/api/bnhub/search` | Was loading **all review rows** per listing for averages |
| Booking / payments | Quotes, webhooks | Sequential DB calls in hot paths (follow-up) |
| AI / chat | `ImmoChatWidget`, copilot | Global widget added main-thread work on every page |
| Media | Listing photos | Prefer `next/image` + ordered thumbnails; detail page can defer non-cover images |
| CI | `.github/workflows/ci.yml` | `cache: pnpm`, `concurrency` cancel-in-progress |

---

## 2. Fixes applied (this pass)

### Web

- **BNHub listing search** (`lib/bnhub/listings.ts`): Replaced `include: { reviews: { select: { propertyRating } } }` with a single `review.groupBy` + `_avg(propertyRating)` per result set, then attaches a **synthetic one-element** `reviews` array equal to the true average so `computeListingRankScore`, `rankListings`, and UI `getRating()` behavior stay aligned.
- **Immo chat widget**: `ImmoChatWidgetLazy` uses `next/dynamic` with `ssr: false` so the chat bundle is not part of the initial critical path on every route (`app/layout.tsx`).
- **`GET /api/bnhub/search`**: Adds `Server-Timing` for total handler time (and marks Redis cache hits) for lightweight production/staging inspection in DevTools.

### Mobile

- **Guest search** (`apps/mobile/src/app/(guest)/search.tsx`): `staleTime: 60s`, `gcTime: 5m` on the listings query to cut duplicate network work while navigating.

### Database / queries

- **Search query shape**: One aggregated query over `Review` by `listingId` instead of O(listings × reviews) row reads. Uses existing `@@index([listingId])` on `Review`.

### Listing search (specific)

- **Paginated search with dates**: Availability checks for the current page run in **parallel** (`Promise.all`) instead of a sequential `await` loop (bounded by `limit`, max 100).

### Caching (existing + notes)

- **Redis**: `/api/bnhub/search` already caches JSON responses (~60s TTL) when `isRedisConfigured()`; cache keys are param-normalized. **Do not** cache authenticated or user-specific payloads without keying by user and threat modeling.
- **TanStack Query (mobile)**: Guest search now treats identical city as fresh for 60s.

### CI / builds

- No workflow change this pass; pnpm caching remains the primary win. Full monorepo `pnpm build` still builds more than CI’s `build:ci` by design.

---

## 3. Indexes added / changed

**None in this pass.** `ShortTermListing` and `Review` already carry indexes aligned with search filters (`listingId` on reviews; city/status/price on listings). Further indexes should follow **EXPLAIN** on production-like data.

---

## 4. Bundle / build notes

- **Immo chat**: Deferred client chunk reduces initial JS for all marketing and app shells.
- **Map**: Already split via `dynamic()` in BNHub search client.
- **Follow-up**: Run `@next/bundle-analyzer` on `apps/web` and `apps/admin` periodically; dedupe heavy deps across workspaces.

---

## 5. Observability

- **Server-Timing** on `/api/bnhub/search` (optional browser “Timing” panel).
- **Follow-up**: Route-level Web Vitals reporting (small `reportWebVitals` client hook) gated to prod or sampling.

---

## 6. Remaining limits & risks

1. **`searchListings` (non-paginated)** still loads all matching rows for filters like amenities/discovery/stays applied in memory; map and legacy APIs should prefer **paginated** APIs where possible.
2. **Date-filtered search**: `total` / `hasMore` do not reflect post-availability filtering (pre-existing semantics).
3. **Parallel availability** on paginated search increases concurrent DB load vs sequential; monitor pool saturation under peak.
4. **Large text fields** on `ShortTermListing` still ship on search rows until a narrowed `select` is validated against all consumers.
5. **Admin dashboards** and **calendar** routes were not changed in this pass; they remain the next highest-impact areas for scoped lazy loading and date-range queries.

---

## 7. Recommended next steps

1. Narrow Prisma `select` for BNHub card/search responses after auditing `api/listings`, stays search, and growth landings.
2. Debounce map bbox refetch and cap visible markers; ensure server bbox queries use the same `buildPublishedListingSearchWhere` constraints.
3. Host/admin calendar: fetch only visible window + buffer; avoid full-year client merges.
4. Dashboards: above-the-fold summary endpoint + `dynamic()` for charts/tables.
5. Booking quote path: batch policy/fee reads and cache immutable listing policy per listing for short TTL.

---

## 8. Production readiness (performance angle)

**Verdict: improved but needs further work.**

Meaningful wins are in place (search DB read pattern, global chat deferral, mobile query cache, search API timing). Inventory-scale growth and dashboard/calendar routes still need targeted passes backed by profiling and EXPLAIN.
