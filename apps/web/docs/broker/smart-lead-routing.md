# Smart lead routing (V1 — advisory)

Ranks broker **candidates** for a CRM lead using deterministic signals. **Does not** assign brokers, change Stripe, alter lead ingestion, or block access.

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_BROKER_ROUTING_V1=1` | Enables `buildLeadRoutingSummary` and admin APIs. |
| `FEATURE_BROKER_ROUTING_PANEL_V1=1` | Shows the internal panel on lead detail for **ADMIN** (requires routing V1 on the server for the API). |

Defaults: both `0` in `apps/web/.env.example`.

## Routing dimensions (sub-scores 0–100)

| Dimension | Inputs |
|-----------|--------|
| Region | Lead city / `purchaseRegion` vs broker `homeCity` / `homeRegion` (normalized match). |
| Intent | Inferred lead intent vs broker `launchPersonaChoice` / `growthOutreachSegment`. |
| Performance | `buildBrokerPerformanceSummary` overall score when available. |
| Response | Performance breakdown `responseSpeedScore`. |
| Availability | Count of broker’s assigned leads touched in the last 30 days (workload proxy). |

Overall rank score is a **fixed weighted blend** of the five; then `classifyBrokerRoutingFit` maps to **strong / good / watch / low**.

## Ranking

`rankBrokerRoutingCandidates` sorts by `rankScore`, then `performanceFitScore`, then `responseFitScore`, then `brokerId`. **Top 5** only.

## APIs

- `GET /api/admin/leads/[leadId]/routing` — JSON `{ summary: LeadRoutingSummary }` (ADMIN + flag).
- `GET /api/admin/routing/readiness` — cohort readiness (ADMIN + flag).

## Safety

- Read-only; no Prisma updates to `Lead` or `User` from this module.
- Brokers do not see competitor routing panels in V1 (admin lead detail only).
- “Why” lines are generated only from actual sub-scores and data-availability notes.

## Validation

```bash
cd apps/web && pnpm exec vitest run modules/broker/routing/__tests__
```
