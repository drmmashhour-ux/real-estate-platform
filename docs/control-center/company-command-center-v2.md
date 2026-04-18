# Company Command Center V2

## Purpose

**Company Command Center V2** is a **tabbed**, executive-friendly layout that **organizes** the same read-only governance signals as the rest of the platform — without replacing or removing **AI Control Center V1**.

- V1 (`/admin/control-center`, `FEATURE_AI_CONTROL_CENTER_V1`) remains the classic single-page executive aggregate.
- V2 (`/admin/control-center-v2`, `FEATURE_COMPANY_COMMAND_CENTER_V2`) adds **tabs** for faster scanning: Executive, Growth, Ranking, Brain, Swarm, Rollouts.

No actions execute from V2; flags are not toggled; source-of-truth data is not mutated.

## Enablement

| Env | Code |
|-----|------|
| `FEATURE_COMPANY_COMMAND_CENTER_V2=true` | `controlCenterFlags.companyCommandCenterV2` |

When **off**, the V2 admin route returns **404** and `GET /api/admin/control-center-v2` returns **404**.

## Tabs

| Tab | Focus |
|-----|--------|
| **Executive** | Overall status, opportunities/risks, rollout chips, quick KPIs, link to V1 |
| **Growth** | Ads V8, CRO V8, growth loop summaries + growth opportunities/risks |
| **Ranking** | Ranking V8 summary + optional **Ranking V8 Governance** block when `FEATURE_RANKING_V8_GOVERNANCE_DASHBOARD_V1` is on |
| **Brain** | Brain V8 flags, fallback/overlap, opportunities/risks |
| **Swarm** | Swarm flags and advisory summary (no full swarm cycle on load) |
| **Rollouts** | Per-system rollout posture table (flags + health-derived) |

URL: `?tab=executive|growth|ranking|brain|swarm|rollouts` (default **executive**).

## Data sources

V2 **`loadCompanyCommandCenterV2Payload`** delegates to existing **`loadAiControlCenterPayload`** (V1 service) and **adds**:

- Tab-specific opportunity/risk strings (heuristic).
- `rollouts.rows` for the Rollouts tab.
- `executive.quickKpis` for the Executive tab.
- `ranking.governanceDashboardFlag` from `rankingV8ShadowFlags.rankingV8GovernanceDashboardV1`.

No duplicate subsystem **logic** — only composition and presentation helpers.

## Status & rollout meanings

- **Health** badges use the same unified statuses as V1 (`healthy`, `limited`, `warning`, `critical`, `disabled`, `unavailable`).
- **Rollout posture** (`RolloutPostureUi`) is a **governance label**: `disabled`, `shadow`, `influence`, `primary`, `limited`, `blocked`, `unavailable` — derived conservatively from flags + subsystem status; not a live mutation.

Missing optional metrics stay empty or **—**; they are not fabricated.

## Limitations

- Tab switching is **client URL state**; the API returns the **full** payload each time (tab query is reserved for future partial fetch).
- Ranking governance **detail** requires the governance dashboard env flag; otherwise the Ranking tab shows summary text only.
- Full **Swarm** multi-agent cycle is not run on page load (same constraint as V1).

## API

`GET /api/admin/control-center-v2?days=&limit=&offsetDays=&tab=` — admin session required.

Logs: `[control-center:v2]` with `request_received` (and `payload_ready` from the aggregator service).

## Validation

```bash
pnpm exec vitest run modules/control-center-v2/ app/api/admin/control-center-v2/route.test.ts
```

## Relationship to V1

V1 is **unchanged** in behavior. V2 is an **organizational / UX** layer on top of the V1 aggregate plus existing governance components.
