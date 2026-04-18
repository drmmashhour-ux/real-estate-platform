# Growth Policy Enforcement — rollout checklist

Operational guide for enabling the **Growth Policy Enforcement** layer safely. This document does **not** replace code; it describes flags, UX, QA, monitoring, and known limits.

## Required flags

| Flag | Purpose |
|------|---------|
| `FEATURE_GROWTH_MACHINE_V1` | Prerequisite — growth machine hub and `/api/growth/policy-enforcement` actor checks. |
| `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1` | **Master switch** — when `true`, the layer builds snapshots and exposes advisory gates to downstream callers. When `false`, GET `/api/growth/policy-enforcement` returns HTTP **200** with `enforcementLayerEnabled: false` (no silent 403); UI shows operator copy. |
| `FEATURE_GROWTH_POLICY_ENFORCEMENT_PANEL_V1` | Shows the detailed **Policy enforcement** panel on the Growth Machine dashboard **in addition** to the always-visible status strip (when enforcement is enabled). |

Optional upstream modules (partial snapshots if unavailable — see monitoring / partial inputs):

- Governance / policy consoles as described in `growth-policy-enforcement-layer.md`.

## Pages / surfaces affected

| Surface | Behavior when enforcement is **on** |
|---------|--------------------------------------|
| **`/[locale]/[country]/dashboard/growth`** | Status strip shows layer on/off, panel flag on/off, advisory-only scope; operator messages when disabled. Rollout debug strip (non-prod or `?growthPolicyDebug=1`) summarizes shared snapshot availability, note/warning counts, and whether simulation receives `enforcementSnapshot`. |
| **`GET /api/growth/policy-enforcement`** | Returns **200** with structured body — enabled snapshot or disabled payload with `operatorMessage` (no silent 403 when layer flag off). |
| **Policy Enforcement panel** (when panel flag on) | Table of targets, partial-data banner when inputs are incomplete, “What to do”, optional operational monitoring when debug query/env allows. |
| **Growth Simulation panel** | Uses shared `enforcementSnapshot` when layer flag on; loading / absent snapshot messaging; debug line when debug UI allowed. |
| **Strategy / Fusion / Learning / Mission Control / Content / Messaging panels** | Receive `enforcementSnapshot` from parent fetch when layer flag on (existing bridge behavior). |

## What changes when enabled (`FEATURE_GROWTH_POLICY_ENFORCEMENT_V1=true`)

- **`buildGrowthPolicyEnforcementSnapshot()`** runs and aggregates policy + governance + learning signals into bounded **advisory** modes per target (`allow`, `advisory_only`, `freeze`, etc.).
- Server logs prefixed with **`[growth:policy-enforcement]`** on build start and build complete (blocked/frozen/approval/advisory counts, gated targets).
- In-process counters in **`growth-policy-enforcement-monitoring.service`** increment (surfaced as “Operational monitoring” when debug eligibility is satisfied).

Nothing in this layer **charges**, **captures bookings**, **executes ads**, or **hard-blocks CRO** — those systems stay outside enforcement v1.

## Scope boundaries (explicit)

This layer **does not enforce**:

- **Payments** — billing and Stripe flows are unchanged.
- **Bookings core** — BNHub / booking execution is unchanged.
- **Ads core** — paid media execution and core ad plumbing are unchanged.
- **CRO core** — primary conversion experiments and core CRO paths are unchanged.

It **does** gate **advisory / orchestration hints** (simulation promotion, fusion bridges, autopilot-safe posture, etc.) per snapshot rules.

## Manual QA checklist

1. **Layer off** — Set `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1=false`, reload Growth dashboard:
   - Status strip shows **Layer: Disabled** and internal operator message.
   - GET `/api/growth/policy-enforcement` returns **200** with `enforcementLayerEnabled: false` and `operatorMessage`.
   - Dependent panels receive **no** enforcement snapshot from parent (null).
2. **Layer on, panel off** — Enforcement `true`, panel flag `false`:
   - Strip shows enabled + panel flag off; optional operator note about panel flag.
   - Full table panel hidden.
3. **Layer on, panel on** — Both `true`:
   - Panel loads table; if upstream data missing, **partial / incomplete** banner appears with warning codes.
4. **Simulation** — With simulation + enforcement flags on:
   - While parent snapshot loads: “Loading shared policy enforcement snapshot…”.
   - After load with snapshot: promotion line reflects `simulation_recommendation_promotion` mode when not `allow`.
5. **Debug** — Non-production **or** `NEXT_PUBLIC_GROWTH_POLICY_ENFORCEMENT_DEBUG=1` **or** `?growthPolicyDebug=1`:
   - Panel fetch includes `?growthPolicyDebug=1`; response may include `operationalMonitoring` and `debug` counts.
   - Dashboard **rollout debug** strip shows shared snapshot status, notes/warnings counts, and simulation bridge label (`received` / `absent` / `layer_off` / `loading_parent`).
   - Simulation shows debug line for `enforcementSnapshot` state.

## Expected monitoring / log behavior

- **Console (server):** `build started` / `build completed blocked=… frozen=…` lines with gated target names (truncated).
- **Operational monitoring block (UI):** Rolling counters since process start — suitable for rollout sanity, not financial audit.

## Known limits

- Snapshots depend on optional upstream services; **partial** completeness reduces certainty — do not treat modes as guarantees.
- Monitoring state is **in-memory** per runtime — resets on deploy/restart.
- Production debug payloads require **explicit** request query or env (no implicit exposure).

## Related

- Architecture and assembly: `growth-policy-enforcement-layer.md`.
