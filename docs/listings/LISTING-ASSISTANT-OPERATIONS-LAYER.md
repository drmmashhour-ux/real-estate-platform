# Listing Assistant — Operations Layer

## Scope

This document describes the **additive** “operations” layer on top of the existing **AI Listing Assistant** module. The core generator, compliance checker, and export paths are **unchanged in behavior**; new services add **versioning, readiness scoring, safe draft persistence, pricing transparency, and performance rollups**.

**Product posture (unchanged):** assistive only; **brokers must review** before any external publish or Centris submission. No auto-syndication is introduced by this layer.

## Workflow (high level)

1. **Generate** — `POST /api/listing/assistant/generate` returns the same `FullListingAssistantBundle` as before, plus optional `readiness` and `alerts` when the server can compute them.
2. **(Optional) Price** — `POST /api/listing/assistant/pricing` returns an **extended** `PricingSuggestionResult` (comparable count, confidence, thin-data flag, band mirrors).
3. **Refine** — broker edits copy in the UI (or leaves generated text as-is).
4. **Save to draft** — `POST /api/listing/assistant/save-draft` writes to `Listing.assistantDraftContent` (JSON) and appends a `SAVED_DRAFT` version row. **Does not** set `crmMarketplaceLive` or any external submit.
5. **Compare** — `GET /api/listing/assistant/versions?listingId=…&fromId=…&toId=…` returns a light field diff for review.
6. **Monitor** — `GET /api/listing/assistant/operations/summary` (brokers / admin) shows recent versions, readiness heuristics, compliance warning frequency, and assisted performance vs a crude non-assisted benchmark.

## Versioning

Schema: **`ListingAssistantContentVersion`** (+ optional `assistantDraft*` columns on **`Listing`**).

Phases stored in `phase`:

| Phase           | Meaning                                                |
|-----------------|--------------------------------------------------------|
| `ORIGINAL`      | CRM title baseline when assistant is first tied to listing |
| `AI_GENERATED`  | Snapshot after each generation call with `listingId` |
| `BROKER_EDITED` | Optional snapshot when broker edits before save       |
| `SAVED_DRAFT`   | Persisted CRM draft (`assistantDraftContent`)        |

Implementations live in:

- `listing-version.types.ts`
- `listing-version.service.ts`

Diffing is **summarized** (title/description/highlights), not a legal redline engine.

## Readiness model

`listing-readiness.service.ts` merges:

- textual **compliance** posture,
- optional **pricing confidence** / thin-data warnings,
- **draft completeness** (length, highlights count, structured partial fields),

and emits:

- `readinessStatus`: `READY | NEEDS_EDITS | HIGH_RISK`
- `readinessScore` (0–100),
- `topBlockers` / `recommendedFixes`.

This is **advisory** — not a substitute for brokerage policy.

## Save-to-draft

Route: **`POST /api/listing/assistant/save-draft`**

Body:

```json
{
  "listingId": "<crm listing uuid>",
  "content": {
    "title": "…",
    "description": "…",
    "propertyHighlights": ["…"],
    "language": "en"
  },
  "brokerEdited": true
}
```

- Writes `assistantDraftContent` / `assistantDraftSource` / `assistantDraftUpdatedAt` on **`Listing`**.
- Logs `ListingAssistantContentVersion` with phase `SAVED_DRAFT`.
- **Never** publishes or calls external MLS APIs.

Access: broker/admin with existing CRM listing ACL (`canAccessCrmListingCompliance`).

## Pricing transparency

`listing-pricing.suggester.ts` now returns additional **explainable** fields:

- `comparableCount`
- `priceBandLow` / `priceBandHigh` (mirror `suggestedMinMajor` / `suggestedMaxMajor`)
- `confidenceLevel` (`LOW|MEDIUM|HIGH`)
- `thinDataWarning`
- existing `competitivenessScore` & `rationale`

The UI surfaces peer count and warns when CRM peer sample is thin.

## Performance tracking

`listing-assistant-performance.service.ts`:

- treats listings with ≥1 **`ListingAssistantContentVersion`** row as **assisted**;
- joins **`ListingAnalytics`** (`CRM` kind) for views/contact clicks/demand score;
- counts **`LecipmBrokerCrmLead`** rows per listing;
- computes a **conversion proxy** (contacts ÷ views) — correlational only;
- benchmarks **non-assisted** listings for the same broker (`benchmarkNonAssistedConversionProxy`), excluding assisted ids.

The operations dashboard surfaces assisted rows and flags **possible underperformance** (high views + very low engagement proxy).

## Alerts

`listing-assistant-alerts.service.ts` derives **informational / warning / critical** items from readiness + pricing (and can be extended). These are hints for operators, not automated enforcement.

## Assistive-only guardrails

- No deletion or replacement of legacy listing-assistant modules.
- No automatic publish path.
- Draft persistence stays on **`Listing`** JSON columns + audit table.
- Brokers/admins retain all existing CRM ACL checks.

## Database rollout

Apply Prisma migrations (or `db push` in dev) after pulling schema changes introducing:

- `ListingAssistantContentVersion`
- `assistantDraftContent`, `assistantDraftSource`, `assistantDraftUpdatedAt` on `Listing`.

## Related routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/listing/assistant/generate` | Draft bundle + readiness/alerts |
| POST | `/api/listing/assistant/pricing` | Transparent pricing band |
| POST | `/api/listing/assistant/save-draft` | Persist CRM draft JSON |
| GET | `/api/listing/assistant/versions` | History + optional compare |
| GET | `/api/listing/assistant/operations/summary` | Operations dashboard payload |
