# LECIPM SEO Engine

Programmatic SEO helpers for listings, city and neighborhood pages, BNHub stays, investor surfaces, residence-services hubs, and editorial content. Outputs are **deterministic templates** intended for **human review** before publish — do not ship thin or duplicate pages automatically.

## Targets

| Surface | Module usage |
| -------- | ------------- |
| Listing detail | `generateListingMetadata` |
| City / area | `generateCityPageMetadata` |
| BNHub stays | `generateStayMetadata` |
| Residence services | `generateResidenceMetadata` |
| Landing pages | `buildLandingPageSuggestion`, `listLandingPageCandidates` |
| Blog / editorial | `buildEditorialContentBrief` |
| Internal linking | `buildInternalLinkPlan` |
| Performance | `createPlaceholderSeoPerformanceSnapshot` (+ future GSC/GA4) |

## Flow

1. **Keyword cluster** (`buildKeywordPlan`) — primary, secondary, long-tail, content angle by hub (marketplace, BNHub, investor, residence_services).
2. **Metadata bundle** — title ≤ ~60 chars, meta description ≤ ~155, canonical path suggestion, OG fields.
3. **Landing candidates** — route suggestion, H1, intro, sections, internal link targets (review for uniqueness).
4. **Content brief** — outline + CTA + guardrail validation (`validateBriefGuardrails`).
5. **Internal linking graph** — hub-relative paths and anchor suggestions.
6. **Performance** — placeholder counts and notes until Search Console / analytics wiring.

## Quality rules

- Premium, accurate, **location-led** copy.
- No keyword stuffing; no fake inventory counts unless sourced from data.
- No investment performance guarantees.
- **Residence services**: coordination platform only — no healthcare, clinical monitoring, or medical claims (`SEO_FORBIDDEN_TERMS` + copy review).
- BNHub: no guaranteed occupancy or revenue.

## Review workflow

1. Generate drafts in **Dashboard → Marketing → SEO Engine**.
2. Editorial review for uniqueness, factual anchors, and local compliance.
3. Publish via CMS / Marketing Studio / site routes — **no auto-publish** of bulk thin URLs.

## Internal linking model

`buildInternalLinkPlan(localePrefix)` returns a small graph from homepage → listings, BNHub, investor, residence-services, blog. Extend with real route inventory as hubs grow.

## Performance tracking

`seo-performance.service` exposes placeholders:

- Pages generated (internal counter hook).
- Indexed targets estimate (manual or GSC API later).
- CTR / conversions — `null` until GA4 events mapped (`organic_landing`, `listing_view`, etc.).

Document connector steps when enabling GSC OAuth or BigQuery exports.

## Related UI

- **Marketing Hub**: `/[locale]/[country]/dashboard/marketing`
- **SEO Engine**: `/[locale]/[country]/dashboard/marketing/seo`
