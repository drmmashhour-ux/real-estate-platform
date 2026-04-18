# Autonomous growth simulations (V1)

## Purpose

**Growth simulations** are a safe **what-if** layer: bounded, deterministic **estimates** of directional upside/downside for planning. They do **not** predict actual revenue, do **not** auto-execute, and do **not** change Stripe, bookings, ads execution, CRO core logic, or source-of-truth data.

## Baseline inputs

`buildGrowthSimulationBaseline()` aggregates read-only signals:

- Executive summary (leads, hot leads, due follow-ups, campaign band, top campaign, status)
- Daily brief focus (when daily brief flag is on)
- Governance status (when governance flag is on)
- Strategy top priority (when strategy bundle is available)
- Early-conversion snapshot for today’s lead count and funnel band (when available)

Missing pieces add **warnings** only; the engine stays conservative.

## Default scenarios

When `FEATURE_GROWTH_SIMULATION_SCENARIOS_V1` is on, `buildGrowthSimulationScenarios()` returns five templates:

1. Increase acquisition  
2. Fix conversion first  
3. Improve follow-up  
4. Improve content  
5. Mixed strategy (small moves across levers)

Each lists **assumptions** and modest `targetChange` hints — not execution targets.

## Simulation rules

`simulateGrowthScenario()` applies **capped** percentage deltas (≤ ~22%), adjusts for weak conversion when scaling acquisition, and reduces confidence when data is partial or the funnel band is weak. Every line is labeled as an **estimate** in engine notes.

## Risk model

`evaluateGrowthSimulationRisks()` adds compact, severity-tagged risks (e.g. scaling acquisition while conversion is weak, governance review states, mixed-strategy complexity).

## Recommendation model

`buildGrowthSimulationRecommendation()` maps estimates + risks + confidence to **consider**, **caution**, or **defer** — advisory labels only.

## Safety guarantees

- No writes, no outbound messaging, no payments/booking changes.
- Outputs are **estimates** for human review.
- API and bundle are gated by `FEATURE_GROWTH_SIMULATION_V1`.

## Feature flags

| Env | Role |
| --- | --- |
| `FEATURE_GROWTH_SIMULATION_V1` | Master gate — bundle + `GET /api/growth/simulation` |
| `FEATURE_GROWTH_SIMULATION_SCENARIOS_V1` | Populate default scenarios (off → empty scenario list, baseline still returned) |
| `FEATURE_GROWTH_SIMULATION_PANEL_V1` | Dashboard panel (still requires master flag for API) |

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/growth-simulation*.test.ts
```
