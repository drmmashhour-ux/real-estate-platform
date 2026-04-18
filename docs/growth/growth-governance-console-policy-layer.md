# Growth Governance Console / Policy Layer (V1)

## Purpose

The **Governance Policy** layer provides a **central, read-only** view of what each growth **domain** may do under current flags and governance signals: allowed, advisory-only, approval-required, blocked, or frozen. It **does not** add runtime enforcement, change Stripe/bookings/checkout, alter ads or CRO execution paths, or overwrite authoritative data — it **centralizes visibility** for operators.

## Domains covered

`GrowthPolicyDomain`: `leads`, `ads`, `cro`, `content`, `messaging`, `autopilot`, `learning`, `fusion`.

## Policy modes

`GrowthPolicyMode`: `allowed`, `advisory_only`, `approval_required`, `blocked`, `frozen`.

## How the snapshot is built

1. **Default policy** — safe baseline per domain (e.g. ads/cro/content/fusion advisory-only; leads/messaging approval-oriented; autopilot reflects execution flag; learning allowed unless overridden).
2. **Governance** (`evaluateGrowthGovernance` when enabled) — merges `frozenDomains`, `blockedDomains`, and human-review queue items into rules and domain strips.
3. **Learning control** (read-only cadence path when learning is enabled) — may set `learning` to `frozen`, `advisory_only`, or `approval_required` depending on `GrowthLearningControlDecision` state.
4. **Autopilot execution flag** — `FEATURE_AI_AUTOPILOT_EXECUTION_V1` influences the default **autopilot** rule wording and mode (`allowed` vs `approval_required`) in the policy **view** only.

## API & UI

- `GET /api/growth/governance-policy` — returns `snapshot` when `FEATURE_GROWTH_GOVERNANCE_POLICY_V1` is on (growth machine auth).
- **Governance Console** panel when `FEATURE_GROWTH_GOVERNANCE_CONSOLE_PANEL_V1` is on.
- Optional **display-only** badges on Autopilot, Learning, and Mission Control panels when **both** policy and console flags are enabled (no behavior change).

## Query helpers & explainer

- `growth-governance-policy-query.service.ts` — `getPolicyModeForDomain`, `isDomainBlocked`, `isDomainFrozen`, `requiresHumanReview`, `formatPolicyModeLabel`.
- `buildGrowthGovernancePolicyNotes(snapshot)` — short strings for UI or other advisory strips.

## Safety guarantees

- Advisory in v1; no new auto-execution.
- No mutation of source-system truth from this layer.
- Disable feature flags to remove the console and API surface.

## Feature flags

| Env | Role |
| --- | --- |
| `FEATURE_GROWTH_GOVERNANCE_POLICY_V1` | Policy snapshot + API |
| `FEATURE_GROWTH_GOVERNANCE_CONSOLE_PANEL_V1` | Dashboard console + optional badges (with policy V1) |

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/growth-governance-policy*.test.ts
```
