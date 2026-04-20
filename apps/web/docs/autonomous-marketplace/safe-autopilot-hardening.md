# Safe autopilot hardening

Bounded verification, rollback, and failure classification for **reversible internal actions only** — no outbound loops, no black-box ML.

## Components

| Module | Role |
|--------|------|
| `execution-verification.service.ts` | `verifyActionOutcome` / batch — confirms expected post-state after execution |
| `rollback.service.ts` | `rollbackControlledAction` — reversible internal paths only; audit + timeline |
| `failure-recovery.service.ts` | `classifyExecutionFailure`, `recommendRecoveryPath`, retry/manual follow-up markers (deterministic, bounded) |

## Engine integration

When `FEATURE_AUTOPILOT_HARDENING_V1` (and related execution verify/rollback flags where present) are on, the autonomous marketplace engine may verify outcomes after `applyControlledAction` and trigger rollback when verification fails and the action class is reversible.

## Guardrails

- Compliance block and policy block cannot be bypassed by rollback or retry metadata.
- Preview paths never invoke apply/verify/rollback.

## Audit

Execution audit service + governance timeline events record attempts, decisions, outcomes, and rollbacks — append-only, redacted payloads.
