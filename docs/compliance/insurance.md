# Insurance & Trust Intelligence System

Professional liability (**FARCIQ-style**) coverage is treated as a live **trust signal**, not only a compliance checkbox: it validates badges, informs a deterministic **risk engine**, drives **marketplace ranking** (with an opt-in multiplier), powers **insured-only search**, and triggers **proactive alerts**.

## Validation (`isBrokerInsuranceValid`)

A broker qualifies as **insured / badge-eligible** only when the latest matching policy row satisfies:

| Rule | Detail |
|------|--------|
| Status | Must be **ACTIVE** ( **`SUSPENDED`** never qualifies ). |
| Term | `startDate ≤ today ≤ endDate`. |
| Limits | **coveragePerLoss ≥ MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD** (default **$1,000,000** CAD per occurrence). |

Implementation: `apps/web/modules/compliance/insurance/insurance.service.ts`.

Shared Prisma fragments for marketplace filters: `prismaUserHasValidBrokerInsurance()` — uses relation **`brokerInsurances`** on `User`.

Deprecated alias: **`isBrokerInsuranceActive`** → delegates to **`isBrokerInsuranceValid`** for backward compatibility.

## Public coverage API

**GET `/api/insurance/coverage`** (broker session required) returns a safe snapshot:

- `liabilityAmount` — per-occurrence limit (same units as stored `coveragePerLoss`).
- `coverageType` — `PROFESSIONAL_LIABILITY`.
- `expiryDate` — ISO end of term.
- `status` — raw policy status string.
- `nearExpiry` — true when expiry is within the next **30 days** (informational warning).

Canonical helper: `getPublicBrokerCoverageSummary`.

## Risk engine (`evaluateBrokerInsuranceRisk`)

Deterministic **0–100** score (not ML / not legal advice). Inputs include complaint velocity, dual-side transaction density, disclosure gaps, and **claims in the last 12 months**:

- **Severity weighting** by claim workflow status (`UNDER_REVIEW` > `SUBMITTED` > `CLOSED` > `DRAFT`).
- **Recent-window penalty** when any qualifying claim falls in the **last 30 days**.
- Batch variant for performance: **`evaluateBrokerInsuranceRiskBatch(brokerIds)`** (shared aggregates).

Audit log event: `audit_risk_engine_result`.

## Trust score (`combineTrustSignals` / `computeBrokerTrustScore`)

Blended **trustScore ∈ [0, 1]**:

- **40%** insurance validity (binary gate from validation rules above).
- **30%** compliance score (derived from risk engine + broker compliance events).
- **30%** inverse risk (`1 - riskScore/100`).

`combineTrustSignals` is an alias of `computeBrokerTrustScore`. **`batchBrokerTrustScores01`** computes the same weighting for many brokers using batched queries.

## Marketplace impact

### Residential browse (`POST /api/buyer/browse`)

- **Insured-only filter**: URL/body **`insuredOnly: true`** restricts FSBO rows to **`listingOwnerType === BROKER`** with **`prismaUserHasValidBrokerInsurance`**, and CRM rows to listings whose **owner** satisfies the same insurance fragment.
- **Ranking**: When **`FEATURE_INSURANCE_TRUST_INTELLIGENCE_V1=true`**, FSBO rows get an extra **`sortAt` multiplier** from **`batchInsuranceTrustSortMultipliers`** (derived from batched trust scores). Default env is **off** — safe rollout.

### BNHub ranked search

Existing path **`/api/ranking/listings`** continues to blend One-Brain trust with **`computeBrokerTrustScore`** (`search-ranking.service.ts`) when reputation ranking flags allow.

### Short-term (BNHub) catalogue

**`insuredOnly`** on **`buildPublishedListingSearchWhere`** filters hosts via **`brokerInsurances`** (`lib/bnhub/build-search-where.ts`).

## Alerts (`insurance-alert.service`)

Triggers include **expiring soon**, **expired**, **claim submitted**, and **risk threshold** (aligned with **`INSURANCE_RISK_ALERT_THRESHOLD`** from `insurance.types.ts`). **Brokers** and **admins** receive in-app notifications; audits use **`audit_alert_triggered`** / **`audit_claim_intake_alert`** where applicable.

Periodic sweep: **`checkExpiringInsurance`** (cron/job integration is environment-specific).

## UI

- Listing detail **Insured ✓** badge shows **professional liability tier** (e.g. `$2M`) and **near-expiry** warning when applicable (`BuyerListingDetail`).
- Advanced search includes **“Insured brokers only”** (filter state + URL `insuredOnly=true`).

## Admin monitoring

Compliance Command Center loads **expiring policies**, **high insurance-risk brokers** (engine score ≥ **55** among candidates tied to expiring policies or recent claims), and **recent claims** (`compliance-command-center.service.ts` + `InsuranceTrustMonitoring`).

## Tests

See `apps/web/modules/compliance/insurance/__tests__/insurance-trust.test.ts`.

## Environment

| Variable | Purpose |
|----------|---------|
| `FEATURE_INSURANCE_TRUST_INTELLIGENCE_V1` | Enables batched insurance trust **sort multipliers** on residential browse (default off). |
