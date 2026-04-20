# Unified intelligence layer (single source of truth)

One read model for admin and investor surfaces: canonical autonomy runs first, then event timeline, then legal/trust/growth services, with explicit source status when data is missing.

## Types

- **`UnifiedListingIntelligence`** — CRM/Syria listing-level signals (price, bookings, payouts, region keys).
- **`UnifiedListingReadModel`** — serialized facets (`observation`, `preview`, `compliance`, `legalRisk`, `trust`, `ranking`, `growth`, `governance`, `execution`, `auditSummary`) for the single-pane admin panel.
- **`UnifiedIntelligenceSummary`** — platform-wide freshness and recent IDs.

## Services

- **`unified-intelligence.service.ts`** — `getUnifiedListingIntelligence`, `buildUnifiedListingReadModel`, `buildUnifiedIntelligenceSummary`, `buildUnifiedEntityIntelligence`
- **`unified-intelligence.repository.ts`** — `getCanonicalRunsForListingTarget`, `listUnifiedRecentListingIds`, `getUnifiedListingReadModel` pattern (canonical `autonomousMarketplaceRun` preferred)

## APIs

- **`GET /api/admin/unified-intelligence/listing?listingId=…`**
- **`GET /api/admin/unified-intelligence/summary`**

Both require admin; responses avoid raw document payloads.

## Feature flag

- `FEATURE_UNIFIED_INTELLIGENCE_V1`

## Legacy fallback

When canonical tables are empty, facets may be partial — `UnifiedIntelligenceSourceStatus` records `missing` / `partial` with notes; never invent conflicting duplicates.
