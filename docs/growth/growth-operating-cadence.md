# Growth operating cadence (V1)

## Purpose

The **cadence layer** adds a structured **daily + weekly operating rhythm** on top of the existing growth stack (executive panel, daily brief, governance, strategy, multi-agent coordination, autopilot, messaging / response desk, learning + learning control).

It answers, in one place:

- What should we focus on **today**?
- What are the **risks**?
- What is the **weekly direction**?
- What should **not** be done yet (warnings)?

**It does not execute anything** — no Stripe, bookings, ads execution, CRO mutations, or source-of-truth writes.

## Daily loop

`buildGrowthDailyCadence()` composes:

- A **focus** line (daily brief focus → executive top priority → strategy top priority).
- A **checklist** (max **5** items) from executive priorities, agents, governance, learning control, response desk hints, and brief priorities.
- **Risks** from governance, learning freeze/reset hints, weak funnel / executive signals, and brief blockers.
- **Notes** (coordination notes + partial-data warnings).

Overall **status** uses `deriveGrowthCadenceStatus()` (executive + governance + learning control).

## Weekly loop

`buildGrowthWeeklyCadence()` composes:

- **Strategy focus** from the strategy plan (when enabled) or executive.
- **Priorities** — strategy priorities first, else executive priorities.
- **Experiments** — from strategy plan (up to 3).
- **Roadmap focus** — strategy roadmap summary or weekly plan roadmap (short strings).
- **Warnings** — governance escalation, learning control reset, weak executive campaign band, learning summary warnings.

Week start is **UTC Monday** (ISO date).

## Integration (read-only bridges)

| Source | Use |
| --- | --- |
| Daily brief | Focus + priorities + blockers as risks |
| Executive | Status, priorities, hot leads, campaign band |
| Governance | Risks, checklist when caution/watch |
| Strategy bundle | Top priority, weekly priorities/experiments/roadmap |
| Multi-agent coordination | Top agent priorities + notes |
| Response desk | Optional hint: titles + counts (when response desk flag on) |
| Learning | `getGrowthLearningReadOnlyForCadence()` — **no weight application**, no learning run records |

Cadence **references** other panels by consuming their outputs; it does not re-implement scoring or execution rules.

## Safety guarantees

- Deterministic, explainable composition.
- Safe with partial data (missing modules add warnings, not crashes).
- Learning path for cadence uses **`getGrowthLearningReadOnlyForCadence()`** so adaptive weights are **not** applied as a side effect of building cadence.

## Feature flag

| Env | Default |
| --- | --- |
| `FEATURE_GROWTH_CADENCE_V1` | off — hides panel and `/api/growth/cadence` |

## API

- `GET /api/growth/cadence` — returns `{ bundle }` when the flag is on and the user passes growth-machine auth (same pattern as strategy).

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/growth-cadence*.test.ts
```
