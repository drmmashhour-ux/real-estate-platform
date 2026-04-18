# Growth Policy Enforcement Layer (V1)

## Purpose

Deterministic **advisory** evaluation of growth signals so operators see risky patterns before damage compounds. **V1 does not block** ads, CRO, Stripe, checkout, bookings, webhooks, or autopilot execution at runtime.

## Domains covered

Policies are tagged with: `ads`, `cro`, `leads`, `messaging`, `content`, `pricing`, `broker`, `governance`.

## Rule categories (examples)

| Area | Severity | Behavior |
|------|----------|----------|
| Governance | critical | `freeze_recommended`, `human_review_required` from enforcement snapshot |
| Ads | warning | Impressions with zero leads; high activity with very low conversion rate |
| Leads | warning / critical | Views without unlocks; high unlock volume with weak follow-up throughput |
| Messaging | warning | High queued follow-ups with low response rate |
| Broker | warning | Weak close-rate proxy; slow responders dominate |
| Pricing | warning | Unstable flag or high volatility score |
| Content | info | Generated output with weak engagement |
| CRO | warning | Traffic with very low conversion vs visits |

Exact thresholds live in `apps/web/modules/growth/policy/growth-policy.service.ts`. Output is **capped** (max 12) and **deduplicated** by domain + title.

## Advisory-only nature

- No hard enforcement, no auto-disable of features, no mutation of source-system truth.
- Outputs are **bounded**, **explainable**, and **logged** under `[growth:policy]`.

## Relation to governance

- **Growth governance** consoles describe domain modes and operator posture.
- **Policy enforcement** (`FEATURE_GROWTH_POLICY_ENFORCEMENT_V1`) applies target-level gating for specific advisory flows.
- **This layer** (`evaluateGrowthPolicies`) produces **operator-facing findings** from blended read-only signals — complementary, not a replacement for governance decisions.

## Feature flag

| Env | Meaning |
|-----|---------|
| `FEATURE_GROWTH_POLICY_V1` | Enables `GET /api/growth/policy` and `GrowthPolicyPanel` on the Growth Machine dashboard |

Default: **off** (`FEATURE_GROWTH_POLICY_V1=0` in `apps/web/.env.example`).

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/growth/policy/__tests__
```

## Safety guarantees

- Read-only aggregation in the API path; failures in optional sources degrade gracefully.
- Monitoring helpers never throw; JSON-safe log payloads only.
