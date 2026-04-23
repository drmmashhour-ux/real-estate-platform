# Centris → LECIPM conversion layer

Maps syndicated traffic into CRM leads, enrichment, broker metrics, Law 25–aligned consent capture, and the **Lead Domination Engine**: deterministic scoring, urgency copy, broker routing on existing `Lead` / `LeadTimelineEvent` rows.

## Data model (do not duplicate `Lead`)

The platform uses the existing **`Lead`** table with:

- **`distributionChannel`** — `"CENTRIS"` when attributed to Centris syndication or broker-recorded Centris intake.
- **`leadSource`** — e.g. `CENTRIS_FUNNEL`, `CENTRIS_BROKER_INTAKE`.
- **`LeadTimelineEvent`** (`lead_timeline_events`) — funnel steps; `recordLeadFunnelEvent` writes **`FUNNEL_*`** types (`VIEW`, `CONTACT`, `SAVE`, `BOOKING`, **`PRICE`**, **`ENGAGEMENT`**, **`ANALYSIS`**).
- **`introducedByBrokerId`** — set at capture when the listing owner (FSBO or CRM) resolves as primary broker (**`centris-broker-routing.service.ts`** — no duplicate assignment engine).
- **`score`**, **`aiExplanation.centris`** — populated by **`persistCentrisLeadScore`** after capture.

## Lead scoring (`centris-lead-score.service.ts`)

Deterministic **0–100** score from:

- Timeline density (`FUNNEL_VIEW`, `FUNNEL_CONTACT` intents, saves, bookings, analysis/price/engagement events).
- Optional client **`behaviorHints`** (`dwellSeconds`, `priorSessionViews`, `returningVisitor`) from capture POST.
- Deal band from **`dealValue` / `estimatedValue`**, signed-in **`userId`**, Centris channel flag.

Emits **`intentLevel`**: `LOW` | `MEDIUM` | `HIGH` (mirrors **`aiTier`**: cold / warm / hot).

## Urgency engine (`centris-urgency.service.ts`)

Public **`GET /api/centris/urgency?listingId=`** (rate limited) returns:

- **`stripLines`** — bullets for **`CentrisConversionStrip`**.
- **`emailParagraph`** — merged into Day 3 nurture email.
- **`facts`** — viewer counts (FSBO `BuyerListingView`), recent listing update proxy, visit scarcity copy.

## Broker routing (`centris-broker-routing.service.ts`)

- **`resolveBrokerForCentrisListing(listingId)`** — FSBO owner first, then CRM **`Listing.ownerId`**.
- **`resolveCentrisBrokerRouting(leadId)`** — uses linked listing on the lead.

Returned shape: **`bestBrokerId`**, **`routingReason`**, **`signals`**.

Expose read-only introspection via **`GET /api/centris/broker-routing?leadId=`** (broker must own lead context).

## Revenue follow-up sequence (`centris-followup.service.ts`)

Marketing consent triggers:

1. **Immediate** — existing analysis email (`sendCentrisAnalysisFollowUpEmail`).
2. **`LeadFollowUpJob`** rows (**off by default cron** unless processed):
   - Day 2 — similar listings (`centris_domination_d2_similar`)
   - Day 3 — urgency email (`centris_domination_d3_urgency`)
   - Day 5 — broker invitation (`centris_domination_d5_broker_invite`)

Drain jobs with **`POST /api/cron/centris-domination-followup`** (`Authorization: Bearer $CRON_SECRET`).

## Funnel analytics (`centris-funnel-analytics.service.ts`)

**`GET /api/centris/analytics?days=`** — broker/admin; returns **`getCentrisBrokerDominationSnapshot`**:

- Conversion rate (signed-in / captures), avg score, **`FUNNEL_VIEW`** totals, weak steps, best CTA label, **`topListings`** by volume.

Dashboard **`/dashboard/broker/centris-conversion`** loads **`GET /api/broker/centris-conversion?extended=1`** for the same rollup.

## Retargeting hooks (`centris-retargeting.service.ts`)

**`recordCentrisRetargetingSignal(leadId, kind)`** writes a **`FUNNEL_SAVE`** timeline payload with **`retargetKind`** (`saved_listing` · `price_alert` · `revisit_reminder`) — wire from buyer saves / alerts without new tables.

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/leads/centris/capture` | Capture + **`behaviorHints`** optional JSON |
| GET | `/api/centris/urgency` | Listing urgency signals (public, rate limited) |
| GET | `/api/centris/lead-score` | Broker — score snapshot for **`leadId`** |
| GET | `/api/centris/analytics` | Broker — funnel analytics + top listings |
| GET | `/api/centris/broker-routing` | Broker — routing explanation |
| POST | `/api/cron/centris-domination-followup` | Cron — process nurture jobs |
| GET | `/api/broker/centris-conversion` | Metrics + **`extended=1`** domination snapshot |

## Attribution

- Query: **`?src=centris`** or **`?dist=centris`** (`resolveCentrisFromSearchParams`).
- Cookie: **`lecipm_centris_src`** (`CENTRIS_ATTRIBUTION_COOKIE`), 90-day path `/`.

## Logging

Structured console tags: **`[lead]`**, **`[funnel]`**, **`[conversion]`** (`centris-funnel.log.ts`).

## Tests

`apps/web/modules/centris-conversion/__tests__/centris-domination.test.ts`
