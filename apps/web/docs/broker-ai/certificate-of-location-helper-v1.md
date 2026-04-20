# Broker AI Helper — Certificate of Location V1

Deterministic workflow support for whether a **certificate of location** appears present, incomplete, or may require update—using structured Legal Hub records and listing metadata **only**. No OCR, no LLM conclusions, no claim of legal sufficiency.

## What it does

- Loads context via `certificate-of-location-context.service.ts` (LegalRecord rows for `fsbo_listing`, listing fields, validation JSON).
- Evaluates readiness with `certificate-of-location-evaluator.service.ts` and checklist items in `certificate-of-location.checklist.ts`.
- Produces safe next steps (`certificate-of-location-guidance.service.ts`), UI view model (`certificate-of-location-view-model.service.ts`), and advisory blocker hints (`certificate-of-location-blocker.service.ts`).
- **GET** `/api/broker-ai/certificate-of-location?listingId=…` returns `{ summary, viewModel, blockerImpact, flags, freshness }` (no raw document bodies).

## What it does not do

- Legal advice, notary/surveyor replacement, or guarantees that a document is valid for closing.
- Invent file contents or run OCR/LLM guessing in V1.

## Supported signals

- `LegalRecord` with `recordType` matching certificate-of-location class (see `certificate-of-location-helpers.ts`).
- `parsedData` / `validation` JSON from Legal Hub pipelines when present.
- Listing address/cadastre for consistency hints (V2 consistency paths).

## Checklist items (platform readiness)

| id | Role |
|----|------|
| `certificate_document_present` | Blocking if absent |
| `document_type_matches_certificate_of_location` | Type label match |
| `property_identification_present` | Warning |
| `issue_or_reference_date_present` | Staleness |
| `owner_or_property_link_present` | Info |
| `no_critical_validation_failures` | Blocking on critical validation |
| `broker_manual_review_ready` | Broker/offer context |
| `change_since_certificate_reviewed` | Change flags |
| `update_may_be_required_if_property_changed` | Advisory |

## Blocker impact (`certificate-of-location-blocker.service.ts`)

Advisory flags only: `affectsPublish`, `affectsOfferReadiness`, `affectsBrokerReview` — **no** direct publish mutation from this module.

## Safe wording

Use: *present*, *missing*, *may require update*, *manual review recommended*, *additional verification required*.

## Integrations

- **Preview / explainability**: `certificate-of-location-preview-bridge.service.ts` feeds DRY_RUN listing preview lines.
- **Audit panel**: `audit-panel.service.ts` includes `certificateOfLocationAudit` when `FEATURE_BROKER_AI_CERTIFICATE_OF_LOCATION_V1` is on.
- **UI**: `CertificateOfLocationHelperPanel` on seller listing, admin FSBO, legal hub, broker residential marketing when flagged.

## Feature flags

- `FEATURE_BROKER_AI_CERTIFICATE_OF_LOCATION_V1`
- `FEATURE_BROKER_AI_CERTIFICATE_BLOCKER_V1`
- `FEATURE_BROKER_AI_CERTIFICATE_OF_LOCATION_V2` — extended signals, workflow POST actions (separate gate)

## V2 — Intelligent workflow engine (deterministic)

Gate: `FEATURE_BROKER_AI_CERTIFICATE_OF_LOCATION_V2`. When off, V1 behaviour and payloads stay unchanged.

### Timeline logic (`certificate-of-location-timeline.service.ts`)

- Computes `estimatedAgeDays` when `issueDate` is present and parseable (ISO-like).
- When `issueDate` is missing: no age assumption; timeline notes explain availability only.
- `flaggedAsPotentiallyOutdated` when `context.changedSinceCertificate === true`, or when age exceeds `certificate-of-location-v2.config.ts` threshold (`CERTIFICATE_LOCATION_MAX_AGE_DAYS`). These are **workflow warnings**, not legal conclusions.

### Structured parsing (`certificate-of-location-parser.service.ts`)

- Reads **Legal Hub structured record JSON** only (`parsedData`, `validation`, typed fields).
- Returns `CertificateOfLocationParsedData` with safe nulls; **no OCR, no inference**.

### Consistency checks (`certificate-of-location-consistency.service.ts`)

- Compares parsed address / lot identifiers to listing fields when both sides exist.
- Missing comparison inputs → `null` (unknown), not treated as mismatch.
- `mismatches[]` describes detected differences for explainability only.

### Explainability (`certificate-of-location-explainability.service.ts`)

- Builds `reasons[]` and `contributingSignals[]` from the evaluated summary — short, factual sentences (e.g. missing upload, missing issue date, property changed after certificate, address mismatch).

### Workflow actions (`certificate-of-location-workflow.service.ts`)

Audited, idempotent-by-intent POST handlers (via API):

| Action | Purpose |
|--------|---------|
| Request upload | Audit trail + listing workflow metadata |
| Mark reviewed | Broker attestation with reviewer id |
| Flag admin review | Calls admin queue enqueue |
| Attach parsed data | Merges structured fields into compliance LegalRecord |

No silent writes; failures return `{ ok: false, reason }`.

### Admin review queue (`certificate-of-location-admin-queue.service.ts`)

- `enqueueCertificateReview(listingId, reason)` dedupes recent rows per listing/reason window.
- `getPendingCertificateReviews()` for dashboards (metadata only).

Typical enqueue reasons: consistency mismatches, missing critical structured fields, outdated timeline + offer-stage context, broker escalation.

### API shape (V2)

GET returns **metadata only**: `summary`, `viewModel`, `explainability`, `workflowActionsAvailable`, `flags`, `freshness` — **no raw document bodies**.

### Integrations

- **Journey**: `seller-3b-certificate-location`, `broker-3b-certificate-workflow` with `certificate-of-location-journey.service.ts` blockers when V2 is on.
- **Preview / legal risk**: `certificate-of-location-observation-bridge.service.ts` feeds readiness penalty and mismatch counts into `computePropertyLegalRiskScore` when compliance preview runs.
- **UI**: `CertificateExplainabilityCard`, `CertificateConsistencyWarnings`, `CertificateWorkflowActionsCard` inside `CertificateOfLocationHelperPanel`.

### Limitations (unchanged)

- No LLM inference, no OCR guessing, no automatic approval, no legal advice.
- All scoring and flags are platform workflow indices only.

## Phase 3 recommendations

- Optional **jurisdiction packs** for Québec-specific stale-certificate norms (still rule-based).
- **Explicit broker governance** hooks (approval queues) without mutating publish state from this helper alone.
- **Event-sourced change detection** when renovation/permits events exist in Legal Hub.

## Future extensions

- Stronger document parser (still deterministic rules).
- Jurisdiction packs (Québec vs other).
- Broker approval workflow tied to governance.
- Timeline-based change detection from events.
