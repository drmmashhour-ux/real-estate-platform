# Autopilot Operations Runbook (LECIPM)

## Daily operator workflow

1. Open **Full Autopilot Control Center** (`/dashboard/admin/full-autopilot`).
2. Scan **Alerts** and **Domains needing review** widgets.
3. Process **Approval queue** (approve / reject / inspect execution detail).
4. Use **Kill switches** or **Pause domain (OFF)** for instant containment.
5. **Global pause** stops all new autopilot evaluations (execution history retained).

## Emergency pause

### Global

- UI: **Pause all autopilot** → `POST /api/full-autopilot/pause` `{ "paused": true, "reason": "..." }`
- Mobile: `POST /api/mobile/admin/full-autopilot/pause`

### Single domain

- **Pause domain (OFF)** sets mode `OFF` for that matrix domain.
- Or set kill switch **OFF** / **LIMITED** per domain.

Effects are **immediate for new candidates**; in-flight external jobs must be handled by owning teams.

## Approval backlog

If alert **Approval backlog** fires:

1. Confirm staffing / SLA.
2. Batch **Approve low/medium-risk pending** only when consistent with compliance policy.
3. Escalate HIGH/CRITICAL items individually.

## Rollbacks

Only executions flagged `rollbackEligible` succeed via rollback API.

- UI rollback panel → `POST /api/full-autopilot/rollback/[executionId]` with `{ "reason": "..." }`.
- If rollback rejected (`not_reversible_under_current_policy`), document in incident channel and manually remediate downstream systems.

## Measurement caveats

- **Revenue / conversion** impacts require domain workers to populate `outcomeDeltaJson`; raw execution counts are not financial truth.
- **Estimated minutes saved** is a heuristic (`auto executions × 2 minutes`) until telemetry lands.

## Mobile admin

Endpoints (Bearer + admin role):

- `GET /api/mobile/admin/full-autopilot/summary`
- `GET /api/mobile/admin/full-autopilot/executions`
- `GET /api/mobile/admin/full-autopilot/approvals`
- `GET /api/mobile/admin/full-autopilot/alerts`
- `POST .../pause`, `.../domain/[domainId]/kill-switch`, approvals approve/reject

## Integration entry point

Engines should call `emitLecipmAutopilotCandidate` / builders in `autopilot-candidate-integration.service.ts` instead of duplicating policy checks.

## Database migration

Apply Prisma migration adding `lecipm_full_autopilot_*` tables before enabling in production.
