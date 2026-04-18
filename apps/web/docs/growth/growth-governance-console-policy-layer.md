# Growth Governance Console / Policy Layer (V1)

## Purpose

The **governance policy layer** is a **central, read-only snapshot** of how each growth **domain** is expected to behave in the product: allowed, advisory-only, approval-required, blocked, or frozen. It **does not** change runtime enforcement, Stripe, bookings, ads execution core, CRO experiments, or source-system data. V1 is **visibility and operator alignment** only.

## Domains covered

`leads` · `ads` · `cro` · `content` · `messaging` · `autopilot` · `learning` · `fusion`

## Policy modes

| Mode | Meaning (policy view) |
|------|------------------------|
| `allowed` | May proceed within existing product rules |
| `advisory_only` | Suggestions only — no automatic mutations from this layer |
| `approval_required` | Human review before acting |
| `blocked` | Do not expand automated execution in this domain (governance signal) |
| `frozen` | Hold / freeze adaptive or scaling narratives until cleared |

## How the snapshot is built

`buildGrowthGovernancePolicySnapshot()` in `growth-governance-policy.service.ts`:

1. **Default rules** per domain (e.g. leads → approval required, ads/cro/content/fusion → advisory-only, messaging → approval required, autopilot → depends on execution flag).
2. **Merge** `evaluateGrowthGovernance()` when `FEATURE_GROWTH_GOVERNANCE_V1` is on — frozen/blocked domains and human-review queue tighten modes.
3. **Merge** learning control from `getGrowthLearningReadOnlyForCadence()` when learning is on — e.g. freeze or monitor posture for the `learning` domain.
4. **Autopilot execution** hint uses `aiAutopilotExecutionV1` — informational only in the snapshot.

Domain lists on the snapshot (`blockedDomains`, `frozenDomains`, `reviewRequiredDomains`) are derived from **effective** rule modes for explainability.

## Query helpers

`growth-governance-policy-query.service.ts`: `getPolicyModeForDomain`, `isDomainBlocked`, `isDomainFrozen`, `requiresHumanReview`, `formatPolicyModeLabel` — deterministic, no mutation.

## Explainer

`buildGrowthGovernancePolicyNotes(snapshot)` in `growth-governance-policy-explainer.service.ts` returns short human-readable lines for UI or notes (advisory).

## Safety guarantees

- Advisory in v1 — **centralizes visibility, not enforcement**.
- Source systems and existing execution paths remain authoritative.
- No new auto-execution; no payment/booking/pricing/ads/CRO core changes from this layer.

## Feature flags (default off)

| Env | Role |
|-----|------|
| `FEATURE_GROWTH_GOVERNANCE_POLICY_V1` | Policy snapshot + `GET /api/growth/governance-policy` |
| `FEATURE_GROWTH_GOVERNANCE_CONSOLE_PANEL_V1` | Governance Console UI + policy domain badges when wired |

Aliases: `FEATURE_GROWTH_GOVERNANCE_POLICY_V1`, `FEATURE_GROWTH_GOVERNANCE_CONSOLE_PANEL_V1` in `config/feature-flags.ts`.

## UI

- **Governance Console** — `GrowthGovernanceConsolePanel` on the Growth Machine dashboard when both flags are on.
- **Badges** — `GrowthGovernancePolicyDomainBadge` on Autopilot, Learning, and Mission Control (display-only; fetches policy API when enabled).

## Validation

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/growth-governance-policy
```

## Monitoring

Prefix `[growth:governance:policy]` — see `growth-governance-policy-monitoring.service.ts`.
