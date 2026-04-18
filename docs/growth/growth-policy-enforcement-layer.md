# Growth policy enforcement layer (v1)

## Purpose

Provide a **bounded, read-only enforcement snapshot** that maps governance policy, learning control, and related signals into **explicit modes per advisory target**. Consumers (UI and orchestration helpers) use this to gate **non-critical** affordances: advisory conversion, safe autopilot execution buttons, learning weight application, fusion bridge promotion, content regeneration, and mission-control recommendation promotion.

This layer does **not** change source-of-truth systems, payment flows, or core product logic.

## Enforceable targets

See `GrowthEnforcementTarget` in `apps/web/modules/growth/growth-policy-enforcement.types.ts` (e.g. `autopilot_advisory_conversion`, `learning_adjustments`, fusion bridges, simulation/strategy promotion, etc.).

## In scope (v1)

- Advisory panels and operator-console affordances
- Bridge output promotion hints (advisory path only)
- Learning weight **application** (evaluation may still run)
- Draft regeneration triggers in Content Studio (optional copy)
- Mission Control / strategy “promotion” messaging (display-only)

## Out of scope

- Stripe, bookings, checkout, pricing
- Ads execution core, CRO core rendering, ranking core
- Mutating CRM or external APIs as enforcement
- Bypassing human approval systems

## Snapshot build

`buildGrowthPolicyEnforcementSnapshot()` (async) runs when `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1` is on. It composes:

- Governance policy snapshot (when `FEATURE_GROWTH_GOVERNANCE_POLICY_V1` is on)
- Governance decision (when governance is on)
- Learning control (when learning is on)
- Autopilot execution flag (`FEATURE_AI_AUTOPILOT_EXECUTION_V1`)

Pure assembly for tests: `assembleGrowthPolicyEnforcementSnapshot(input)`.

## Bridge helpers

`growth-policy-enforcement-bridge.service.ts` exposes small wrappers (`applyPolicyToAutopilotUi`, `applyPolicyToLearning`, `applyPolicyToFusionBridges`, `applyPolicyToContentAssist`, `applyPolicyToMessagingAssist`, `applyPolicyToMissionControlPromotion`) that return **metadata only** and do not mutate inputs.

## Console panel

When `FEATURE_GROWTH_POLICY_ENFORCEMENT_PANEL_V1` is on (and enforcement v1 is on), `GrowthPolicyEnforcementPanel` appears on the Growth Machine dashboard with a compact target/mode table and notes.

## Safety guarantees

- Additive, deterministic, explainable rules
- Safe with partial data (warnings in snapshot notes)
- Reversible by toggling flags — no destructive writes in this module

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1` | Master gate: snapshot API + UI gating + learning integration |
| `FEATURE_GROWTH_POLICY_ENFORCEMENT_PANEL_V1` | Show enforcement console panel on growth dashboard |

Default: **off**. When enforcement v1 is off, behavior matches the previous system (no enforcement snapshot).

## Validation commands

From `apps/web`:

```bash
pnpm exec vitest run modules/growth/__tests__/growth-policy-enforcement*.test.ts
```

## API

- `GET /api/growth/policy-enforcement` — returns `{ snapshot }` when enforcement v1 is enabled and the user passes Growth Machine auth; otherwise `403` with enforcement disabled.

Source systems (governance, learning, autopilot APIs) remain authoritative; this layer only **advises** UI and bounded orchestration gates.
