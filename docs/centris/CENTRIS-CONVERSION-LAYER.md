# Centris → LECIPM conversion layer

Maps syndicated traffic into CRM leads, enrichment, broker metrics, and Law 25–aligned consent capture.

## Data model (do not duplicate `Lead`)

The platform uses the existing **`Lead`** table with:

- **`distributionChannel`** — `"CENTRIS"` when attributed to Centris syndication or broker-recorded Centris intake.
- **`leadSource`** — e.g. `CENTRIS_FUNNEL`, `CENTRIS_BROKER_INTAKE`.
- **`LeadTimelineEvent`** (`lead_timeline_events`) — funnel steps; `recordLeadFunnelEvent` writes types such as `FUNNEL_CONTACT` with metadata.

This matches the intent of a simplified “Lead + LeadEvent” design without a second lead table.

## Attribution

- Query: **`?src=centris`** or **`?dist=centris`** (see `resolveCentrisFromSearchParams`).
- Cookie: **`lecipm_centris_src`** (`CENTRIS_ATTRIBUTION_COOKIE`), 90-day path `/`.

Canonical listing URLs remain **`/{locale}/{country}/listings/{id}`**. Short alias: **`/{locale}/{country}/listing/{id}`** redirects to **`/listings/{id}`** preserving query string.

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/leads/centris/capture` | Public capture from listing (email/phone + Law 25 privacy + optional marketing) |
| POST | `/api/broker/centris-lead` | Broker manual Centris inquiry (owned listing + consent attestation) |
| GET | `/api/broker/centris-conversion` | Broker dashboard metrics (counts, revenue sum) |

## UI

- Listing detail (Centris channel): **`CentrisConversionStrip`** — Unlock analysis / Book visit / Download report; premium copy footnote.
- Broker: **`/dashboard/broker/centris-conversion`** — metrics + manual intake form.

## Logging

Structured console tags: **`[lead]`**, **`[funnel]`**, **`[conversion]`** (`centris-funnel.log.ts`).

## Follow-up email

`sendCentrisAnalysisFollowUpEmail` sends only when marketing consent is true; includes enrichment text and links to similar listings.

## Retargeting / saved listings

Buyer saved listings and alerts use existing growth / buyer APIs where enabled; Centris attribution does not replace those pipelines.
