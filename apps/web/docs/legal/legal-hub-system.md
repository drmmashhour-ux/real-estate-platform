# Legal Hub system (LECIPM Web)

## Purpose

The Legal Hub is a **product surface for compliance workflows and document/status tracking**. It consolidates operational guidance across buyer, seller, landlord, tenant, broker, host, and operator journeys.

It **does not provide legal advice**, statutory completeness guarantees, or automated filing.

## Supported actors

Router + API identify a `LegalHubActorType`:

- `buyer`, `seller`, `landlord`, `tenant`, `broker`, `host`, `admin`

Actor resolution prefers an explicit `actor` query hint when valid; otherwise it derives from `PlatformRole`, `MarketplacePersona`, and lightweight counts (FSBO ownership, STR listings, rental listings/applications).

## Workflows covered

Definitions live in `modules/legal/legal-workflow-definitions.ts`. Examples:

- Seller disclosure / listing readiness  
- Purchase-offer preparation (guidance only)  
- Lease / long-term rental alignment  
- Short-term rental compliance  
- Privacy & payment terms acknowledgment  
- Identity verification  
- Tenant screening consent signals (where stored)  
- Broker mandate / license alignment  
- Property rules & risk acknowledgements  

## What it does

- Maps catalog workflows to deterministic requirement states inferred from existing platform records.  
- Surfaces **attention items** (risk-style signals) without claiming legal outcomes.  
- Shows **acceptance status** for linked legal documents where `UserAgreement` rows exist.  
- Provides **operator aggregates** on admin routes when enabled.

## What it does not do

- Replace counsel, licensed forms, or regulator submissions.  
- Auto-approve or auto-reject legal outcomes.  
- Store new binding instruments beyond existing product tables.

## Disclaimer boundaries

Copy is framed as **platform guidance**. UI, API payloads, and docs repeat that this is **not legal advice**.

## Data dependency limitations

Signals depend on tables such as `UserAgreement`, `IdentityVerification`, `BrokerVerification`, `FsboListing`, `ShortTermListing`, `RentalListing`, `RentalApplication`, `RentalLease`, and `RealEstateTransaction`. Missing rows degrade gracefully: the context builder records **non-PII** `missingDataWarnings` / optional `availabilityNotes`, which are returned in summaries and public API responses (for transparency, not as legal findings).

## Feature flags (`legalHubFlags`)

Also exported as boolean aliases for ops runbooks: `FEATURE_LEGAL_HUB_V1`, `FEATURE_LEGAL_HUB_DOCUMENTS_V1`, `FEATURE_LEGAL_HUB_RISKS_V1`, `FEATURE_LEGAL_HUB_ADMIN_REVIEW_V1` (same backing env vars as below).

| Env | Meaning |
|-----|---------|
| `FEATURE_LEGAL_HUB_V1` | Main hub page + `/api/legal` |
| `FEATURE_LEGAL_HUB_DOCUMENTS_V1` | Document rows in summary |
| `FEATURE_LEGAL_HUB_RISKS_V1` | Risk / attention items |
| `FEATURE_LEGAL_HUB_ADMIN_REVIEW_V1` | Admin aggregates + `/api/admin/legal` |

## Hub Journey integration (Phase 2)

Legal Hub is **not** modeled as a `HubKey` in `hub-journey.types.ts` today (`HUB_KEYS` stays on the established nine-hub set). Wiring Legal Hub into journey plans would touch attribution, analytics rollups, and dashboard assumptions — **avoid** shipping that in the same release as Legal Hub V1 unless explicitly designed.

**Recommended near-term:** deep-link users from existing hub journeys to `/[locale]/[country]/legal` behind `FEATURE_LEGAL_HUB_V1`. Full journey-plan integration can follow once contracts for steps, progress, and confidence scoring are defined.

## Future extensions (Phase 2+)

- E-sign integrations with audit exports  
- Document upload + formal review queues  
- Jurisdiction-specific workflow packs  
- Deeper offer / counter-offer linkage to transaction engine  
- Structured audit CSV / SIEM forwarding for enterprises  
