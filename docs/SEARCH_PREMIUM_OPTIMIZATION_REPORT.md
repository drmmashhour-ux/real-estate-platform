# BNHub search — premium optimization report

**Scope:** `/search/bnhub` nightly-stay discovery (smart bar, filters, AI assist, map, saves, analytics, tests).

## Features implemented

| Area | Implementation |
|------|------------------|
| **Smart search bar** | Large hero field + sticky filter bar; accepts city text, Canadian postal-style tokens, `LEC-#####` (with/without hyphen). |
| **Autocomplete** | `GET /api/bnhub/search/suggest` → cities (cached distinct) + listings; client shows **Recent** from `localStorage`. |
| **Filters** | Price min/max (per night), guests, dates, property type, room type, min beds/baths/bedrooms, amenities (client refines amenities), **radius + map center** (bounding box + “Use my location”). |
| **Buy / rent** | BNHub remains nightly; **Projects** link (`/projects`) for long-term / sale UX. |
| **AI-assisted search** | `POST /api/ai/search/intent` with `context: "nightly_stay"` → applies `locationHint`, price caps/floors, property type, sort. |
| **Map** | Existing `MapView`; markers link to `/bnhub/{listingCode\|id}`. |
| **Instant results** | `router.replace` + `fetch` without full page reload; debounced typing (300ms) for the search box. |
| **Result cards** | Image, price/night, city, beds/baths/guests, AI labels; deep link prefers **listing code**. |
| **Save search** | `localStorage` (`bnhub_saved_searches_v1`); modal to re-apply query string; copy for future **alerts** (account settings). |
| **Sort** | Best match (AI), price ↑/↓, newest, most viewed (mapped to API `popular`). |
| **Recent searches** | `bnhub_recent_searches_v1`; chips in hero, location dropdown, mobile sheet. |
| **Mobile** | Full-screen filter sheet; larger touch targets on key selects; collapsed primary “Filters” entry. |
| **Performance** | Client cache per query key + page; infinite scroll observer; server pagination via `page`/`limit`. |
| **Analytics** | `POST /api/ai/activity` with `eventType: "search"`, query string, `metadata` (`source: bnhub_search`, sort, filter flags). **Requires signed-in user** (401 otherwise — safe no-op). |

## Technical notes

- **Shared WHERE:** `lib/bnhub/build-search-where.ts` — postal OR, LEC normalization, radius AND, order-by helper.
- **Client merge:** `mergeLocationIntoFilters` keeps the search box (`locationInput`) and structured filters in sync for URL + API.
- **Listing URLs:** Prefer `listingCode` for SEO/shareable links when present.

## Testing

- **Unit:** `apps/web/lib/bnhub/build-search-where.test.ts` (Vitest) — LEC, postal OR, radius bounds, sort mapping.
- **Manual QA suggested:** typeahead latency, LEC-only search, mobile filter sheet, map marker navigation, saved search round-trip.

## Known limitations / follow-ups

1. **Analytics volume:** Activity logging only for authenticated sessions; consider a privacy-safe anonymous metric endpoint if product needs full funnel data.
2. **Radius accuracy:** Bounding box is fast but not a true haversine circle; acceptable for UX; upgrade to raw SQL distance if needed.
3. **Amenities:** Still partially client-filtered after fetch — total counts can diverge when amenity checkboxes are on; move to DB/JSON filter when schema allows.
4. **Alerts:** Saved search UI is ready; email/push digests need product + backend jobs.
5. **Buy/rent:** Not a single unified DB search; cross-link to Projects is intentional for this codebase.

## Search performance (observations)

- Suggest endpoint: bounded `take`, city list cached 5 minutes.
- Search route: indexed filters + pagination; avoid `limit` > 50 for TTFB.
- Client: debounce + in-memory page cache reduces duplicate requests while scrolling/filtering.

---

*Generated as part of the premium BNHub search optimization initiative.*
