# Growth Policy Enforcement Layer (V1)

**Rollout / QA / operator checklist:** [`growth-policy-enforcement-rollout.md`](./growth-policy-enforcement-rollout.md)

## Purpose

A **bounded, additive** layer that maps governance / policy / learning-control state into **non-critical advisory gating** for the Growth Machine. It answers: which surfaces stay full, which downgrade to read-only, which require approval, and which block promotion — **without** changing payments, bookings, checkout, ads execution core, or CRO rendering core.

## Enforceable targets

See `GrowthEnforcementTarget` in `modules/growth/growth-policy-enforcement.types.ts`, including:

- Autopilot advisory conversion & safe execution  
- Learning adjustments  
- Content / messaging assist generation  
- Fusion bridge promotion  
- Simulation & strategy recommendation promotion  
- Panel render hints  

## In scope vs out of scope

| In scope (V1) | Out of scope |
|---------------|--------------|
| Advisory panels, bridge outputs, convert-to-action affordances | Stripe, payments, pricing |
| Learning weight application (orchestration-local) | Booking creation, checkout sessions |
| Draft/regenerate triggers (advisory) | Ranking core, ads execution core |
| Mission-control / strategy / simulation **promotion** paths | CRO core rendering, core business flows |

## How the snapshot is built

`buildGrowthPolicyEnforcementSnapshot()` (when `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1` is on):

1. Loads optional **governance policy** snapshot, **governance decision**, **learning control** decision.  
2. Maps domains and signals to `GrowthEnforcementMode` per target via `assembleGrowthPolicyEnforcementSnapshot()` (pure, testable).  
3. Derives `blockedTargets`, `frozenTargets`, `approvalRequiredTargets` from rules.  
4. **No writes** to source systems.

When the flag is **off**, `buildGrowthPolicyEnforcementSnapshot()` returns `null` and **behavior matches pre-layer** (no gating).

## Bridge logic

`growth-policy-enforcement-bridge.service.ts` exposes small helpers (`applyPolicyToAutopilotUi`, `applyPolicyToLearning`, `applyPolicyToFusionBridges`, etc.) that return **metadata only** (badges, suppress flags). Callers keep existing data; wrappers do not mutate payloads.

## Query helpers

`growth-policy-enforcement-query.service.ts`: `getEnforcementForTarget`, `isTargetBlocked`, `isTargetFrozen`, `isTargetApprovalRequired`, `canPromoteTarget` — deterministic, no mutation.

## Explainer

`buildGrowthPolicyEnforcementNotes(snapshot)` returns short strings for badges and panel copy.

## Console panel

`GrowthPolicyEnforcementPanel` renders when **`FEATURE_GROWTH_POLICY_ENFORCEMENT_PANEL_V1`** is on (and Growth Machine passes props). Shows blocked / frozen / approval counts and per-target modes.

## Monitoring

`growth-policy-enforcement-monitoring.service.ts` increments counters and logs `[growth:policy-enforcement]` on builds (never throws).

## Feature flags

| Flag | Effect |
|------|--------|
| `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1` | Build snapshot, API, bridge gating |
| `FEATURE_GROWTH_POLICY_ENFORCEMENT_PANEL_V1` | Enforcement console panel on Growth dashboard |

## Safety guarantees

- Additive-only; source systems remain authoritative.  
- Deterministic assembly from inputs; safe with partial data (notes + `missingDataWarnings`).  
- Reversible by turning flags off.  

## Validation commands

```bash
cd apps/web && npx vitest run modules/growth/__tests__/growth-policy-enforcement.service.test.ts modules/growth/__tests__/growth-policy-enforcement-query.service.test.ts modules/growth/__tests__/growth-policy-enforcement-explainer.service.test.ts modules/growth/__tests__/growth-policy-enforcement-bridge.service.test.ts modules/growth/__tests__/growth-policy-enforcement-monitoring.service.test.ts
```
