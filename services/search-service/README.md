# Search Service

Search and discovery for property listings: filters, pagination, sorting, suggestions, and map search.

**Reference:** [Database Schema Blueprint](../../docs/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), [API Architecture Blueprint](../../docs/LECIPM-API-ARCHITECTURE-BLUEPRINT.md).

---

## Features

- **Search by city** — Text filter (case-insensitive).
- **Price range** — `minPrice` / `maxPrice` (cents; applied to `nightlyPriceCents` for BNHub, or `priceCents` can be added).
- **Property type filter** — Free-text match on `propertyType`.
- **Guest capacity** — `minGuests` / `maxGuests` (vs `maxGuests` on listing).
- **Pagination** — `page` (1-based), `pageSize` (max 100).
- **Sorting** — `sort`: `price_asc`, `price_desc`, `newest`, `oldest`.
- **Search indexing logic** — `buildSearchDocument()` normalizes a property for search/API; DB indexes on (status, city, country), (status, nightlyPriceCents), (status, maxGuests), (status, propertyType), (status, latitude, longitude). Can be extended to sync to Elasticsearch/OpenSearch.

Only **LIVE** listings are returned (no auth required for search).

---

## APIs (base path `/v1/search`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/properties` | Search. Query: `city`, `country`, `minPrice`, `maxPrice`, `propertyType`, `minGuests`, `maxGuests`, `type` (MARKETPLACE_SALE \| MARKETPLACE_RENT \| BNHUB), `page`, `pageSize`, `sort`, `q` (keyword). |
| GET | `/suggestions` | Typeahead. Query: `q` (required), `field` (city \| propertyType), `limit`. |
| GET | `/map` | Map view. Query: either `minLat`, `maxLat`, `minLng`, `maxLng` or `lat`, `lng`, `radiusKm`; plus `page`, `pageSize`. Returns only properties with non-null lat/lng. |

---

## Setup

1. **Database:** Use the same `DATABASE_URL` as listing-service. Run listing-service migrations first (search-service only reads; no migrations).
2. **Generate client:** `npm run db:generate` (no `db:push` needed if listing-service already created tables).
3. **Run:** `npm run dev` (port 3004).

---

## Indexing

- **DB indexes** (in schema): composite indexes on `(status, city, country)`, `(status, nightlyPriceCents)`, `(status, maxGuests)`, `(status, propertyType)`, `(status, latitude, longitude)` for fast filtered queries.
- **Search document:** `src/search/indexer.ts` — `buildSearchDocument(property)` builds a normalized document; can be used to push to a search engine (e.g. Elasticsearch) when scaling.
