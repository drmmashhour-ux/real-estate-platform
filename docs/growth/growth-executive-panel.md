# Growth Executive Panel (V1)

## Purpose

The **Growth Executive Panel** is a single read-only surface that answers: what matters now, what is risky, and what to do first — without executing actions or changing production behavior.

It merges (when respective modules are enabled and data exists):

- Fusion-style priorities (fusion snapshot + prioritized fusion actions)
- Governance posture (status, frozen/blocked domains)
- Autopilot queue / focus (from `listAutopilotActionsWithStatus`)
- UTM early-conversion campaign snapshot + performance band
- CRM lead totals, hot/high-score counts, and follow-up `due_now` counts

## Inputs

| Input | Source |
|-------|--------|
| Autopilot | `listAutopilotActionsWithStatus()` |
| UTM / campaigns | `fetchEarlyConversionAdsSnapshot()` + `computePaidFunnelAdsInsights()` |
| Governance | `evaluateGrowthGovernance()` when `FEATURE_GROWTH_GOVERNANCE_V1` |
| Fusion | `buildGrowthFusionSnapshot()` → `analyzeGrowthFusion()` → `prioritizeGrowthFusionActions()` when `FEATURE_GROWTH_FUSION_V1` |
| Leads | `prisma.lead` counts; follow-up via `buildFollowUpQueue()` |

Missing modules add **notes only** (advisory degradation) — no failures thrown to the client.

## Status rules (deterministic, high level)

Examples:

- Governance `human_review_required` or `freeze_recommended` → executive **watch**
- Governance `caution` or `watch` → **watch**
- No early-conversion leads today, weak ads band, and attributed campaign history → **weak**
- Strong ads band, hot leads, governance healthy, autopilot focus present → **strong**
- Hot leads + clear autopilot focus and no severe governance issue → **healthy**

Exact mapping lives in `growth-executive.service.ts` (`deriveGrowthExecutiveStatus`).

## Priority ordering

`buildGrowthExecutivePriorities()` in `growth-executive-priority.service.ts`:

1. Governance escalation / freeze / top risks  
2. High-scoring autopilot actions  
3. Fusion actions and one fusion problem line  
4. UTM insight problem lines  
5. Follow-up `due_now` and hot-lead pressure  

Maximum **5** items; each row includes a short **why** line.

## Safety guarantees

- Read-only aggregation; no Stripe, bookings, checkout, pricing, ads execution, or CRO mutations
- No auto-execution of growth actions
- Source systems and human approvals remain authoritative
- API gated by `FEATURE_GROWTH_EXECUTIVE_PANEL_V1`

## Feature flag

| Env | Default |
|-----|---------|
| `FEATURE_GROWTH_EXECUTIVE_PANEL_V1` | off |

When off: no API payload for the panel (403), dashboard panel hidden.

## Command-center bridge

`buildGrowthExecutiveSummary()` is exported from `growth-executive.service.ts` for optional reuse (read-only); no deep integration in this phase.

## Monitoring

`growth-executive-monitoring.service.ts` increments counters and emits `[growth:executive]` JSON logs (never throws).

## Validation commands

```bash
cd apps/web
npx vitest run modules/growth/__tests__/growth-executive.service.test.ts
npx vitest run modules/growth/__tests__/growth-executive-priority.service.test.ts
npx vitest run modules/growth/__tests__/growth-executive-monitoring.service.test.ts
```

---

The panel is **advisory only**; it does not execute actions or override policy.
