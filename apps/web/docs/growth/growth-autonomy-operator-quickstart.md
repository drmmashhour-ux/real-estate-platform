# Growth autonomy — operator quickstart

## Where to look

1. **Growth machine** hub → **Rollout status** strip at the top of the autonomy section.
2. **Snapshot table** — each row: disposition badge, policy signal, optional prefill (link or copy).
3. **Internal validation checklist** (pilots / admins / debug) — track what you verified.
4. **Test scenarios A–E** — collapsible helper on the same page.

## What each state means

| Strip / badge | Meaning |
| --- | --- |
| Rollout mode `internal` | Production snapshots are restricted; see “Internal gate” line. |
| Kill switch on | Autonomy suppressed entirely — safe default for incidents. |
| Enforcement unavailable | Policy layer flag off or snapshot missing — treat suggestions as **reduced** rigor. |
| `suggest_only` | Advisory — you apply changes manually in target panels. |
| `blocked` / `frozen` | Policy blocks or freezes this target — do not assume clearance. |
| `approval_required` | Human decision required before downstream action; follow “Where to route”. |
| `prefilled_action` | SAFE_AUTOPILOT + allow — link or copy only; **no auto-apply**. |

## Prefills

- **Navigate** — opens Growth Machine with a `growthAutonomyFocus` query (or path copy). Clicking logs a non-blocking telemetry event.
- **Copy** — copies text (e.g. dashboard path). Paste where you need it; nothing is saved server-side from the copy action alone.

## When to stop and escalate

- Counts do not match what you expect after a policy change.
- Enforcement stays “partial” with no explanation.
- Any suggestion implies automatic execution — **that is a bug**; capture a screenshot and escalate.

## Kill switch

If anything looks unsafe, ask an admin to enable `FEATURE_GROWTH_AUTONOMY_KILL_SWITCH`, confirm suppression, then investigate.
