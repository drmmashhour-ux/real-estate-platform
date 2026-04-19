# Execution accountability layer (V1)

**What it is:** A read-only, in-memory **shared view** of operator check-in data for the 14-day **Daily routine**, **Montréal domination** plan, and **pitch script** copy events. It does **not** run workflow, send messages, or change leads, payments, or bookings.

**What it is not:** Automation, enforcement, or a project-management system.

## What is tracked

| Source | `surfaceType` | Semantics |
|--------|-----------------|-----------|
| Daily routine checkboxes | `daily_routine` | One server row per `itemId` (e.g. `d3-b0-a1`) and user; latest state wins. |
| Montréal 30-day checkboxes | `city_domination_mtl` | One row per `wN-aI` and user. |
| “Copy” on 60s / 5 min script | `pitch_script` | Append-only **usage** event (`copy_60_sec` / `copy_5_min`); not a “checklist complete” in the same sense. |

## What is not tracked

- Email, ads, CRM, or messaging actions.
- Financial or subscription state.
- Whether a user *actually* performed work off-platform (only that they checked a box or copied text while signed in and the feature is on).

## Local vs shared

- **Local (default):** Checklist state lives in `localStorage` (keys unchanged). Works with accountability flags **off**.
- **Shared:** When `FEATURE_EXECUTION_ACCOUNTABILITY_V1=true`, toggling copy/completions POSTs to `/api/growth/execution-accountability` for the **authenticated** user only (server ignores spoofed user ids). The accountability **panel** requires both `FEATURE_EXECUTION_ACCOUNTABILITY_V1` and `FEATURE_EXECUTION_ACCOUNTABILITY_PANEL_V1`.

If the POST fails (network, flag off server-side), local UI still updates — no blocking.

## Completion rates

- **Checklists:** Expected slot counts come from `build14DayRoutine()` and `buildMontrealDominationPlan()` (deterministic templates).
- **Aggregate summary:** For each operator with activity, completion rate = `(daily completes + MTL completes) / (daily slots + MTL slots)`. Rates are capped at deterministic denominators × active user count where noted in code.
- **Pitch script:** Surface row shows **event count** (completion rate shown as `1` when events exist — interpret as “usage intensity”, not checklist quality).

When **low data** is true (`summary.lowData`), comparisons between operators are intentionally conservative (see insights).

## Limits

- Stores are **in-memory** on the app server — **cold start resets** history.
- Bounded trims (logical keys ~8k, pitch events ~2.5k) prevent runaway growth.
- No encryption of extra fields beyond normal app transport — internal operators only.

## Interpretation guidelines

- Use insights as **discussion prompts**, not KPI verdicts.
- Prefer weekly review conversations over numeric targets.
