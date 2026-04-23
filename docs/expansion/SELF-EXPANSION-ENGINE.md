# Self-Expansion Engine

Strategic territory expansion layer for LECIPM: ranks markets, proposes entry hubs and phased plans, tracks human decisions and outcomes, and nudges scoring weights from completed results. **v1 does not auto-launch new territories or assume regulatory compliance.**

## Architecture

| Piece | Responsibility |
| ----- | ---------------- |
| **Context** | `buildExpansionContext()` merges Market Domination snapshot, AI CEO signals, revenue predictor admin summary, Growth Brain top region, and city-launch playbook completion per territory. |
| **Scoring** | `scoreTerritoryExpansion()` composes revenue/growth proxies, supply–demand imbalance, strategic fit, competitor weakness, ops feasibility, readiness, and configurable regulatory flags into a 0–100 expansion score plus confidence. |
| **Entry strategy** | `buildEntryStrategy()` picks lead hub (`BROKER`, `LISTINGS`, `BNHUB`, `INVESTOR`, `RESIDENCE_SERVICES`), first actions, risks, GTM angle from archetype + metrics. |
| **Phasing** | `buildPhasePlan()` maps action band + readiness to `DISCOVERY` → `DOMINATE` with goals, blockers, exit criteria. |
| **Recommendations** | `buildTerritoryRecommendationDraft()` fingerprints rows, attaches explainability, and stays **approval-gated** for high-impact bands. |
| **Persistence** | `syncSelfExpansionRecommendationsFromEngine()` upserts `lecipm_self_expansion_recommendations`; pending rows refresh fully. |
| **Learning** | `lecipm_self_expansion_learning_state` stores hub / blocker / archetype lifts; positive completions slightly increase lifts (bounded). |

## Scoring model

Scores are **relative rankings**, not ROI guarantees. Inputs include domination + readiness from the domination dashboard, broker density, BNHub opportunity proxies, investor interest, competitor pressure, and `SELF_EXPANSION_EXTRA_REG_FLAGS` (comma-separated) merged into regulatory flag hints.

## Entry strategy logic

Archetypes (`metro_core`, `tourist_corridor`, `investor_dense`, etc.) seed hub priority order; live metrics (renter demand, BNHub supply gap, investor signal, broker bench) may promote BNHub, Investor, or Broker to the lead hub.

## Phase model

Phases follow `DISCOVERY`, `PREPARE`, `TEST`, `LAUNCH`, `EXPAND`, `DOMINATE` with narrative goals aligned to action bands `WATCH`, `PREPARE`, `ENTER`, `SCALE`, `PAUSE`.

## Approval workflow

States: `PROPOSED` → `APPROVED` \| `REJECTED` \| `PAUSED` \| `IN_PROGRESS` → `COMPLETED`. Every transition logs `SELF_EXPANSION_DECISION` via the audit service. **No automated territory launch** in product workflows from this module in v1.

## Learning loop

On `COMPLETED` with an outcome band matching positive/meaningful/strong patterns, hub and archetype lifts increment slightly (capped) to bias future ordering — operators can still override via approvals.

## Operator workflow

1. Open **Dashboard → Self-expansion engine** (`/dashboard/admin/self-expansion`).  
2. Refresh to sync engine output into the audit table.  
3. Review ranked territories, approve/reject/pause/progress/complete with notes.  
4. Drill into a territory for explainability + phase detail.  
5. Mobile admins: `/api/mobile/admin/self-expansion/*` for summaries and territory detail.

## Integration

`buildSelfExpansionDashboardHints()` feeds the **Autonomy Command Center** summary with next territory, top blocker, lead hub, and urgency for cross-surface awareness.
