# Team coordination layer (V1)

Internal **role + status** layer for approved execution planner tasks. It does not run work, send messages, or change billing.

## How it connects to the execution planner

1. The **execution planner** proposes tasks (Today / This week) with confidence, warnings, and `targetSurface` for **navigation only**.
2. A task must be **approved** (`pending_approval` → `approved`) before anyone can assign it to a role or user.
3. **Coordination** tracks who owns follow-through (`assignedRole`, optional `assignedUserId`) and lifecycle status (`assigned` → `acknowledged` → `in_progress` → `done`, or `blocked` / `skipped`).

Denied tasks stay in the approval store with a reason — they are not silently deleted.

## Default role hints

`suggestDefaultRole` in `team-coordination-role-mapper.service.ts` maps categories and keywords to one of:

`admin`, `operator`, `growth_owner`, `broker_ops_owner`, `city_owner`, `revenue_owner`.

These are **hints** for the coordination UI. Actual assignment is always explicit.

## Assignment rules

- **No assignment** until the task is **approved**.
- Assigning to a role sets status to `assigned` (if unassigned).
- Assigning to a user requires approval; status becomes `assigned` when starting from `unassigned`.
- **No silent reassignment** — updates stamp `assignedBy` / events for audit-style monitoring logs.

## Status meanings

| Status | Meaning |
|--------|---------|
| `unassigned` | Row exists but no owner (rare in V1 — usually first action creates `assigned`). |
| `assigned` | Role and/or user set; ready to acknowledge. |
| `acknowledged` | Owner has seen the task. |
| `in_progress` | Active work outside this system. |
| `done` | Closed by operator — **not** auto-completed by the platform. |
| `blocked` | Dependency or external blocker documented (optional `note`). |
| `skipped` | Consciously deprioritized. |

Valid transitions are enforced in `validateStatusTransition` (`team-coordination.service.ts`).

## What this layer does **not** do

- Not a full project management suite (no Gantt, no cross-project dependencies UI).
- No automatic execution, no outbound messaging, **no Stripe / checkout / booking mutations**.
- User assignment beyond simple ID strings — no HR or permissions matrix here.

## Persistence

V1 uses **in-memory** maps (approvals + assignments). Restarts clear state — acceptable for internal pilot; promote to DB when needed.

## Monitoring

- `[growth:team-coordination]` — assignment events and summary builds (`team-coordination-monitoring.service.ts`).
