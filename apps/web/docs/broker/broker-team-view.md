# Broker team coaching view (manager / admin)

## Purpose

This surface gives **admins and team leads** a **private** snapshot of CRM-derived execution signals so they can coach, unblock, and recognize — **not** micromanage, automate discipline, or shame individuals.

What managers see stays **inside admin** (when `FEATURE_BROKER_TEAM_VIEW_V1` is enabled). Brokers do **not** receive a ranking screen from this module.

## What appears on screen

| Area | Meaning |
|------|--------|
| **Team summary strip** | Headcount-style cohort stats, average score (advisory), average “conversion signal” (won ÷ assigned leads **in-sample** — not marketplace conversion guarantees), follow-up **health** from overdue load versus volume. |
| **Team roster table** | Per-person score and execution band from the Broker Performance Engine, active pipeline breadth, overdue follow-ups (72h+ stall pattern), last CRM touch time, **support priority** tier (risk). |
| **Momentum / support / quiet lists** | Short lists for recognition, extra support, and outreach when telemetry shows long silence — **never** labelled as “worst performer”. |
| **Insights** | Deterministic cohort hints (delayed follow-ups, inactive desks, momentum concentration) plus **optional** coaching moves — always advisory. |
| **Broker drill-down** | Read-only breakdown: scores, pipeline stage counts, follow-up counters, incentive streaks/highlights when available, and alignment note for Broker AI Assist (assist only — drafts stay manual). |

## How to interpret scores

Scores blend contact coverage, progression, discipline, conversion signals, and sparse-data blending toward neutral. Treat them as **directional telemetry**:

- Prefer **patterns over single numbers** — one bad week shouldn’t dominate a narrative.
- When confidence is thin (few assigned leads), bands may sit at `insufficient_data` — that is intentional conservatism, not failure.
- **Risk** flags mean “consider a supportive conversation”, not disciplinary status.

## How to coach brokers (recommended)

1. Start with **private 1:1** framing — reference behaviors (follow-up logging, response cadence), not identity labels.
2. Use **insights text** as meeting agendas, not verdicts — adapt language to your culture.
3. Recognize **momentum** publicly only when brokers opt in — avoid surprise callouts.
4. Pair **pipeline snapshots** with capacity questions before assuming performance gaps.

## What **not** to do

- Do **not** paste internal ranking tables into broker chat channels.
- Do **not** tie compensation, quotas, or punishments directly to these scores without a separate governance process.
- Do **not** treat AI assist or insights as autopilot — execution stays with humans.
- Do **not** use “bottom broker” language; use “needs support”, “quiet workspace”, “pipeline risk”.

## Feature flag

Set `FEATURE_BROKER_TEAM_VIEW_V1=true` for internal rollout. Defaults off until deliberately enabled.
