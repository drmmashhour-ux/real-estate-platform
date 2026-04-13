# Trust & verification system (platform MVP)

This document describes the **platform-level** trust layer in `apps/web`: user verification profiles, optional listing verification flags, **`platform_trust_scores`**, verification requests, admin queue, and how this interacts with **fraud**, **BNHub search ranking**, and the existing **trustgraph** (`TrustProfile`, `VerificationCase`, FSBO numeric trust).

## Naming: `trust_scores` vs `platform_trust_scores`

- The Postgres table **`trust_scores`** is used by **BNHub** `BnhubTrustScoreSnapshot` (historical snapshots). Do not repurpose it for Prisma model `TrustScore` in this MVP.
- Platform-wide deterministic scores live in **`platform_trust_scores`** (Prisma model **`PlatformTrustScore`**).

## Data model

| Prisma model | Table | Purpose |
|--------------|--------|---------|
| `UserVerificationProfile` | `verification_profiles` | Email/phone/identity/broker/payment flags + `VerificationLevel` |
| `ListingVerification` | `listing_verifications` | Admin-approved contact/address/photo/content flags per listing id |
| `PlatformTrustScore` | `platform_trust_scores` | One row per `(PlatformTrustEntityType, entityId)` with score 0–100, tier, `reasonsJson` |
| `VerificationRequest` | `verification_requests` | Broker/listing verification queue (`pending` → `approved` / `rejected`) |

Enums: **`VerificationLevel`**, **`PlatformTrustEntityType`** (`user` | `host` | `broker` | `listing`), **`PlatformTrustTier`** (`low` | `medium` | `high` | `trusted`), **`VerificationRequestStatus`**.

## Trust score rules (v1)

Implemented under `lib/trust/compute-*.ts` and aggregated in `lib/trust/update-trust-score.ts`.

- **Tiers** (from `lib/trust/validators.ts`): 0–29 low, 30–59 medium, 60–84 high, 85+ **trusted** (UI may say “Trusted”).
- **Users**: verification flags + profile completeness + BNHub guest metrics + optional `HostPerformance`.
- **Hosts**: verification + BNHub host profile + `HostPerformance` + host badges + blended listing review aggregates.
- **Brokers**: license / `BrokerVerification` + activity score + lead outcomes + verification flags.
- **Listings** (BNHub `ShortTermListing` id): platform verification enums + `ListingVerification` row + content signals + reviews − disputes.

## Fraud integration

`lib/trust/fraud-trust-adjustment.ts` subtracts points using **`FraudPolicyScore`**, open **`FraudCase`** rows, and **confirmed_fraud** cases. This keeps trust aligned with the rule-based fraud engine without auto-blocking users (admin-first).

## Badges

`lib/trust/get-public-badges.ts` only emits badges when **real data** supports them (email/phone/ID, broker verified, host badges, listing verification row, platform tier).

## Admin review flow

1. User submits **`POST /api/trust/verification-request`** (`broker` | `listing`).
2. Admin opens **`/[locale]/[country]/admin/verification`** and approves/rejects via **`POST /api/trust/verification-request/[id]/review`**.
3. On approval, broker path updates **`BrokerVerification`** (if present) and **`syncUserVerificationProfile`**; listing path upserts **`ListingVerification`**.
4. **`updatePlatformTrustScore`** runs for affected user/listing/host.

## Ranking integration

- **BNHub marketplace sort** (`lib/bnhub/listings.ts`): adds a **small capped boost** from `getPlatformTrustSearchBoostMapForListings` (listing + host platform scores). Missing rows → **0** boost.
- **Unified ranking / persistence** (`src/modules/ranking/rankingService.ts` + `signalEngine.ts`): optional **`platformListingTrust01`** / **`platformHostTrust01`** blend into the existing **trust** pillar (modest caps).

## API

| Route | Role |
|-------|------|
| `GET /api/trust/profile/[userId]` | Public read (aggregated) |
| `GET /api/trust/listing/[listingId]` | Public read |
| `POST /api/trust/verification-request` | Authenticated user |
| `POST /api/trust/verification-request/[id]/review` | Admin |
| `POST /api/trust/recompute/[entityType]/[entityId]` | Admin |

## Vercel / rate limits

Trust endpoints should stay behind existing **app-level rate limits** and auth; WAF / bot rules are configured in the Vercel project (see [vercel-alerting.md](./vercel-alerting.md)).

## Known limitations

- Identity verification UI may be partial; **`identityVerified`** follows `IdentityVerification` status.
- Broker approval **updates** existing `BrokerVerification` rows; if a broker never created one, flags still sync via profile when license exists later.
- Platform trust rows are **not** backfilled automatically on deploy — run **recompute** for hot entities or schedule jobs.

## Future

- Weight tuning from admin labels and `FraudDecision` outcomes.
- Deeper linkage to FSBO `calculateTrustScore` without duplicating case logic.

See also: [fraud-detection-system.md](./fraud-detection-system.md), [README.md](./README.md).
