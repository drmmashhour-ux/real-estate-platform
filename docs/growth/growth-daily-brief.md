# Daily Growth Brief

## Purpose

The **Daily Growth Brief** is a read-only, deterministic rollup that answers:

- **What happened yesterday?** — Early-conversion (`early_conversion_lead`) counts by UTC day, UTM campaign breadth, and top campaign.
- **What matters today?** — Reuses the **Growth Executive** engine (`buildGrowthExecutiveSummary` + `buildGrowthExecutivePriorities`) for priorities and overall status — **no duplicated priority rules**.
- **What needs attention?** — Advisory blockers and short notes derived from executive risks, follow-up pressure, and UTM funnel signals.

It does **not** execute actions, change CRM data, or touch payments, ads APIs, or CRO experiments.

## Architecture

| Piece | Role |
|--------|------|
| `growth-daily-brief.types.ts` | `GrowthDailyBrief` shape |
| `growth-daily-brief.service.ts` | `buildGrowthDailyBrief()` — orchestrates executive + UTM windows |
| `growth-ai-analyzer.service.ts` | `fetchEarlyConversionYesterdayStats()` — yesterday UTC slice for `FormSubmission` early leads |
| `growth-executive.service.ts` | Single source of truth for company status and priorities |
| `growth-daily-brief-monitoring.service.ts` | Counters + `[growth:daily-brief]` logs (never throws) |
| `GET /api/growth/daily-brief` | JSON for the dashboard panel (flag-gated) |
| `GrowthDailyBriefPanel.tsx` | UI on the Growth Machine dashboard |

## Logic rules (examples)

- **Priorities:** Top 3 titles from executive priorities; padded with `"Review new leads"` / `"Check campaign performance"` if fewer than three exist.
- **Focus:** Autopilot `focusTitle` when present, else executive `topPriority`.
- **Status:** Same as executive (`weak` \| `watch` \| `healthy` \| `strong`).
- **Blockers (non-exhaustive):** No early-conversion leads today (UTC window); zero yesterday leads while UTM campaigns were active; follow-up “due now” backlog; weak ads band; top executive risks; first paid-funnel insight problem line.
- **Notes:** Contextual copy (e.g. which campaign led yesterday, low activity, drift vs lifetime top campaign).

## Safety guarantees

- **Advisory only** — Display and logs; no mutations.
- **Bounded** — Caps on list lengths; safe defaults if services fail.
- **Explainable** — Strings cite observable signals (counts, bands, queue pressure).
- **Partial data** — Missing yesterday or early snapshots degrades counts to `0` and adds monitoring warnings; executive failure returns a **watch** stub with a single blocker.

## Feature flags

| Env | Default | Effect |
|-----|---------|--------|
| `FEATURE_GROWTH_DAILY_BRIEF_V1` | off | When off, API returns 403 and the dashboard panel is not rendered. |

Executive panel remains gated separately by `FEATURE_GROWTH_EXECUTIVE_PANEL_V1`. The brief **calls** the executive builder internally whenever the daily brief API runs, even if the executive **panel** is off (shared engine).

## Validation commands

From `apps/web`:

```bash
npx vitest run modules/growth/__tests__/growth-daily-brief.service.test.ts
pnpm exec tsc --noEmit -p tsconfig.json
```

## Source of truth

CRM, forms, autopilot approvals, and external ad platforms remain authoritative. The brief is a **lens**, not a controller.
