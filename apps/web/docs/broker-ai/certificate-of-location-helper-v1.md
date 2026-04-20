# Broker AI helper — certificate of location (v1)

## Purpose

Deterministic **workflow support** for Québec-style **certificate of location** readiness on FSBO listings: presence of structured metadata, staleness hints, validation signals, and safe next steps. **Not legal advice.**

## What it does

- Reads `LegalRecord` rows (`compliance_document` with certificate-type heuristics), optional `FsboListingDocument` `certificate_optional` slot, and seller supporting documents (category only — no file contents).
- Produces status, readiness level, risk level, checklist results, blocking/warning strings, and up to five next-step lines.
- Optional **blocker impact** hints when `FEATURE_BROKER_AI_CERTIFICATE_BLOCKER_V1` is on (publish / offer / broker review — advisory).

## What it does not do

- No conclusion that a certificate is legally sufficient or binding.
- No OCR, LLM inference, or invented document text.
- No automated publishing or messaging.

## Supported signals

- `compliance_document.parsedData.certificateType`, `issueDate`
- Legal validation bundles (`LegalRecord.validation` v1)
- Listing `updatedAt` vs certificate issue date (staleness heuristic)
- Seller declaration JSON renovation hints (when present)
- Certificate optional slot status on `FsboListingDocument`

## Checklist items (ids)

See `certificate-of-location.checklist.ts`: document present, type match, parcel/id fields, dates, validation, broker/offer manual review, change-after-certificate, update-if-changed.

## Blocker impact logic

`getCertificateOfLocationBlockerImpact`:

- When blocker flag is on and status is **missing**, `affectsPublish` may be true (platform readiness tracking only).
- Offer-stage / outdated / review signals set `affectsOfferReadiness`.
- Blocking validation / broker warnings set `affectsBrokerReview`.

## Safe wording

Uses only neutral platform language: *present*, *missing*, *may require update*, *manual review recommended*, *additional verification required*.

## V2 — intelligent workflow engine (deterministic)

When `FEATURE_BROKER_AI_CERTIFICATE_OF_LOCATION_V2` is enabled (requires V1):

### Structured parsing

- `certificate-of-location-parser.service.ts` reads **only** Legal Hub / compliance `parsedData` JSON keys — no OCR, no inferred text.

### Timeline signals

- Issue dates drive approximate age in days (`certificate-of-location-timeline.service.ts`).
- Thresholds live in `certificate-of-location-v2.config.ts` (`outdatedAgeDaysWarning` / `outdatedAgeDaysStrong`).
- `changedSinceCertificate` from listing vs issue date or seller declaration hints can flag **potentially outdated** — **warning semantics only**, not legal staleness.

### Listing vs certificate consistency

- Compares normalized listing address/city vs certificate address/municipality and cadastre vs lot fields when **both sides** have values.
- Missing comparison inputs → `null` match flags (never forced false positives).

### Explainability

- `certificate-of-location-explainability.service.ts` turns checklist + signals into short neutral sentences and `contributingSignals` tokens for audit trails.

### Broker workflow actions (audited)

- `POST /api/broker-ai/certificate-of-location` with `{ listingId, action }`:
  - `request_upload` — `BrokerVerificationLog` audit row.
  - `mark_reviewed` — broker-scoped daily idempotent marker.
  - `admin_review` — deduped `LegalAlert` queue (`CERTIFICATE_LOCATION_ADMIN_REVIEW`).
  - `attach_parsed` — merges structured keys into existing compliance `LegalRecord.parsedData`.
- No silent automation; explicit HTTP intent only.

### Admin queue

- Open `LegalAlert` rows with fixed title — duplicate OPEN rows suppressed per listing.

### Preview & policy

- Observation facts embed `certificateOfLocationV2` on listing preview (`listing-observation-builder.service.ts`).
- Listing preview policy adds `certificate_location_preview_readiness` — preview warnings / `ALLOW_DRY_RUN` style caution only.

### Legal risk index

- Québec compliance preview path may add a bounded weight from certificate observation facts — **informational score**, not a legal determination.

### Hub journey

- Optional steps: seller `seller-3b-certificate-location`, broker `broker-3b-certificate-workflow` (feature-flagged context signals only).
- Blockers are advisory when certificate coverage is incomplete — no auto-gating beyond defined policy.

### Limitations (unchanged)

- No OCR, LLM inference, legal sufficiency conclusions, automatic approval, or silent execution.

## Future extensions

- Stronger parsers for Québec surveyor certificates (still human-reviewed).
- Jurisdiction packs per province.
- Explicit broker approval workflow state machine.
- Timeline integration for renovation permits.
