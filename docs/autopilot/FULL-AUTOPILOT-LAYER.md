# LECIPM Full Autopilot Layer

## Philosophy (bounded autonomy)

LECIPM full autopilot is **not** blind platform-wide automation. It coordinates existing engines (marketing, growth, assistant, booking, deals, autonomy) behind a single **policy engine**, **approval queue**, **execution log**, and **rollback surface**.

- **Low-risk** actions may **auto-execute** only when domain mode + kill switch + policy rules agree.
- **High-risk** domains (pricing, capital, compliance, marketplace optimization) default to **approval-first** or **block** automatic paths in v1.
- Every evaluation writes to **`LecipmFullAutopilotExecution`**; queued work uses **`PlatformAutopilotAction`** (`entityType = lecipm_full_autopilot`).

## Domain matrix

Canonical domains live in `apps/web/modules/autopilot-governance/autopilot-domain-matrix.types.ts` and static defaults in `autopilot-domain-matrix.service.ts`.

Each row defines:

- `allowedModes`, `defaultMode`, `requiresApproval`, `supportsRollback`, `supportsKillSwitch`
- `riskLevel`, `reason`

Persisted overrides: `LecipmFullAutopilotDomainConfig` (`mode`, `killSwitch`, audit fields).

Modes (string in DB):

- `OFF`, `ASSIST`, `SAFE_AUTOPILOT`, `FULL_AUTOPILOT_APPROVAL`, `FULL_AUTOPILOT_BOUNDED`

Kill switch:

- `ON` — normal policy applies  
- `OFF` — block new executes for the domain  
- `LIMITED` — only whitelist low-risk action prefixes execute automatically

## Policy decision model

`full-autopilot-policy.service.ts` implements pure `evaluateAutopilotPolicy`.

Outcomes:

- `ALLOW_AUTOMATIC`
- `REQUIRE_APPROVAL`
- `BLOCK`

Each decision carries `policyRuleId`, `riskLevel`, `confidence`, `reason`. Optional caller `context` may force approval (`forceApproval`, `complianceSensitive`).

`full-autopilot-decision.service.ts` loads global pause + domain posture and returns explainable payloads.

## Execution flow

1. Integration calls `submitAutopilotCandidate` (`autopilot-execution.service.ts`).
2. Policy evaluated → execution row created (`autopilot-execution-log.service.ts`).
3. **ALLOW** → `persistAutomaticExecution` (runner) writes `PlatformAutopilotAction` executed (simulated unless `LECIPM_AUTOPILOT_EXECUTE=true`).
4. **REQUIRE_APPROVAL** → pending queue row.
5. **BLOCK** → execution log only.

## Approval flow

Queue surface: `autopilot-approval-queue.service.ts` maps platform autopilot rows to UI statuses (`PENDING` … `EXECUTED`).

Admin/Mobile APIs approve/reject via `approveQueuedPlatformAction` / `rejectQueuedPlatformAction`.

## Rollback

`autopilot-execution-rollback.service.ts` marks rollback on execution rows when `rollbackEligible`. Domain workers remain responsible for reconciling side effects; orchestrator stores audit markers on `PlatformAutopilotDecision`.

## Measurement

`autopilot-metrics.service.ts`, `autopilot-domain-metrics.service.ts`, `autopilot-roi.service.ts`, `autopilot-failure-analysis.service.ts`.

Outcome linkage: `autopilot-outcome-linkage.service.ts` writes `baselineBeforeJson`, `resultAfterJson`, `outcomeDeltaJson`.

## Operator UI & APIs

- Dashboard: `/dashboard/admin/full-autopilot`
- Detail: `/dashboard/admin/full-autopilot/[executionId]`
- REST: `/api/full-autopilot/*`
- Mobile admin: `/api/mobile/admin/full-autopilot/*`

## References

- Prisma: `LecipmFullAutopilotDomainConfig`, `LecipmFullAutopilotGlobalState`, `LecipmFullAutopilotExecution`
- Shared queue: `PlatformAutopilotAction`, `PlatformAutopilotDecision`
