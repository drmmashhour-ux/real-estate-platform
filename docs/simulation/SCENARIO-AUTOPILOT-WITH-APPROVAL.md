# Scenario Autopilot with Approval Gate (LECIPM)

## Architecture

- **Module:** `apps/web/modules/scenario-autopilot/`
- **Persistence:** `LecipmScenarioAutopilotRun` (`lecipm_scenario_autopilot_runs`) stores generated candidates (JSON), ranking, approval metadata, execution log, outcomes, rollback.
- **Simulation:** Each candidate is evaluated with the existing **what-if engine** (`runWhatIfSimulation`) — **read-only baselines**, no marketplace writes during simulation.
- **Execution:** Only the `executeApprovedRun` path runs after `APPROVED`. It records auditable steps; product-specific connectors (marketing, CRM, visits) are integration points — not hard-coded financial posts in the runner.

## Lifecycle

1. **GENERATED / READY_FOR_REVIEW** — `createScenarioAutopilotRun` generates candidates, simulates, ranks, persists. Default status is `READY_FOR_REVIEW`.
2. **APPROVED** — Admin approves via API; `approvedByUserId` / `approvedAt` set.
3. **EXECUTING → EXECUTED** — `executeApprovedRun` (only if `APPROVED`). Policy may mark some steps `blocked` (e.g. large pricing delta) while still recording audit.
4. **REJECTED** — Reject with reason; optional `revision_requested:` prefix for follow-up.
5. **REVERSED** — `rollbackRun` when the best candidate was `reversible`; records `rollbackJson`.
6. **FAILED** — Reserved for future explicit failure states.

## Approval workflow

- Approve: `POST /api/admin/scenario-autopilot/runs/[id]/approve`
- Reject: `POST .../reject` with `{ reason, requestRevision? }`
- Execute: `POST .../execute` (requires `APPROVED`)
- Rollback: `POST .../rollback` with `{ reason }` (requires `EXECUTED` + reversible candidate)
- Outcome: `POST .../outcome` — measures read-only baselines after execution window

## Ranking logic

Composite score per candidate: modeled upside (revenue, conversion, trust) minus downside (dispute risk, operational complexity, scenario risk tier), plus confidence and reversibility bonuses, minus governance/effort penalties. See `scenario-ranking.service.ts`.

## Execution flow

Only after approval. Steps are appended to `executionLogJson`. Domains that need separate investment/legal workflows are **blocked** from naive application with an explicit audit message.

## Rollback logic

If the selected candidate is not `reversible`, rollback is refused with an explanation. Otherwise a `REVERSED` status and `rollbackJson` capture actor, time, and reason; physical config restore is product-specific.

## Measurement model

`measureOutcomeForRun` compares `baselineAtGeneration` to a fresh `loadSimulationBaseline` snapshot and stores `outcomeJson`. Match quality is heuristic (`yes` / `partial` / `no` / `unknown`).

## Mobile

- `GET /api/mobile/admin/scenario-autopilot/summary`
- `GET /api/mobile/admin/scenario-autopilot/pending`
- `GET /api/mobile/admin/scenario-autopilot/executed`

## Command Center

Executive view includes a **Scenario Autopilot** strip (pending / executed / failed counts) linking to `/dashboard/admin/scenario-autopilot`.

## Logging

Structured console lines use tags: `[scenario]`, `[simulation]`, `[approval]`, `[execution]`, `[rollback]`, `[outcome]` (see `scenario-autopilot-log.ts`).
