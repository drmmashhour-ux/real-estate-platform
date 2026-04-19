# Execution planner (approval-based)

Turns existing growth intelligence modules into **bounded, explainable task lists** for **Today** and **This week**. This is planning and prioritization — **not autopilot**.

## What generates tasks

Inputs are merged only when upstream **feature flags** enable those modules:

| Source | Origin |
|--------|--------|
| `allocation` | Capital allocation engine recommendations |
| `weekly_review` | Weekly review summary (`priorityFocus`, `nextActions`, thin-signal rows) |
| `ai_assist` | Deterministic CRM-style AI execution suggestions |
| `domination_plan` | City domination checklist slices |
| `mission_control` | Mission Control action bridge |
| `flywheel` | Marketplace flywheel auto-suggest (when enabled) |

Tasks are **deduplicated** on stable keys: `source` + `category` + normalized title slug. Duplicates merge warnings/descriptions while keeping the **highest priority** tier.

### Bounds

Constants: `EXECUTION_PLAN_TODAY_MAX` (= **5**) and `EXECUTION_PLAN_WEEKLY_MAX` (= **9**) in `execution-planner.service.ts`.

- **Today:** top **5** executable tasks after blocking and sort.
- **This week:** the next **9** executable tasks (positions 6–14 of the sorted list).

Blocking may move rows into **Blocked** with `blockReason` and `unblockSuggestion`.

## Priorities (HIGH / MEDIUM / LOW)

Logic lives in `execution-planner-priority.service.ts` (`computeTaskPriorityWithRationale`).

**HIGH tier** when any of:

- Mission Control marks a **top** navigation bridge item (`missionControlTop`).
- **Strong allocation:** score ≥ **72** and allocation confidence **high**.
- **Urgent weekly:** `weeklyUrgent` and bundle confidence **medium or high**.
- **Strong AI:** CRM suggestion confidence ≥ **0.72** and weekly bundle is not **low**.

**MEDIUM tier:** solid allocation (≥ **58**, confidence not low), AI ≥ **0.55**, domination early phase (`dominationPhase === 0`), or other weekly follow-through cases in the branching logic.

**LOW tier:** weak weekly bundle without overrides, exploratory signals, flywheel **`flywheelLowConfidence`** branch (explicit rationale), or default fallback.

Every decision returns a **deterministic rationale string** for audit/readability — not ROI guarantees.

## Blocking logic

Implemented in `execution-planner-blocking.service.ts`. A task becomes **blocked** when the **first** matching rule fires:

1. **Governance freeze/block** — blocks operational tasks except the advisory governance suggestion row (`ai_assist` + id `scale-v2-governance`).
2. **Weekly bundle low + non-low priority weekly task** — urgent weekly claims need validation when bundle confidence is low.
3. **Sparse AI telemetry + pricing-like title** — monetization posture lines are exploratory.
4. **Low-confidence flywheel + priority not low** — avoid treating as execution-ready.

Blocked tasks retain full task fields plus `blockReason` and `unblockSuggestion`.

## Why approval is required

Every task has `requiresApproval: true`. Approval states (`pending_approval`, `approved`, `denied`) live in `execution-planner-approval.service.ts`.

- **Approval does not execute anything** — no CRM writes, ads API calls, emails, or payments.
- **Denied** tasks remain visible via `listDeniedRecords()` — they must not disappear silently.

Navigation uses `growth-task-navigation.ts` (`from=execution-planner&taskId=...`) and optional hash targets — **navigation only**.

## Safety

- No automated execution, no outbound sends.
- No Stripe, checkout, subscription, or booking mutations from this layer.
- Confidence and warnings are always part of the task model for transparency.

## Monitoring

- `[growth:execution-planner]` — plan generation, approvals/denials, opens (`execution-planner-monitoring.service.ts`).
