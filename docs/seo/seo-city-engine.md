# SEO City Pages Engine (LECIPM)

Programmatic, data-backed SEO pages for city hubs, neighborhoods, investment, broker recruitment, and BNHUB rental/stay discovery. Content is **structured** and **varies by market stats** to limit duplicate copy; listings and stays pull from live data where the database is available.

## Location

- Module: `apps/web/modules/seo-city/`
- Public exports: `apps/web/modules/seo-city/index.ts`
- UI building blocks: `apps/web/modules/seo-city/components/`

## Page types and routes

All routes live under the app’s locale and country prefix, for example: `/{locale}/{country}/city/{citySlug}/...`.

| Kind | Path segment | Notes |
|------|----------------|-------|
| City hub | `/city/{city}` | Main city page; metadata + `SeoCityContentSections` use the generator |
| Neighborhood | `/city/{city}/n/{area}` | Area from `neighborhoodRegistry` |
| Investment | `/city/{city}/investment` | Existing marketing route; metadata can use `INVESTMENT` kind from the engine |
| Brokers | `/city/{city}/brokers` | Partner messaging + CTAs |
| Rentals / BNHUB | `/city/{city}/rentals` | Short stays angle; `rent` segment may be canonical in some pages |

**Routing services:** `seo-city-routing.service.ts` builds segment paths (without locale; compose with `withLocaleCountryPath` when needed from the same module).

## Generation logic

1. **`seo-city-generator.service.ts` — `generateSeoCityModel(kind, citySlug, opts?)`**
   - Loads `fetchSeoCityMarketStats` and `fetchSeoListingsPreview` from Prisma-powered listings.
   - Builds `content` via `seo-city-content.service` (per kind).
   - Merges internal links: `buildCityInternalLinks` plus investment, brokers, rentals, and top neighborhoods.

2. **Content** — `seo-city-content.service.ts`
   - City intro does **not** repeat the hero blurb; it adds stats and neighborhood names from the registry to avoid on-page duplicate paragraphs.
   - `contentFingerprint` is a versioned, deterministic id for change detection (not a cryptographic hash).

3. **Metadata** — `seo-city-metadata.service.ts` — `buildSeoMetadataBundle`
   - Title, description, keywords, OpenGraph, canonical path. Descriptions are capped for SERP.

## SEO structure

- One primary topic per URL; canonical set in metadata.
- Internal links in `internalLinks` and in `SeoCityContentSections` to neighborhoods, buy/rent/invest hubs, and BNHUB.
- Sitemap: `app/sitemap.ts` emits `city` index, `brokers`, `rentals`, and each `/city/{slug}/n/{area}` for `CITY_SLUGS` (see sitemap for priorities).

## Performance and leads

- **`SeoCityTracker`** (client) records a page view path into local storage telemetry (`seo-city-pages.service.ts`). Extend the same store for click events if you add explicit tracking hooks.
- For production analytics, wire `recordSeoCityPageView` to your analytics API as needed.

## Admin / overrides

- **Rollout:** City pages can be hidden via `isCitySearchPageEnabled` in `modules/multi-city/cityRolloutGate` until a market is ready.
- **Copy experiments:** `writeSeoCityOverrideClient` / `readSeoCityOverrides` use `localStorage` key `lecipm-seo-city-overrides-v1` (browser-only). A dedicated admin screen lists this and links; server-rendered copy does not read these overrides until persisted in the database.

Admin UI: `/{locale}/{country}/admin/seo-city` (role-gated by admin layout).

## Tests

- `apps/web/modules/seo-city/__tests__/seo-city-engine.test.ts` — metadata, content blocks, routing helpers.

```bash
cd apps/web && pnpm test -- modules/seo-city
```

## Mobile and UX

City templates use the shared Tailwind patterns (responsive grids, readable type). Keep hero sections light; defer heavy map work below the fold where possible.
