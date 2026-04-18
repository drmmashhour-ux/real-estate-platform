# Growth Decision Journal (V1)

## Purpose

The **Growth Decision Journal** is a **read-only, in-memory** layer that normalizes what the growth stack currently recommends, what governance/autopilot posture implies, and **conservative** “reflection” hints against the **same snapshot** (not longitudinal truth). It tightens the accountability loop between strategy, human choices, execution signals, and learning **without** persisting rows, mutating CRM/Stripe/ads/CRO core, or auto-executing anything.

## Entry sources

Entries are derived from (when respective subsystems are enabled and data is available):

- **Autopilot** — action titles with approval/execution status
- **Executive** — priorities, risks, ads band
- **Governance** — posture, human review queue
- **Strategy** — weekly priorities, blockers
- **Simulation** — scenario recommendations (`consider` / `caution` / `defer`)
- **Mission Control** — mission focus, checklist, review queue (via assembled MC summary)
- **Daily brief** — focus, priorities, blockers
- **Agents** — top coordination proposals
- **Manual** — partial-data warnings

## Decisions

`recommended` | `approved` | `rejected` | `executed` | `deferred` | `review_required` — mapped deterministically from source signals (e.g. autopilot status + execution status).

## Reflections

Reflections use **only** the current build pass (executive ads band, governance status, mission status, hot leads, etc.). Weak or missing evidence maps to `insufficient_data` or sparse reflections — **no invented outcomes**.

## Stats

Counts summarize entry decisions and reflection outcomes (positive / negative / neutral) in the current snapshot.

## Advisory insights (`buildGrowthDecisionJournalInsights`)

When **`FEATURE_GROWTH_DECISION_JOURNAL_BRIDGE_V1`** is on, compact strings are available for Mission Control notes, the journal API response, and optionally the Learning panel (two lines, advisory).

## Safety

- No Stripe, bookings, checkout, pricing, ads execution, or CRO core changes.
- Source systems remain authoritative; journal is **narrative normalization only**.
- **No database persistence in v1** — built on demand per request.

## Feature flags (default off)

| Env | Role |
|-----|------|
| `FEATURE_GROWTH_DECISION_JOURNAL_V1` | Core journal + API |
| `FEATURE_GROWTH_DECISION_JOURNAL_PANEL_V1` | Dashboard panel |
| `FEATURE_GROWTH_DECISION_JOURNAL_BRIDGE_V1` | Insights in API, Mission Control, Learning bridge |

Aliases: `FEATURE_GROWTH_DECISION_JOURNAL_*` in `config/feature-flags.ts`.

## Validation

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/growth-decision-journal
```

## Monitoring

Prefix `[growth:decision-journal]` — see `growth-decision-journal-monitoring.service.ts`.
