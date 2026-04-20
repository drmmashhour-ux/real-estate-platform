# Admin audit panel

## Scopes

`GET /api/admin/audit` supports:

- `scopeType=listing&listingId=<fsbo listing id>` — listing timeline (`EventRecord` entity `listing`) plus legal intelligence summary when available.
- `scopeType=legal_entity&entityType=<type>&entityId=<id>` — merges workflow timeline slices with optional `LegalIntelligenceRecord` metadata rows (no raw files).

Requires `FEATURE_ADMIN_AUDIT_PANEL_V1` and an authenticated **ADMIN** user.

## Data sources

- Event Timeline Engine (`buildEntityTimeline`).
- Legal intelligence (`summarizeLegalIntelligence`).
- Optional marketplace preview reasoning summary via `autonomousMarketplaceEngine.previewForListing` when autonomy is enabled.

## Reason trail structure

Ordered steps tagged by source (`timeline`, `legal_intel`, …) with deterministic sort keys so repeated reads produce stable ordering.

## Security / privacy boundaries

Responses exclude raw document contents. Summaries are operational (counts, statuses, short explanations). Operators should treat payloads as sensitive internally and avoid exporting them publicly.
